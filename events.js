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
let eventLocationCache = [];
(function() {
  setTimeout(() => {
    updateEventLocationListScheduled();
    setInterval(updateEventLocationListScheduled, 3600000);
  }, 3600000 - (new Date().getMinutes() * 60 + new Date().getSeconds()) * 1000);
})();

function initEventControls() {
  document.getElementById('eventLocationsButton').onclick = () => openModal('eventLocationsModal');
}

function updateEventPeriod() {
  apiFetch('eventLocations?command=period')
    .then(response => {
      if (!response.ok)
        throw new Error(response.statusText);
      return response.json();
    })
    .then(eventPeriod => {
      if (eventPeriod.periodOrdinal < 0)
        return;
      eventPeriod.endDate = new Date(eventPeriod.endDate);
      document.getElementById('eventPeriod').innerHTML = getMassagedLabel(localizedMessages.events.period.replace('{ORDINAL}', eventPeriod.periodOrdinal), true);
      document.getElementById('eventPeriodEndDateLabel').innerHTML = getMassagedLabel(localizedMessages.events.periodEnds.replace('{DATE}', eventPeriod.endDate.toLocaleString([], { "dateStyle": "short", "timeStyle": "short" })), true);
      document.getElementById('eventControls').style.display = 'unset';
      eventPeriodCache = eventPeriod;
      updateEventLocationList();
    });
}

function updateEventLocationListScheduled() {
  // Delay update randomly to give the server some breathing room since otherwise everyone would be calling this at once
  setTimeout(updateEventLocationList, Math.random() * 10000);
}

function updateEventLocationList(ignoreLocationCheck) {
  if (!sessionId || !eventPeriodCache)
    return;
  apiFetch('eventLocations?command=list')
    .then(response => {
      if (!response.ok)
        throw new Error(response.statusText);
      return response.json();
    })
    .then(eventLocations => {
      eventLocationCache = eventLocations.map(l => {
        l.endDate = new Date(l.endDate);
        return l;
      });
      
      const eventLocationsStr = JSON.stringify(eventLocationCache.map(el => el.title));
      if (config.lastEventLocations !== eventLocationsStr) {
        showEventLocationToastMessage('listUpdated', 'expedition');
        config.lastEventLocations = eventLocationsStr;
        updateConfig(config);
      }

      const eventLocationList = document.getElementById('eventLocationList');
      eventLocationList.innerHTML = '';

      let lastType;

      for (let eventLocation of eventLocationCache) {
        if (eventLocation.type !== lastType) {
          const eventLocationTypeContainer = document.createElement('div');
          
          const eventLocationTypeLabel = document.createElement('h3');
          eventLocationTypeLabel.innerHTML = getMassagedLabel(localizedMessages.events.types[eventLocation.type], true);

          eventLocationTypeContainer.appendChild(eventLocationTypeLabel);
          eventLocationList.appendChild(eventLocationTypeContainer);

          lastType = eventLocation.type;
        }
        
        const eventLocationListEntry = document.createElement('div');

        eventLocationListEntry.classList.add('eventLocationListEntry');
        eventLocationListEntry.classList.add('listEntry');
        if (eventLocation.complete)
          eventLocationListEntry.classList.add('complete');

        const detailsContainer = document.createElement('div');
        detailsContainer.classList.add('detailsContainer');

        const eventLocationName = document.createElement('div');
        
        eventLocationName.innerHTML = gameId === '2kki' ? get2kkiLocationHtml(eventLocation) : eventLocation.title;

        const eventLocationDepth = document.createElement('div');
        eventLocationDepth.classList.add('infoLabel');
        eventLocationDepth.classList.add('nowrap');
        
        for (let d = 0; d < 10; d += 2) {
          if (d < eventLocation.depth) {
            if (d + 1 < eventLocation.depth) {
              eventLocationDepth.innerHTML += '★';
              continue;
            } else {
              const halfStar = document.createElement('div');
              halfStar.classList.add('halfStar');
              eventLocationDepth.appendChild(halfStar);
            }
          }
          eventLocationDepth.innerHTML += '☆';
        }

        const endDateContainer = document.createElement('div');
        endDateContainer.classList.add('eventLocationEndDateContainer');

        const endDateLabelContainer = document.createElement('div');

        const endDateLabel = document.createElement('label');
        endDateLabel.classList.add('nowrap');
        endDateLabel.innerHTML = getMassagedLabel(localizedMessages.events.availableUntilDate, true).replace('{DATE}', eventLocation.endDate.toLocaleString([], { "dateStyle": "short", "timeStyle": "short" }));

        const pointsContainer = document.createElement('label');
        pointsContainer.classList.add('eventLocationPoints');
        pointsContainer.classList.add('infoLabel');
        pointsContainer.innerHTML = getMassagedLabel(localizedMessages.events.exp, true).replace('{POINTS}', eventLocation.exp || 0);

        const checkbox = document.createElement('div');
        checkbox.classList.add('checkbox');
        if (eventLocation.complete)
          checkbox.classList.add('toggled');

        detailsContainer.appendChild(eventLocationName);
        detailsContainer.appendChild(eventLocationDepth);
        eventLocationListEntry.appendChild(detailsContainer);
        endDateLabelContainer.appendChild(endDateLabel);
        endDateContainer.appendChild(endDateLabelContainer);
        eventLocationListEntry.appendChild(endDateContainer);
        eventLocationListEntry.appendChild(pointsContainer);
        checkbox.appendChild(document.createElement('span'));
        eventLocationListEntry.appendChild(checkbox);
        eventLocationList.appendChild(eventLocationListEntry);
      }

      updatePlayerExp();

      if (!ignoreLocationCheck && connStatus === 1)
        checkEventLocations();
    });
}

