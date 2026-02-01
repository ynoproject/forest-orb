const eventExpRanks = [
  {
    exp: 40,
    badge: null
  },
  {
    exp: 100,
    badge: 'mono'
  },
  {
    exp: 250,
    badge: 'bronze'
  },
  {
    exp: 500,
    badge: 'silver'
  },
  {
    exp: 1000,
    badge: 'gold'
  },
  {
    exp: 2000,
    badge: 'platinum'
  },
  {
    exp: 0,
    badge: 'diamond'
  }
];
let eventPeriodCache;
let eventsCache = {};

function initEventControls() {
  const openEvents = () => openModal('eventsModal');
  document.getElementById('eventsButton').onclick = openEvents;
  for (let tab of document.getElementsByClassName('eventTab'))
    tab.onclick = onClickEventTab;
}

function onClickEventTab() {
  const eventTabs = document.getElementById('eventTabs');
  const tabIndex = Array.prototype.indexOf.call(eventTabs.children, this);
  const activeTabIndex = Array.prototype.indexOf.call(eventTabs.children, eventTabs.querySelector('.active'));
  if (tabIndex !== activeTabIndex) {
    for (let eventTab of document.getElementsByClassName('eventTab')) {
      eventTab.classList.toggle('active', eventTab === this);
      document.getElementById(`event${eventTab.dataset.tabList.slice(0, 1).toUpperCase()}${eventTab.dataset.tabList.slice(1)}List`).classList.toggle('hidden', eventTab !== this);
    }
  }
}

function updateEventPeriod() {
  if (!loggedIn)
    return;
  sendSessionCommand('ep');
}

function onUpdateEventPeriod(eventPeriod) {
  if (!eventPeriod || eventPeriod.periodOrdinal < 0)
    return;
  
  eventPeriod.endDate = new Date(eventPeriod.endDate);
  document.getElementById('eventPeriod').innerHTML = getMassagedLabel(localizedMessages.events.period.replace('{ORDINAL}', eventPeriod.periodOrdinal), true);
  document.getElementById('eventPeriodEndDateLabel').innerHTML = getMassagedLabel(localizedMessages.events.periodEnds.replace('{DATE}', eventPeriod.endDate.toLocaleString(globalConfig.lang === 'en' ? [] : globalConfig.lang, { "dateStyle": "short", "timeStyle": "short" })), true);
  document.getElementById('eventControls').style.display = 'unset';
  eventPeriodCache = eventPeriod;
  updateEvents();
}

function updateEvents() {
  if (!loggedIn || !eventPeriodCache)
    return;
  sendSessionCommand('e');
}

