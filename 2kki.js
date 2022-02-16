const is2kki = gameId === '2kki';
const unknownLocations = [];

function onLoad2kkiMap(mapId) {
  const prevMapId = cachedMapId;
  const prevLocations = prevMapId ? cached2kkiLocations : null;
  const locationKey = `${(prevMapId || '0000')}_${mapId}`;

  let locations = locationCache[locationKey] || null;

  if (locations && typeof locations === 'string')
    locations = null;

  if (unknownLocations.indexOf(locationKey) > -1)
    locations = getMassagedLabel(localizedMessages.location.unknownLocation);

  if (!cachedMapId)
    document.getElementById('location').classList.remove('hidden');
  
  if (locations && locations.length) {
    const locationNames = Array.isArray(locations) ? locations.map(l => l.title) : null;
    set2kkiClientLocation(mapId, prevMapId, locations, prevLocations);
    cachedPrevMapId = cachedMapId;
    cachedMapId = mapId;
    cachedPrev2kkiLocations = cached2kkiLocations;
    cached2kkiLocations = locationNames ? locations : null;
    if (localizedMapLocations && (!cached2kkiLocations || !cachedLocations || JSON.stringify(locations) !== JSON.stringify(cachedLocations)))
      addChatMapLocation();
    cachedLocations = cached2kkiLocations;
    if (!locationNames) {
      set2kkiExplorerLinks(null);
      set2kkiMaps([]);
    } else {
      set2kkiExplorerLinks(locationNames);
      if (mapCache.hasOwnProperty(locationNames.join(',')))
        set2kkiMaps(mapCache[locationNames.join(',')], locationNames);
      else
        queryAndSet2kkiMaps(locationNames).catch(err => console.error(err));
    }
  } else {
    queryAndSet2kkiLocation(mapId, prevMapId, prevLocations, set2kkiClientLocation, true)
      .then(locations => {
        const locationNames = locations ? locations.map(l => l.title) : null;
        set2kkiExplorerLinks(locationNames);
        if (locationNames)
          queryAndSet2kkiMaps(locationNames).catch(err => console.error(err));
        else {
          set2kkiMaps([], null, true, true);
          set2kkiExplorerLinks(null);
        }
      }).catch(err => console.error(err));
  }
}

function queryAndSet2kkiLocation(mapId, prevMapId, prevLocations, setLocationFunc, forClient) {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest();
      let url = `https://2kki.app/getMapLocationNames?mapId=${mapId}`;
      if (prevMapId) {
          url += `&prevMapId=${prevMapId}`;
          if (prevLocations && prevLocations.length)
            url += `&prevLocationNames=${prevLocations.map(l => l.title).join('&prevLocationNames=')}`;
      }
      req.responseType = 'json';
      req.open("GET", url);
      req.send();

      if (!setLocationFunc)
        setLocationFunc = () => {};

      setLocationFunc(mapId, prevMapId, getMassagedLabel(localizedMessages.location['2kki'].queryingLocation), prevLocations, true);

      req.onload = (_e) => {
        const locationsArray = req.response;
        const locations = [];

        const cacheAndResolve = () => {
          if (forClient) {
            cachedPrevMapId = cachedMapId;
            cachedMapId = mapId;
            cachedPrev2kkiLocations = cached2kkiLocations;
            cached2kkiLocations = locations;
            if (localizedMapLocations && (!locations || !cachedLocations || JSON.stringify(locations) !== JSON.stringify(cachedLocations)))
              addChatMapLocation();
            cachedLocations = cached2kkiLocations;
          }

          resolve(locations);
        };

        if (Array.isArray(locationsArray) && locationsArray.length) {
          let location = locationsArray[0];
          let usePrevLocations = false;

          if (locationsArray.length > 1 && prevLocations && prevLocations.length) {
            for (let l of locationsArray) {
              if (l.title === prevLocations[0].title) {
                location = l;
                usePrevLocations = true;
                break;
              }
            }
          }

          locations.push(location);

          if (usePrevLocations) {
            queryConnected2kkiLocationNames(location.title, locationsArray.filter(l => l.title !== location.title).map(l => l.title))
              .then(connectedLocationNames => {
                const connectedLocations = locationsArray.filter(l => connectedLocationNames.indexOf(l.title) > -1);
                for (let cl of connectedLocations)
                  locations.push(cl);

                setLocationFunc(mapId, prevMapId, locations, prevLocations, true, true);

                cacheAndResolve();
              }).catch(err => reject(err));
              
            return;
          } else
            setLocationFunc(mapId, prevMapId, locations, prevLocations, true, true);
        } else {
          const errCode = !Array.isArray(req.response) ? req.response.err_code : null;
          
          if (errCode)
            console.error({ error: req.response.error, errCode: errCode });

          if (prevMapId) {
            queryAndSet2kkiLocation(mapId, null, null, setLocationFunc, forClient).then(() => resolve(null)).catch(err => reject(err));
            return;
          }
          setLocationFunc(mapId, prevMapId, null, prevLocations, true, true);
        }
        cacheAndResolve();
      };
  });
}