function updatePlayerExp() {
  apiFetch('eventLocations?command=exp')
    .then(response => {
      if (!response.ok)
        throw new Error(response.statusText);
      return response.json();
    })
    .then(exp => {
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
      rankBadge.src = rank.badge ? `images/badge/${rank.badge}.png` : '';
      rankBadge.style.display = rank.badge ? 'unset' : 'none';

      const rootStyle = document.documentElement.style;

      rootStyle.setProperty('--rank-total-exp', rankExp);
      rootStyle.setProperty('--rank-exp', exp.totalExp - prevRankExp);
      document.getElementById('totalExp').innerHTML = getMassagedLabel(localizedMessages.events.exp.replace('{POINTS}', exp.totalExp), true);
      rootStyle.setProperty('--week-exp', Math.min(exp.weekExp, 40));
    });
}

function claimEventLocationPoints(location, free, retryCount) {
  let url = `eventLocations?command=claim&location=${location.replace(/&/g, '%26')}`;
  if (free)
    url += '&free=1';
  apiFetch(url)
    .then(response => {
      if (!response.ok)
        throw new Error(response.statusText);
      return response.text();
    })
    .then(result => {
      if (result > 0) {
        showEventLocationToastMessage('complete', 'expedition', location, result);
        updateBadges();
      } else if (free && result > -1) {
        showEventLocationToastMessage('freeComplete', 'expedition', location);
        updateBadges();
      }
      updateEventLocationList(true);
    })
    .catch(err => {
      if (!retryCount)
        retryCount = 0;
      if (retryCount < 10)
        setTimeout(() => claimEventLocationPoints(location, free, ++retryCount), 500);
      else
        console.error(err);
    });
}

function checkEventLocations() {
  if (sessionId && cachedLocations && eventLocationCache.length) {
    const incompleteEventLocations = eventLocationCache.filter(el => !el.complete);
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

function showEventLocationToastMessage(key, icon, location, exp) {
  if (!notificationConfig.eventLocations.all || !notificationConfig.eventLocations[key])
    return;
  let message = getMassagedLabel(localizedMessages.toast.eventLocations[key], true);
  if (location) {
    const locationObj = eventLocationCache.find(el => el.title === location);
    message = message.replace('{LOCATION}', gameId === '2kki' ? get2kkiLocationHtml(locationObj) : location);
  }
  if (exp)
    message = message.replace('{EXP}', localizedMessages.events.exp.replace('{POINTS}', exp));
  showToastMessage(message, icon, true);
}