function onUpdateEvents(events, ignoreLocationCheck) {
  if (!events)
    return;

  const eventTypes = Object.keys(events);
  const eventNewGameIds = [];

  for (let eventType of eventTypes) {
    eventsCache[eventType] = events[eventType].map(l => {
      if (typeof l.endDate === 'string') {
        if (eventType === 'locations' && l.game === '2kki') {
          let adjustedDepth = Math.floor(l.depth / 3) * 2;
          if (l.depth % 3 === 2)
            adjustedDepth++;
          l.depth = Math.min(adjustedDepth, 10);
          if (l.minDepth) {
            let adjustedMinDepth = Math.floor(l.minDepth / 3) * 2;
            if (l.minDepth % 3 === 2)
              adjustedMinDepth++;
            l.minDepth = Math.min(adjustedMinDepth, 10);
          }
        }
        l.endDate = new Date(l.endDate);
      }
      return l;
    });
    for (let event of eventsCache[eventType]) {
      if (event.game && !gameMapLocations[event.game] && eventNewGameIds.indexOf(event.game) === -1)
        eventNewGameIds.push(event.game);
    }
  }

  if (eventNewGameIds.length) {
    const fetchLocationTasks = eventNewGameIds.map(gameId => fetchAndInitLocations(globalConfig.lang, gameId));
    Promise.allSettled(fetchLocationTasks).then(() => onUpdateEvents(events, ignoreLocationCheck));
    return;
  }
    
  const eventsStr = JSON.stringify(Object.values(eventsCache).flat().map(el => el.title));
  if (config.lastEvents !== eventsStr) {
    showEventsToastMessage('listUpdated', 'expedition');
    config.lastEvents = eventsStr;
    updateConfig(config);
  }

  for (let eventType of eventTypes) {
    const eventTypeName = `${eventType.slice(0, 1).toUpperCase()}${eventType.slice(1, -1)}`;

    const eventsList = document.getElementById(`event${eventTypeName}sList`);
    eventsList.innerHTML = '';

    let lastType;

    for (let event of eventsCache[eventType]) {
      if (lastType === undefined || event.type !== lastType) {
        const eventLocationTypeContainer = document.createElement('div');
        
        const eventLocationTypeLabel = document.createElement('h3');
        eventLocationTypeLabel.innerHTML = getMassagedLabel(eventType === 'locations' ? localizedMessages.events.types[event.type] : localizedMessages.events.current, true);

        eventLocationTypeContainer.appendChild(eventLocationTypeLabel);
        eventsList.appendChild(eventLocationTypeContainer);

        lastType = event.type;
      }

      const eventGameId = event.game || gameId;
      
      const eventListEntry = document.createElement('div');

      eventListEntry.classList.add(`event${eventTypeName}ListEntry`, 'eventListEntry', 'listEntry');
      if (event.complete)
        eventListEntry.classList.add('complete');

      const gameLink = gameId !== eventGameId ? document.createElement('a') : null;
      if (gameLink) {
        gameLink.classList.add('gameLink');
        gameLink.href = `../${eventGameId}/`;
        gameLink.target = '_blank';
        gameLink.innerText = localizedMessages.games[eventGameId];
      }

      if (eventType === 'locations') {
        const detailsContainer = document.createElement('div');
        detailsContainer.classList.add('detailsContainer');
  
        const eventLocationName = document.createElement('div');

        if (gameLink)
          detailsContainer.appendChild(gameLink);
        
        eventLocationName.innerHTML = eventGameId === '2kki'
          ? get2kkiLocationHtml(event)
          : gameLocationsMap[eventGameId].hasOwnProperty(event.title)
            ? getLocalizedLocation(eventGameId, gameLocalizedLocationsMap[eventGameId][event.title], gameLocationsMap[eventGameId][event.title], true)
            : event.title;
  
        detailsContainer.appendChild(eventLocationName);

        const getEventLocationDepthContainer = (isOutline, isMin) => {
          const eventLocationDepth = document.createElement('div');
          eventLocationDepth.classList.add('depthContainer');
          if (isOutline)
            eventLocationDepth.classList.add('depthOutlineContainer');
          else {
            eventLocationDepth.classList.add('depthFillContainer');
            if (isMin)
              eventLocationDepth.classList.add('minDepthFillContainer');
          }

          const depthProp = isMin ? 'minDepth' : 'depth';
          
          for (let d = 0; d < 10; d += 2) {
            let starIcon;
            if (isOutline)
              starIcon = getSvgIcon('star');
            else if (d < event[depthProp]) {
              if (d + 1 < event[depthProp]) {
                starIcon = getSvgIcon('star', true);
                eventLocationDepth.appendChild(starIcon);
              } else {
                starIcon = getSvgIcon('star');
                const starSvg = starIcon.querySelector('svg');
                const halfStarPath = getSvgIcon('starHalf', true).querySelector('path');
                halfStarPath.setAttribute('style', `fill: var(--${gameId === eventGameId ? 'modal-svg-base-gradient' : `svg-base-gradient-${eventGameId}-${getDefaultUiTheme(eventGameId)}`})`);
                if (isMin)
                  starSvg.querySelector('path').remove();
                starIcon.querySelector('svg').appendChild(halfStarPath);
              }
            } else
              break;
            eventLocationDepth.appendChild(starIcon);
          }
          return eventLocationDepth;
        };

        detailsContainer.appendChild(getEventLocationDepthContainer(true));

        const eventLocationDepth = getEventLocationDepthContainer();
        detailsContainer.appendChild(eventLocationDepth);
        if (event.minDepth) {
          detailsContainer.appendChild(getEventLocationDepthContainer(false, true));

          eventLocationDepth.classList.add('maxDepthFillContainer');
          addTooltip(eventLocationDepth, getMassagedLabel(localizedMessages.events.shortcut, true), true, true);
        }
        
        eventListEntry.appendChild(detailsContainer);

        if (gameId === eventGameId && eventGameId === '2kki' && !event.complete) {
          const trackContainer = document.createElement('div');

          trackContainer.classList.add('eventLocationTrackContainer');

          const trackButton = document.createElement('button');
          trackButton.classList.add('eventLocationTrackButton', 'icon', 'iconButton', 'fillIcon', 'fadeToggleButton', 'altToggleButton');
          trackButton.innerHTML = '<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="28" height="28"><path d="m9 0a1 1 0 0 0 0 18 1 1 0 0 0 0-18m0 2a1 1 0 0 1 0 14 1 1 0 0 1 0-14m4 11-2-6-6-2 2 6 6 2m-4-5a1 1 0 0 1 0 2 1 1 0 0 1 0-2"></path></svg>';

          trackButton.onclick = function () {
            const toggled = config.trackedLocationId !== event.locationId;
            if (toggled)
              Array.from(document.querySelectorAll('.eventLocationTrackButton.toggled')).map(t => t.classList.remove('toggled'));
            this.classList.toggle('toggled', toggled);
            config.trackedLocationId = this.classList.contains('toggled') ? event.locationId : null;
            document.getElementById('nextLocationContainer').classList.toggle('hidden', !toggled);
            if (toggled)
              sendSessionCommand('nl', [ event.locationId ]);
            updateConfig(config);
          };

          if (config.trackedLocationId === event.locationId)
            trackButton.classList.add('toggled');

          addTooltip(trackButton, getMassagedLabel(localizedMessages.events.toggleTracked, true), true, true);

          trackContainer.appendChild(trackButton);

          eventListEntry.appendChild(trackContainer);
        }
      } else if (eventType === 'vms') {
        const vmContainer = document.createElement('div');
        vmContainer.classList.add('vmContainer');

        const vmImage = document.createElement('img');
        vmImage.classList.add('vmImage');
        apiFetch(`vm?id=${event.id}`)
          .then(response => {
            if (!response.ok)
              throw new Error(response.statusText);
            return response.blob();
          })
          .then(data => vmImage.src = URL.createObjectURL(data));

        if (gameLink)
          vmContainer.appendChild(gameLink);
        
        vmContainer.appendChild(vmImage);
        eventListEntry.appendChild(vmContainer);
      }

      if (gameLink) {
        const gameThemeName = getDefaultUiTheme(eventGameId);

        initUiThemeContainerStyles(gameThemeName, eventGameId, false, () => {
          initUiThemeFontStyles(gameThemeName, eventGameId, 0, false);
        });
        
        applyThemeStyles(eventListEntry, gameThemeName.replace(/ /g, '_'), eventGameId);
      }

      updateThemedContainer(eventListEntry);

      const endDateContainer = document.createElement('div');
      endDateContainer.classList.add('eventLocationEndDateContainer', 'eventEndDateContainer');

      const endDateLabelContainer = document.createElement('div');

      const endDateLabel = document.createElement('label');
      endDateLabel.classList.add('nowrap');
      endDateLabel.innerHTML = getMassagedLabel(localizedMessages.events.availableUntilDate, true).replace('{DATE}', event.endDate.toLocaleString(globalConfig.lang === 'en' ? [] : globalConfig.lang, { "dateStyle": "short", "timeStyle": "short" }));

      endDateLabelContainer.appendChild(endDateLabel);
      endDateContainer.appendChild(endDateLabelContainer);
      eventListEntry.appendChild(endDateContainer);

      const pointsContainer = document.createElement('label');
      pointsContainer.classList.add('eventLocationPoints', 'eventPoints', 'infoLabel');
      pointsContainer.innerHTML = getMassagedLabel(localizedMessages.events.exp, true).replace('{POINTS}', event.exp || 0);

      eventListEntry.appendChild(pointsContainer);

      const checkbox = document.createElement('div');
      checkbox.classList.add('checkbox');
      if (event.complete)
        checkbox.classList.add('toggled');

      checkbox.appendChild(document.createElement('span'));
      eventListEntry.appendChild(checkbox);

      eventsList.appendChild(eventListEntry);
    }

    if (eventType === 'locations' && !ignoreLocationCheck && (connStatus === 1 || connStatus === 3 || connStatus === 4))
      checkEventLocations();
  }

  updatePlayerExp();
}