function set2kkiClientLocation(mapId, prevMapId, locations, prevLocations, cacheLocation, saveLocation) {
  document.getElementById('locationText').innerHTML = getLocalized2kkiLocationsHtml(locations, '<br>');
  onUpdateChatboxInfo();
  if (cacheLocation) {
    const locationKey = `${(prevMapId || '0000')}_${mapId}`;
    const prevLocationKey = `${mapId}_${(prevMapId || '0000')}`;
    if (locations)
      locationCache[locationKey] = locations;
    else
      unknownLocations.push(locationKey);
    if (prevLocations)
      locationCache[prevLocationKey] = prevLocations;
    if (saveLocation && (locations || prevLocations)) {
      if (locations)
        config.locationCache[locationKey] = locations;
      if (prevLocations)
        config.locationCache[prevLocationKey] = prevLocations;
      updateConfig(config);
    }
  }
}

function getLocalized2kkiLocation(title, titleJP, asHtml) {
  let template = localizedMessages.location['2kki'].template;
  if (asHtml)
    template = template.replace(/(?:})([^{]+)/g, '}<span class="infoLabel">$1</span>');
  return getMassagedLabel(template).replace('{LOCATION}', title).replace('{LOCATION_JP}', titleJP);
}

function getLocalized2kkiLocations(locations, separator) {
  return locations && locations.length
    ? Array.isArray(locations)
      ? locations.map(l => getLocalized2kkiLocation(l.title, l.titleJP)).join(separator)
      : locations
    : getMassagedLabel(localizedMessages.location.unknownLocation);
}

function get2kkiLocationHtml(location) {
  const urlTitle = location.urlTitle || location.title;
  const urlTitleJP = location.urlTitleJP || (location.titleJP && location.titleJP.indexOf("：") > -1 ? location.titleJP.slice(0, location.titleJP.indexOf("：")) : location.titleJP);
  const locationHtml = `<a href="${locationUrlRoot}${urlTitle}" target="_blank">${location.title}</a>`;
  const locationHtmlJP = urlTitleJP ? `<a href="${localizedLocationUrlRoot}${urlTitleJP}" target="_blank">${location.titleJP}</a>` : null;
  return locationHtmlJP ? getLocalized2kkiLocation(locationHtml, locationHtmlJP, true) : locationHtml;
}

function getLocalized2kkiLocationsHtml(locations, separator) {
  return locations && locations.length
    ? Array.isArray(locations)
    ? locations.map(l => get2kkiLocationHtml(l)).join(separator)
      : getInfoLabel(locations)
    : getInfoLabel(getMassagedLabel(localizedMessages.location.unknownLocation));
}

function set2kkiGlobalChatMessageLocation(globalMessageIcon, globalMessageLocation, mapId, prevMapId, prevLocations) {
  const setMessageLocationFunc = (_mapId, _prevMapId, locations, prevLocations, cacheLocation, saveLocation) => {
    globalMessageIcon.title = getLocalized2kkiLocations(locations, '\n');
    globalMessageLocation.innerHTML = getLocalized2kkiLocationsHtml(locations, getInfoLabel('&nbsp;|&nbsp;'));
    if (cacheLocation) {
      const locationKey = `${prevMapId}_${mapId}`;
      const prevLocationKey = `${mapId}_${prevMapId}`;
      if (locations)
        locationCache[locationKey] = locations;
      else
        unknownLocations.push(locationKey);
      if (prevLocations)
        locationCache[prevLocationKey] = prevLocations;
      if (saveLocation && (locations || prevLocations)) {
        if (locations)
          config.locationCache[locationKey] = locations;
        if (prevLocations)
          config.locationCache[prevLocationKey] = prevLocations;
        updateConfig(config);
      }
    }
  };

  if (localizedMapLocations.hasOwnProperty(mapId))
    setMessageLocationFunc(mapId, prevMapId, localizedMapLocations[mapId], prevLocations);
  else {
    if (!prevMapId)
      prevMapId = "0000";
    const locationKey = `${prevMapId}_${mapId}`;
    if (unknownLocations.indexOf(locationKey) > -1)
      setMessageLocationFunc(mapId, prevMapId, null, prevLocations);
    else if (locationCache.hasOwnProperty(locationKey) && Array.isArray(locationCache[locationKey]))
      setMessageLocationFunc(mapId, prevMapId, locationCache[locationKey], prevLocations);
    else
      queryAndSet2kkiLocation(mapId, prevMapId !== "0000" ? prevMapId : null, prevLocations, setMessageLocationFunc)
        .catch(err => console.error(err));
  }
}

