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
  document.getElementById('eventsButton').onclick = () => openModal('eventsModal');
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
  if (!loginToken)
    return;
  sendSessionCommand('ep', null, params => onUpdateEventPeriod(JSON.parse(params[0])));
}

function onUpdateEventPeriod(eventPeriod) {
  if (!eventPeriod || eventPeriod.periodOrdinal < 0)
    return;
  
  eventPeriod.endDate = new Date(eventPeriod.endDate);
  document.getElementById('eventPeriod').innerHTML = getMassagedLabel(localizedMessages.events.period.replace('{ORDINAL}', eventPeriod.periodOrdinal), true);
  document.getElementById('eventPeriodEndDateLabel').innerHTML = getMassagedLabel(localizedMessages.events.periodEnds.replace('{DATE}', eventPeriod.endDate.toLocaleString([], { "dateStyle": "short", "timeStyle": "short" })), true);
  document.getElementById('eventControls').style.display = 'unset';
  eventPeriodCache = eventPeriod;
  updateEvents();
}

function updateEvents(ignoreLocationCheck) {
  if (!loginToken || !eventPeriodCache)
    return;
  sendSessionCommand('e', null, params => onUpdateEvents(JSON.parse(params[0]), ignoreLocationCheck));
}

function onUpdateEvents(events, ignoreLocationCheck) {
  if (!events)
    return;

  const eventTypes = Object.keys(events);

  for (let eventType of eventTypes) {
    eventsCache[eventType] = events[eventType].map(l => {
      l.endDate = new Date(l.endDate);
      return l;
    });
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
      
      const eventListEntry = document.createElement('div');

      eventListEntry.classList.add(`event${eventTypeName}ListEntry`);
      eventListEntry.classList.add('eventListEntry');
      eventListEntry.classList.add('listEntry');
      if (event.complete)
        eventListEntry.classList.add('complete');

      if (eventType === 'locations') {
        const detailsContainer = document.createElement('div');
        detailsContainer.classList.add('detailsContainer');
  
        const eventLocationName = document.createElement('div');
        
        eventLocationName.innerHTML = gameId === '2kki' ? get2kkiLocationHtml(event) : event.title;
  
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
                halfStarPath.setAttribute('style', `fill: var(--modal-svg-base-gradient); stroke: none; filter: none;`);
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
        
        vmContainer.appendChild(vmImage);
        eventListEntry.appendChild(vmContainer);
      }

      const endDateContainer = document.createElement('div');
      endDateContainer.classList.add('eventLocationEndDateContainer');
      endDateContainer.classList.add('eventEndDateContainer');

      const endDateLabelContainer = document.createElement('div');

      const endDateLabel = document.createElement('label');
      endDateLabel.classList.add('nowrap');
      endDateLabel.innerHTML = getMassagedLabel(localizedMessages.events.availableUntilDate, true).replace('{DATE}', event.endDate.toLocaleString([], { "dateStyle": "short", "timeStyle": "short" }));

      endDateLabelContainer.appendChild(endDateLabel);
      endDateContainer.appendChild(endDateLabelContainer);
      eventListEntry.appendChild(endDateContainer);

      const pointsContainer = document.createElement('label');
      pointsContainer.classList.add('eventLocationPoints');
      pointsContainer.classList.add('eventPoints');
      pointsContainer.classList.add('infoLabel');
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

    if (eventType === 'locations' && !ignoreLocationCheck && connStatus === 1)
      checkEventLocations();
  }

  updatePlayerExp();
}

function updatePlayerExp() {
  if (!loginToken)
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

  const rootStyle = document.documentElement.style;

  rootStyle.setProperty('--rank-total-exp', rankExp);
  rootStyle.setProperty('--rank-exp', exp.totalExp - prevRankExp);
  document.getElementById('totalExp').innerHTML = getMassagedLabel(localizedMessages.events.exp.replace('{POINTS}', exp.totalExp), true);
  rootStyle.setProperty('--week-exp', Math.min(exp.weekExp, 50));
}

function claimEventLocationPoints(location, free, retryCount) {
  sendSessionCommand('eec', [ location.replace(/&/g, '%26'), free ? 1 : 0 ], params => {
    const ok = !!parseInt(params[1]);
    if (ok)
      onClaimEventLocationPoints(parseInt(params[0]));
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

function onClaimEventLocationPoints(result, ok) {
  if (result > 0) {
    showEventsToastMessage('complete', 'expedition', location, result);
    checkNewBadgeUnlocks();
  } else if (free && result > -1) {
    showEventsToastMessage('freeComplete', 'expedition', location);
    checkNewBadgeUnlocks();
  }
  updateEvents(true);
}

function checkEventLocations() {
  if (loginToken && cachedLocations && eventsCache.locations?.length) {
    const incompleteEventLocations = eventsCache.locations.filter(el => !el.complete);
    const incompleteEventLocationNames = incompleteEventLocations.map(el => el.title);
    const eventLocationMatch = cachedLocations.map(l => {
      let locationName = l.title;
      const colonIndex = locationName.indexOf(':');
      if (colonIndex > -1)
        locationName = locationName.slice(0, colonIndex);
      return locationName;
    }).find(l => incompleteEventLocationNames.indexOf(l) > -1);
    if (eventLocationMatch)
      claimEventLocationPoints(eventLocationMatch, incompleteEventLocations.find(el => el.title === eventLocationMatch).type === -1);
  }
}

function onClaimEventVmPoints(exp) {
  showEventsToastMessage('vmComplete', 'expedition', null, exp);
  checkNewBadgeUnlocks();
  updateEvents(true);
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
  showToastMessage(message, icon, true);
}

(function () {
  addSessionCommandHandler('ep', args => onUpdateEventPeriod(JSON.parse(args[0])));
  addSessionCommandHandler('e', args => onUpdateEvents(JSON.parse(args[0])));
  addSessionCommandHandler('eexp', args => onUpdatePlayerExp(JSON.parse(args[0])));
  addSessionCommandHandler('vm', args => onClaimEventVmPoints(parseInt(args[0])));
})();