function updateNextLocations(locations) {
  const nextLocationText = document.getElementById('nextLocationText');
  nextLocationText.innerHTML = getLocalized2kkiLocationsHtml(locations, '<br>', true);
  Array.from(nextLocationText.querySelectorAll('.connTypeIcon'))
    .map(i => addTooltip(i, i.dataset.tooltip, true, true));
}

function updatePlayerExp() {
  if (!loggedIn)
    return;
  sendSessionCommand('eexp');
}

function onUpdatePlayerExp(exp) {
  let rankIndex = -1;
  let rankExp = 0;
  let prevRankExp = 0;
  
  for (let er = 0; er < eventExpRanks.length; er++) {
    const expRank = eventExpRanks[er];
    rankExp = Math.max(expRank.exp - prevRankExp, 0);
    if (exp.totalExp < expRank.exp) {
      rankIndex = er;
      break;
    }
    prevRankExp = expRank.exp;
  }

  if (rankIndex === -1)
    rankIndex = eventExpRanks.length - 1;

  const rank = eventExpRanks[rankIndex];

  const rankBadge = document.getElementById('expRankBadge');

  document.getElementById('expRank').innerHTML = getMassagedLabel(localizedMessages.events.expRank.replace('{RANK}', localizedMessages.events.expRanks[rankIndex]), true);
  rankBadge.src = rank.badge ? getBadgeUrl(rank.badge) : '';
  rankBadge.style.display = rank.badge ? 'unset' : 'none';

  const rootStyle = document.getElementById('eventsModal').style;

  rootStyle.setProperty('--rank-total-exp', rankExp);
  rootStyle.setProperty('--rank-exp', exp.totalExp - prevRankExp);
  document.getElementById('totalExp').innerHTML = getMassagedLabel(localizedMessages.events.exp.replace('{POINTS}', exp.totalExp), true);
  rootStyle.setProperty('--week-exp', Math.min(exp.weekExp, 50));
}

