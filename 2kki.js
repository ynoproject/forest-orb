const is2kki = gameId === '2kki';

let gameVersion;

const pendingRequests = {};

function send2kkiApiRequest(url, callback) {
  if (pendingRequests.hasOwnProperty(url))
    pendingRequests[url].push(callback);
  else {
    pendingRequests[url] = [ callback ];
    const req = new XMLHttpRequest();
    req.responseType = 'json';
    req.open('GET', url);
    req.timeout = 10000;
    req.send();

    let onReqEnd = _e => {
      const callbacks = pendingRequests[url];
      if (Array.isArray(callbacks)) {
        for (let cb of callbacks)
          cb(req.response);
      }
      delete pendingRequests[url];
      req.onloadend = req.ontimeout = null;
    };
    req.onloadend = req.ontimeout = onReqEnd;
  }
}

function onLoad2kkiMap(mapId) {
  const prevMapId = cachedMapId;
  const prevLocations = prevMapId ? cached2kkiLocations : null;
  const locationKey = `${(prevMapId || '0000')}_${mapId}`;

  let locations = locationCache[locationKey] || null;

  if (locations && typeof locations === 'string')
    locations = null;

  if (!cachedMapId)
    document.getElementById('location').classList.remove('hidden');
  
  if (locations && locations.length) {
    const locationNames = Array.isArray(locations) ? locations.map(l => l.title) : null;
    set2kkiClientLocation(mapId, prevMapId, locations, prevLocations);
    cachedPrevMapId = cachedMapId;
    cachedMapId = mapId;
    cachedPrev2kkiLocations = cached2kkiLocations;
    cached2kkiLocations = locationNames ? locations : null;
    if (localizedMapLocations) {
      if (!cached2kkiLocations || !cachedLocations || JSON.stringify(locations) !== JSON.stringify(cachedLocations))
        addChatMapLocation(cached2kkiLocations);
      cachedLocations = cached2kkiLocations;
    }
    if (!locationNames) {
      set2kkiExplorerLinks(null);
      setMaps([]);
      updateBadgeHint([]);
    } else {
      set2kkiExplorerLinks(locationNames);
      if (mapCache.hasOwnProperty(locationNames.join(',')))
        setMaps(mapCache[locationNames.join(',')], locationNames);
      else
        queryAndSet2kkiMaps(locationNames).catch(err => console.error(err));
      updateBadgeHint(locations.map(l => l.title));
    }
    if (playerData?.badge && badgeCache.find(b => b.badgeId === playerData.badge)?.overlayType & BadgeOverlayType.LOCATION)
      updateBadgeButton();
  } else {
    queryAndSet2kkiLocation(mapId, prevMapId, prevLocations, set2kkiClientLocation, true)
      .then(locations => {
        const locationNames = locations ? locations.map(l => l.title) : null;
        set2kkiExplorerLinks(locationNames);
        if (locationNames)
          queryAndSet2kkiMaps(locationNames).catch(err => console.error(err));
        else {
          setMaps([], null, true, true);
          set2kkiExplorerLinks(null);
        }
        updateBadgeHint(locations.map(l => l.title));
        syncLocationChange();
        checkEventLocations();
        if (playerData?.badge && badgeCache.find(b => b.badgeId === playerData.badge)?.overlayType & BadgeOverlayType.LOCATION)
          updateBadgeButton();
      }).catch(err => console.error(err));
  }
}