function queryConnected2kkiLocationNames(locationName, connLocationNames) {
  return new Promise((resolve, _reject) => {
    const req = new XMLHttpRequest();
      const url = `https://2kki.app/getConnectedLocations?locationName=${locationName}&connLocationNames=${connLocationNames.join('&connLocationNames=')}`;
      req.responseType = 'json';
      req.open("GET", url);
      req.send();

      req.onload = (_e) => {
        let ret = [];
        let errCode = null;

        if (Array.isArray(req.response))
          ret = req.response;
        else
          errCode = req.response.err_code;
          
        if (errCode)
          console.error({ error: req.response.error, errCode: errCode });

        resolve(ret);
      };
  });
}

function queryAndSet2kkiMaps(locationNames) {
  return new Promise((resolve, _reject) => {
    const req = new XMLHttpRequest();
      const url = `https://2kki.app/getLocationMaps?locationNames=${locationNames.join('&locationNames=')}`;
      req.responseType = 'json';
      req.open("GET", url);
      req.send();

      set2kkiMaps([], null, true);

      req.onload = (_e) => {
        let errCode = null;

        if (Array.isArray(req.response))
          set2kkiMaps(req.response, locationNames, true, true);
        else
          errCode = req.response.err_code;
          
        if (errCode)
          console.error({ error: req.response.error, errCode: errCode });

        resolve();
      };
  });
}

function set2kkiMaps(maps, locationNames, cacheMaps, saveMaps) {
  const mapControls = document.getElementById('mapControls');
  mapControls.innerHTML = '';
  if (maps && maps.length) {
    for (let map of maps)
      mapControls.appendChild(get2kkiMapButton(map.url, map.label));
  }
  if (cacheMaps && locationNames) {
    mapCache[locationNames.join(',')] = maps;
    if (saveMaps) {
      config.mapCache[locationNames.join(',')] = maps;
      updateConfig(config);
    }
  }
}

function get2kkiMapButton(url, label) {
  const ret = document.createElement('button');
  ret.classList.add('mapButton');
  ret.classList.add('unselectable');
  ret.classList.add('iconButton');
  ret.title = label;
  ret.onclick = () => {
    const handle = window.open(url, '_blank', 'noreferrer');
    if (handle)
        handle.focus();
  };
  ret.innerHTML = '<svg viewbox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="m0 0l4 2 4-2 4 2v10l-4-2-4 2-4-2v-10m4 2v10m4-12v10"></path></svg>';
  return ret;
}

function set2kkiExplorerLinks(locationNames) {
  const explorerControls = document.getElementById('explorerControls');
  if (!explorerControls)
    return;
  explorerControls.innerHTML = '';
  if (!locationNames)
    return;
  for (let locationName of locationNames)
    explorerControls.appendChild(get2kkiExplorerButton(locationName, locationNames.length > 1))
}

function get2kkiExplorerButton(locationName, isMulti) {
  const ret = document.createElement('button');
  const localizedExplorerLinks = localizedMessages['2kki'].explorerLink;
  ret.title = !isMulti ? localizedExplorerLinks.generic : localizedExplorerLinks.multi.replace('{LOCATION}', locationName);
  ret.classList.add('unselectable');
  ret.classList.add('iconButton');

  const url = `https://2kki.app/?location=${locationName}&lang=${globalConfig.lang}`;

  ret.onclick = () => {
    const handle = window.open(url, '_blank');
    if (handle)
        handle.focus();
  };

  ret.innerHTML = '<svg viewbox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="m6.75 0v4.5h4.5v-4.5h-4.5m2.25 4.5v4.5h-1.5v3h3v-3h-1.5m0-3h-7.5v3h-1.5v3h3v-3h-1.5m7.5-3h7.5v3h-1.5v3h3v-3h-1.5m-7.5 3v3.75h-1.125v2.25h2.25v-2.25h-1.125m0-2.25h-7.5v2.25h-1.125v2.25h2.25v-2.25h-1.125m7.5-2.25h7.5v2.25h-1.125v2.25h2.25v-2.25h-1.125"></path></svg>';

  return ret;
}