function claimEventLocationPoints(location, free, retryCount) {
  sendSessionCommand('eec', [ location.replace(/&/g, '%26'), free ? 1 : 0 ], params => {
    const ok = !!parseInt(params[1]);
    if (ok)
      onClaimEventLocationPoints(location, free, parseInt(params[0]));
    else {
      if (!retryCount)
        retryCount = 0;
      if (retryCount < 10)
        setTimeout(() => claimEventLocationPoints(location, free, ++retryCount), 500);
      else
        console.error(err);
    }
  });
}

function onClaimEventLocationPoints(location, free, result) {
  if (result > 0) {
    showEventsToastMessage('complete', 'expedition', location, result);
    checkNewBadgeUnlocks();
  } else if (free && result > -1) {
    showEventsToastMessage('freeComplete', 'expedition', location);
    checkNewBadgeUnlocks();
  }
  updateEvents();
}

function checkEventLocations() {
  if (loggedIn && cachedLocations && eventsCache.locations?.length) {
    const incompleteEventLocations = eventsCache.locations.filter(el => !el.complete && el.game === gameId);
    const incompleteEventLocationNames = incompleteEventLocations.map(el => el.title);
    const eventLocationMatch = cachedLocations.map(l => {
      let locationName = l.title;
      const colonIndex = locationName.indexOf(':');
      if (colonIndex > -1)
        locationName = locationName.slice(0, colonIndex);
      return locationName;
    }).find(l => incompleteEventLocationNames.indexOf(l) > -1);
    if (eventLocationMatch)
      setTimeout(() => claimEventLocationPoints(eventLocationMatch, incompleteEventLocations.find(el => el.title === eventLocationMatch).type === -1), 1000);
  }
}

function onClaimEventVmPoints(exp) {
  showEventsToastMessage('vmComplete', 'expedition', null, exp);
  checkNewBadgeUnlocks();
  updateEvents();
}

function showEventsToastMessage(key, icon, location, exp) {
  if (!notificationConfig.events.all || !notificationConfig.events[key])
    return;
  let message = getMassagedLabel(localizedMessages.toast.events[key], true);
  if (location) {
    const locationObj = eventsCache.locations.find(el => el.title === location);
    message = message.replace('{LOCATION}', gameId === '2kki' ? get2kkiLocationHtml(locationObj) : location);
  }
  if (exp !== undefined)
    message = message.replace('{EXP}', localizedMessages.events.exp.replace('{POINTS}', exp));
  showToastMessage(message, icon);
}

(function () {
  addSessionCommandHandler('ep', args => onUpdateEventPeriod(JSON.parse(args[0])));
  addSessionCommandHandler('e', args => onUpdateEvents(JSON.parse(args[0])));
  addSessionCommandHandler('eexp', args => onUpdatePlayerExp(JSON.parse(args[0])));
  addSessionCommandHandler('eec');
  addSessionCommandHandler('vm', args => onClaimEventVmPoints(parseInt(args[0])));
})();
