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

function updateEventLocationListScheduled() {
  // Delay update randomly to give the server some breathing room since otherwise everyone would be calling this at once
  setTimeout(updateEventLocationList, Math.random() * 10000);
}

function updateEventLocationList() {
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
          eventLocationTypeLabel.innerText = getMassagedLabel(localizedMessages.events.type[eventLocation.type], true);

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
        
        for (let d = 0; d < 5; d++)
          eventLocationDepth.innerText += d < eventLocation.depth ? '★' : '☆';

        const pointsContainer = document.createElement('label');
        pointsContainer.classList.add('eventLocationPoints');
        pointsContainer.classList.add('infoLabel');
        pointsContainer.innerText = localizedMessages.events.exp.replace('{POINTS}', !eventLocation.type ? 1 : eventLocation.type === 1 ? 5 : 3);

        const checkbox = document.createElement('div');
        checkbox.classList.add('checkbox');
        if (eventLocation.complete)
          checkbox.classList.add('toggled');

        detailsContainer.appendChild(eventLocationName);
        detailsContainer.appendChild(eventLocationDepth);
        eventLocationListEntry.appendChild(detailsContainer);
        eventLocationListEntry.appendChild(pointsContainer);
        checkbox.appendChild(document.createElement('span'));
        eventLocationListEntry.appendChild(checkbox);
        eventLocationList.appendChild(eventLocationListEntry);
      }

      if (connStatus === 1)
        checkEventLocations();
    });
}

function claimEventLocationPoints(location) {
  apiFetch(`eventLocations?command=claim&location=${location}`)
    .then(response => {
      if (!response.ok)
        throw new Error(response.statusText);
      return response.text();
    })
    .then(exp => {
      showEventLocationToastMessage('complete', 'expedition', location, exp);
      updateEventLocationList();
    });
}

function checkEventLocations() {
  if (sessionId && cachedLocations && eventLocationCache.length) {
    const eventLocationNames = eventLocationCache.filter(el => !el.complete).map(el => el.title);
    const eventLocationMatch = cachedLocations.map(l => l.title).find(l => eventLocationNames.indexOf(l) > -1);
    if (eventLocationMatch)
      claimEventLocationPoints(eventLocationMatch);
  }
}

function showEventLocationToastMessage(key, icon, location, exp) {
  if (!globalConfig.notifications.eventLocations.all || !globalConfig.notifications.eventLocations[key])
    return;
  let message = getMassagedLabel(localizedMessages.toast.eventLocations[key], true);
  if (location) {
    const locationObj = eventLocationCache.find(el => el.title === location);
    message = message.replace('{LOCATION}', gameId === '2kki' ? get2kkiLocationHtml(locationObj) : location);
  }
  if (exp)
    message = message.replace('{EXP}', localizedMessages.events.exp.replace('{POINTS}', exp));
  showToastMessage(message, icon);
}