function queryAndSet2kkiLocation(mapId, prevMapId, prevLocations, setLocationFunc, forClient) {
  return new Promise((resolve, reject) => {
    let url = `https://explorer.yume.wiki/getMapLocationNames?mapId=${mapId}`;
    if (prevMapId) {
        url += `&prevMapId=${prevMapId}`;
        if (prevLocations && prevLocations.length)
          url += `&prevLocationNames=${prevLocations.map(l => l.title).join('&prevLocationNames=')}`;
    }

    if (!setLocationFunc)
      setLocationFunc = () => {};
      
    const callback = response => {
      const locationsArray = response;
      const locations = [];

      const cacheAndResolve = () => {
        if (forClient) {
          cachedPrevMapId = cachedMapId;
          cachedMapId = mapId;
          cachedPrev2kkiLocations = cached2kkiLocations;
          cached2kkiLocations = locations;
          if (localizedMapLocations) {
            if (!locations || !cachedLocations || JSON.stringify(locations) !== JSON.stringify(cachedLocations))
              addChatMapLocation(cached2kkiLocations);
            cachedLocations = cached2kkiLocations;
          }
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

        if (usePrevLocations)
          locations.push(location);
        else {
          for (let l of locationsArray)
            locations.push(l);
        }

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
        const errCode = !Array.isArray(response) ? response?.err_code : null;
        
        if (errCode)
          console.error({ error: response.error, errCode: errCode });

        if (prevMapId) {
          queryAndSet2kkiLocation(mapId, null, null, setLocationFunc, forClient).then(() => resolve(null)).catch(err => reject(err));
          return;
        }
        setLocationFunc(mapId, prevMapId, null, prevLocations, true, true);
      }
      cacheAndResolve();
    };
    send2kkiApiRequest(url, callback);

    setLocationFunc(mapId, prevMapId, getMassagedLabel(localizedMessages.location.queryingLocation), prevLocations, true);
  });
}

function set2kkiClientLocation(mapId, prevMapId, locations, prevLocations, cacheLocation, saveLocation) {
  const localizedLocationsHtml = getLocalized2kkiLocationsHtml(locations, '<br>');
  fastdom.mutate(() => document.getElementById('locationText').innerHTML = localizedLocationsHtml);

  fastdom.measure(() => {
    const width = `${document.querySelector('#locationText > *').offsetWidth}px`;
    fastdom.mutate(() => document.getElementById('nextLocationContainer').style.setProperty('--location-width', width));
  });

  onUpdateChatboxInfo();
  preloadFilesFromMapId(mapId);
  if (cacheLocation) {
    const locationKey = `${(prevMapId || '0000')}_${mapId}`;
    const prevLocationKey = `${mapId}_${(prevMapId || '0000')}`;
    const cachePrev = Array.isArray(prevLocations) && prevLocations.filter(l => l.titleJP).length;
    if (locations)
      locationCache[locationKey] = locations;
    if (cachePrev)
      locationCache[prevLocationKey] = prevLocations;
    if (saveLocation && (locations || prevLocations)) {
      if (locations)
        setCacheValue(CACHE_TYPE.location, locationKey, locations);
      if (cachePrev)
        setCacheValue(CACHE_TYPE.location, prevLocationKey, prevLocations);
      updateCache(CACHE_TYPE.location);
    }
  }
}

function getLocalized2kkiLocation(title, titleJP, asHtml, forDisplay) {
  let template = localizedMessages[forDisplay ? 'locationDisplay' : 'location']['2kki'].template;
  if (asHtml)
    template = template.replace(/}([^{]+)/g, '}<span class="infoLabel">$1</span>');
  return getMassagedLabel(template).replace('{LOCATION}', title).replace('{LOCATION_JP}', titleJP || '');
}

function getLocalized2kkiLocations(locations, separator, forDisplay) {
  return locations && locations.length
    ? Array.isArray(locations)
      ? locations.map(l => getLocalized2kkiLocation(l.title, l.titleJP, false, forDisplay)).join(separator)
      : locations
    : getMassagedLabel(localizedMessages.location.unknownLocation);
}

function get2kkiLocationHtml(location, showDepth) {
  const urlTitle = location.urlTitle || location.title;
  let urlTitleJP = location.urlTitleJP;
  if (!urlTitleJP && location.titleJP) {
    const colonIndex = location.titleJP.indexOf('：');
    const colonIndexHalf = location.titleJP.indexOf(':');
    if (colonIndex > -1) {
      urlTitleJP = location.titleJP.slice(0, colonIndex);
    } else if (colonIndexHalf > -1) {
      urlTitleJP = location.titleJP.slice(0, colonIndexHalf);
    } else {
      urlTitleJP = location.titleJP;
    }
  }
  let locationHtml = `<a href="${gameLocationUrlRoots['2kki'] || locationUrlRoot}${urlTitle}" target="_blank" class="wikiLink">${location.title}</a>`;
  if (location.connType) {
    const connTypes = Object.values(ConnType).map(ct => parseInt(ct));
    for (let ct of connTypes) {
      if (location.connType & ct) {
        const connTypeParams = location.typeParams ? location.typeParams[ct] : null;
        if (connTypeParams && ct === ConnType.EFFECT) {
          connTypeParams.params = connTypeParams.params.replace(/,/g, ', ');
          // TODO: support Japanese effect names
          // connTypeParams.paramsJP = connTypeParams.paramsJP.split(',').map(e => effectsJP[e]).join('」か「');
        }
        const localizedTooltip = localizedMessages.location.connType[ct].replace('{PARAMS}', connTypeParams?.params || '').replace('{PARAMS_JP}', connTypeParams?.paramsJP || connTypeParams?.params || '');
        locationHtml += ` <span class="connTypeIcon emoji unselectable" data-tooltip="${localizedTooltip}">${getConnTypeChar(ct, connTypeParams)}</span>`;
      }
    }
  }
  if (showDepth && location.hasOwnProperty('depth'))
    locationHtml += localizedMessages.location.depth.replace('{DEPTH}', `<span class="locationDepth colorText" style="-webkit-text-fill-color: rgba(${getDepthRgba(location.depth, 10)})">${location.depth}</span>`);
  const locationHtmlJP = urlTitleJP ? `<a href="${gameLocalizedLocationUrlRoots['2kki'] || localizedLocationUrlRoot}${urlTitleJP}" target="_blank" class="wikiLink">${location.titleJP}</a>` : null;
  return locationHtmlJP ? getLocalized2kkiLocation(locationHtml, locationHtmlJP, true) : locationHtml;
}

function getLocalized2kkiLocationsHtml(locations, separator, showDepth) {
  return locations && locations.length
    ? Array.isArray(locations)
    ? locations.map(l => get2kkiLocationHtml(l, showDepth)).join(separator)
      : getInfoLabel(locations)
    : getInfoLabel(getMassagedLabel(localizedMessages.location.unknownLocation));
}

function getOrQuery2kkiLocations(mapId, prevMapId, prevLocations, callback) {
  const callbackFunc = (_mapId, _prevMapId, locations, prevLocations, cacheLocation, saveLocation) => {
    callback(locations);
    if (cacheLocation) {
      const locationKey = `${prevMapId}_${mapId}`;
      const prevLocationKey = `${mapId}_${prevMapId}`;
      const cachePrev = Array.isArray(prevLocations) && prevLocations.filter(l => l.titleJP).length;
      if (locations)
        locationCache[locationKey] = locations;
      if (cachePrev)
        locationCache[prevLocationKey] = prevLocations;
      if (saveLocation && (locations || prevLocations)) {
        if (locations)
          setCacheValue(CACHE_TYPE.location, locationKey, locations);
        if (cachePrev)
          setCacheValue(CACHE_TYPE.location, prevLocationKey, prevLocations);
        updateCache(CACHE_TYPE.location);
      }
    }
  };

  if (localizedMapLocations?.hasOwnProperty(mapId))
    callbackFunc(mapId, prevMapId, localizedMapLocations[mapId], prevLocations);
  else {
    if (!prevMapId)
      prevMapId = '0000';
    const locationKey = `${prevMapId}_${mapId}`;
    if (locationCache?.hasOwnProperty(locationKey) && Array.isArray(locationCache[locationKey]))
      callbackFunc(mapId, prevMapId, locationCache[locationKey], prevLocations);
    else
      queryAndSet2kkiLocation(mapId, prevMapId !== '0000' ? prevMapId : null, prevLocations, callbackFunc)
        .catch(err => console.error(err));
  }
}

function set2kkiGlobalChatMessageLocation(globalMessageLocation, mapId, prevMapId, prevLocations) {
  getOrQuery2kkiLocations(mapId, prevMapId, prevLocations, locations => {
    const locationsHtml = getLocalized2kkiLocationsHtml(locations, getInfoLabel('&nbsp;|&nbsp;'));
    fastdom.mutate(() => {
      globalMessageLocation.innerHTML = locationsHtml;
      if (globalMessageLocation.dataset.systemOverride)
        applyThemeStyles(globalMessageLocation, globalMessageLocation.dataset.systemOverride);
    });
  });
}

function getOrQuery2kkiLocationsHtml(mapId, callback) {
  let locationKey = `0000_${mapId}`;
  if (locationCache && !locationCache.hasOwnProperty(locationKey)) {
    const locationKeys = Object.keys(locationCache).filter(k => k.endsWith(mapId) && Array.isArray(locationCache[k]));
    if (locationKeys.length === 1 || locationKeys.map(k => JSON.stringify(locationCache[k])).filter((value, index, self) => self.indexOf(value) === index).length === 1)
      locationKey = locationKeys[0];
  }
  let prevMapId = locationKey.slice(0, 4);

  const setLocationFunc = (_mapId, _prevMapId, locations, _prevLocations, cacheLocation, saveLocation) => {
    if (cacheLocation) {
      const locationKey = `${prevMapId}_${mapId}`;
      if (locations)
        locationCache[locationKey] = locations;
      if (saveLocation && locations) {
        setCacheValue(CACHE_TYPE.location, locationKey, locations);
        updateCache(CACHE_TYPE.location);
      }
    }
    callback(getLocalized2kkiLocationsHtml(locations, getInfoLabel('&nbsp;|&nbsp;')));
  };

  if (locationCache?.hasOwnProperty(locationKey) && Array.isArray(locationCache[locationKey]))
    setLocationFunc(mapId, null, locationCache[locationKey]);
  else {
    prevMapId = '0000';
    queryAndSet2kkiLocation(mapId, prevMapId, null, setLocationFunc)
      .catch(err => console.error(err));
  }
}

function queryConnected2kkiLocationNames(locationName, connLocationNames) {
  return new Promise((resolve, _reject) => {
    const url = `https://explorer.yume.wiki/getConnectedLocations?locationName=${locationName}&connLocationNames=${connLocationNames.join('&connLocationNames=')}`;
    const callback = response => {
      let ret = [];
      let errCode = null;

      if (Array.isArray(response))
        ret = response;
      else
        errCode = response?.err_code;
        
      if (errCode)
        console.error({ error: response.error, errCode: errCode });

      resolve(ret);
    };
    send2kkiApiRequest(url, callback);
  });
}

function queryAndSet2kkiMaps(locationNames) {
  return new Promise((resolve, _reject) => {
    const massagedLocationNames = locationNames.map(locationName => {
      const colonIndex = locationName.indexOf(':');
      if (colonIndex > -1)
        locationName = locationName.slice(0, colonIndex);
      return locationName;
    });
    const url = `https://explorer.yume.wiki/getLocationMaps?locationNames=${massagedLocationNames.join('&locationNames=')}`;
    const callback = response => {
      let errCode = null;

      if (Array.isArray(response))
        setMaps(response, locationNames, true, true);
      else
        errCode = response?.err_code;
        
      if (errCode)
        console.error({ error: response.error, errCode: errCode });

      resolve();
    };
    send2kkiApiRequest(url, callback);

    setMaps([], null, true);
  });
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
  
  addTooltip(ret, getMassagedLabel(!isMulti ? localizedExplorerLinks.generic : localizedExplorerLinks.multi, true).replace('{LOCATION}', locationName), true, true);
  ret.classList.add('unselectable', 'iconButton');

  const url = `https://explorer.yume.wiki/?location=${locationName}&lang=${globalConfig.lang}`;

  ret.onclick = () => {
    const handle = window.open(url, '_blank');
    if (handle)
        handle.focus();
  };

  ret.innerHTML = '<svg viewbox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="m6.75 0v4.5h4.5v-4.5h-4.5m2.25 4.5v4.5h-1.5v3h3v-3h-1.5m0-3h-7.5v3h-1.5v3h3v-3h-1.5m7.5-3h7.5v3h-1.5v3h3v-3h-1.5m-7.5 3v3.75h-1.125v2.25h2.25v-2.25h-1.125m0-2.25h-7.5v2.25h-1.125v2.25h2.25v-2.25h-1.125m7.5-2.25h7.5v2.25h-1.125v2.25h2.25v-2.25h-1.125"></path></svg>';

  return ret;
}

function get2kkiWikiLocationName(location) {
  if (typeof location === 'string')
    return location;
  let locationName = location.title;
    if (location.urlTitle)
      locationName = location.urlTitle.replace(/%26/g, "&").replace(/%27/g, "'").replace(/\_/g, " ").replace(/#.*/, "");
    else {
      const colonIndex = locationName.indexOf(':');
      if (colonIndex > -1)
        locationName = locationName.slice(0, colonIndex);
    }
    return locationName;
}

const _2kkiVersionPattern = /^(pre\-)?(\d+\.\d+)([a-z])?(?:[0-9])?(?: patch (\d+))?/;

function compare2kkiVersionNames(v1, v2) {
  if (v1 === v2)
    return 0;

  const match1 = v1.match(_2kkiVersionPattern);
  const match2 = v2.match(_2kkiVersionPattern);

  if (match1 != null && match2 != null) {
    let verNum1 = parseFloat(match1[2]);
    let verNum2 = parseFloat(match2[2]);

    if (verNum1 === verNum2) {
      let subVer1 = match1[3];
      let subVer2 = match2[3];

      if (subVer1 !== undefined && subVer2 !== undefined) {
        subVer1 = subVer1.toLowerCase();
        subVer2 = subVer2.toLowerCase();
        if (subVer1 !== subVer2)
          return subVer1 < subVer2 ? -1 : 1;
      } else if (subVer2 != null)
        return -1;
      else if (subVer1 != null)
        return 1;

      let patchVer1 = match1[4];
      let patchVer2 = match2[4];

      if (patchVer1 !== undefined && patchVer2 !== undefined) {
        patchVer1 = parseInt(patchVer1);
        patchVer2 = parseInt(patchVer2);
        if (patchVer1 !== patchVer2)
          return patchVer1 < patchVer2 ? -1 : 1;
      } else if (patchVer2 != null)
        return -1;
      else if (patchVer1 != null)
        return 1;
  } else
    return verNum1 < verNum2 ? -1 : 1;
  if (match1[1] !== undefined) {
    if (match2[1] === undefined)
      return -1;
    } else if (match2[1] !== undefined)
      return 1;
  } else if (match2 != null)
    return -1;
  else if (match1 != null)
    return 1;
  
  return 0;
}

const ConnType = {
  ONE_WAY: 1,
  NO_ENTRY: 2,
  UNLOCK: 4,
  LOCKED: 8,
  DEAD_END: 16,
  ISOLATED: 32,
  EFFECT: 64,
  CHANCE: 128,
  LOCKED_CONDITION: 256,
  SHORTCUT: 512,
  EXIT_POINT: 1024,
  SEASONAL: 2048
};

function getConnTypeChar(connType, typeParams) {
  let char;
  switch (connType) {
      case ConnType.ONE_WAY:
          char = "➜";
          break;
      case ConnType.NO_ENTRY:
          char = "⛔";
          break;
      case ConnType.UNLOCK:
          char = "🔑";
          break;
      case ConnType.LOCKED:
          char = "🔒";
          break;
      case ConnType.DEAD_END:
          char = "🚩";
          break;
      case ConnType.ISOLATED:
          char = "↩️";
          break;
      case ConnType.EFFECT:
          char = "✨";
          break;
      case ConnType.CHANCE:
          char = "🍀";
          break;
      case ConnType.LOCKED_CONDITION:
          char = "🔐";
          break;
      case ConnType.SHORTCUT:
          char = "📞";
          break;
      case ConnType.EXIT_POINT:
          char = "☎️";
          break;
      case ConnType.SEASONAL:
          const seasonParam = typeParams ? typeParams.params : null;
          switch (seasonParam || "Summer") {
              case "Spring":
                  char = "🌸";
                  break;
              case "Summer":
                  char = "☀️";
                  break;
              case "Fall":
                  char = "🍂";
                  break;
              case "Winter":
                  char = "❄️";
                  break;
          }
          break;
  }
  return char;
}

function getDepthRgba(depth, maxDepth) {
  const depthColors = [];
  const depthHueIncrement = (1 / maxDepth) * 0.6666;

  for (let d = 0; d <= maxDepth; d++)
    depthColors.push(hueToRGBA(0.6666 - depthHueIncrement * d, 1));

  return depthColors[Math.min(depth, maxDepth)];
}

function checkShow2kkiVersionUpdate() {
  return new Promise(resolve => {
    const chatboxContainer = document.getElementById('chatboxContainer');
    const versionDisplay = document.querySelector('.versionDisplay');
    const removeUpdateDisplayAndResolve = () => {
      chatboxContainer.classList.remove('hidden');
      setTimeout(() => versionDisplay.remove());
      document.querySelector('.versionDisplayZoom')?.remove();
      onResize();
      resolve();
    };

    const currentVersion = document.querySelector('meta[name="2kkiVersion"]').content;
    if (!currentVersion || currentVersion === config.last2kkiVersion)
      return removeUpdateDisplayAndResolve();

    chatboxContainer.classList.add('hidden');

    const versionText = document.querySelector('.version').innerText;
    
    const versionPrefixText = versionText.slice(0, versionText.indexOf(currentVersion));
    const versionNewSuffixText = versionText.slice(versionPrefixText.length);
    const versionOldSuffixText = getLocalizedVersion(config.last2kkiVersion);

    const versionPrefix = document.createElement('h1');
    versionPrefix.innerText = versionPrefixText.trim();
    if (versionPrefixText.endsWith(' '))
      versionPrefix.innerHTML += '&nbsp;';

    versionDisplay.appendChild(versionPrefix);

    const versionSuffix = document.createElement('h1');
    versionSuffix.classList.add('versionDisplaySuffix');

    const versionNewSuffix = document.createElement('span');
    versionNewSuffix.classList.add('infoLabel');
    versionNewSuffix.innerText = versionNewSuffixText;

    const versionOldSuffix = document.createElement('span');
    versionOldSuffix.classList.add('infoLabel');
    versionOldSuffix.innerText = versionOldSuffixText;

    versionSuffix.appendChild(versionOldSuffix);
    versionSuffix.appendChild(versionNewSuffix);

    versionDisplay.appendChild(versionSuffix);

    versionDisplay.classList.remove('hidden');

    config.last2kkiVersion = currentVersion;
    updateConfig(config);

    setTimeout(() => {
      const textHeight = versionPrefix.offsetHeight;
      versionSuffix.style.height = `${textHeight}px`;

      versionDisplay.classList.remove('transparent');

      setTimeout(() => versionOldSuffix.style.marginTop = `-${textHeight + 4}px`, 1000);
      setTimeout(() => {
        const versionDisplayZoom = versionDisplay.cloneNode(true);
        versionDisplayZoom.classList.add('versionDisplayZoom');
        versionDisplay.after(versionDisplayZoom);
        setTimeout(() => versionDisplayZoom.classList.add('zoom', 'transparent'), 10);
      }, 1875);
      setTimeout(removeUpdateDisplayAndResolve, 3500);
    }, 0);
  });
}

function reloadExplorer(trackedLocations) {
  if (!config.enableExplorer)
    return;
  const explorerFrame = document.getElementById('explorerFrame');
  if (!cachedLocations) {
    explorerFrame.src = '';
    return;
  }
  const locationNames = cachedLocations.map(l => get2kkiWikiLocationName(l));
  if (explorerFrame && locationNames && loggedIn) {
    addLoader(explorerFrame, true);
    explorerFrame.onload = () => removeLoader(explorerFrame);
    apiFetch(`explorer${trackedLocations ? `?trackedLocations=${trackedLocations.map(l => l.title).join('|')}` : ''}`).then(response => {
      if (!response.ok)
        throw new Error(response.statusText);
      return response.text();
    })
    .then(url => {
      const newUrl = url ? `${url}&lang=${globalConfig.lang}` : '';
      if (explorerFrame.src !== newUrl) {
        explorerFrame.src = newUrl;
        apiFetch('explorercompletion')
          .then(response => response.text())
          .then(textResponse => {
            const completionPercent = parseInt(textResponse);
            document.getElementById('explorerUndiscoveredLocationsLink').classList.toggle('hidden', !completionPercent || completionPercent < 95);
          });
      } else
        removeLoader(explorerFrame);
    })
    .catch(err => console.error(err));
  }
}

(function () {
  if (!is2kki)
    return;

  compareVersionNames = compare2kkiVersionNames;

  addSessionCommandHandler('l', locationIds => {
    locationIds.map(id => parseInt(id)).map(id => {
      if (!visitedLocationIds.includes(id))
        visitedLocationIds.push(id);
    });
    if (config.trackedLocationId) {
      if (locationIds.map(l => parseInt(l)).includes(config.trackedLocationId)) {
        config.trackedLocationId = null;
        document.getElementById('nextLocationContainer').classList.add('hidden');
        updateConfig(config);
      }
      sendSessionCommand('nl', [ config.trackedLocationId ], params => reloadExplorer(params));
    } else
      reloadExplorer();
  });
})();
