let screenshotCount = 0;
let screenshotLimit = 10;
let communityScreenshotsGame = '';
let communityScreenshotsSortOrder = 'recent';
let communityScreenshotsInterval = 'day';
let communityScreenshotsScrollTop = 0;
let communityScreenshotsScrollTimer = null;
let communityScreenshotsScrollWatch = null;
let lastAppliedScreenshotResolution = document.getElementById('screenshotResolution').value;


const screenshotSlotBpLevels = [
  {
    bp: 100,
    count: 10
  },
  {
    bp: 250,
    count: 15
  },
  {
    bp: 500,
    count: 20
  },
  {
    bp: 1000,
    count: 25
  },
  {
    bp: 2500,
    count: 30
  },
  {
    bp: 5000,
    count: 35
  },
  {
    bp: 7500,
    count: 40
  },
  {
    bp: 10000,
    count: 45
  },
  {
    bp: 12500,
    count: 50
  },
  {
    bp: 15000,
    count: 55
  },
  {
    bp: 17500,
    count: 60
  },
  {
    bp: 20000,
    count: 65
  },
  {
    bp: 25000,
    count: 70
  },
  {
    bp: 0,
    count: 75
  }
];

function setScreenshotResolution(value, isInit) {
  lastAppliedScreenshotResolution = value;
  document.getElementById('screenshotResolution').value = value;
  globalConfig.screenshotResolution = value;
  if (!isInit)
    updateConfig(globalConfig, true);
}

function initScreenshotControls() {
  document.getElementById('autoDownloadScreenshotsButton').onclick = function() {
    this.classList.toggle('toggled');
    const toggled = this.classList.contains('toggled');
    globalConfig.autoDownloadScreenshots = toggled;
    updateConfig(globalConfig, true);
  };

  document.getElementById('screenshotResolution').addEventListener('change', function() {
    const value = this.value;
    if (value && value !== lastAppliedScreenshotResolution) {
      setScreenshotResolution(value);
    }
  });

  document.getElementById('screenshotButton').onclick = () => takeScreenshot();
  const openMyScreenshots = () => {
    initScreenshotsModal(false);
    openModal('myScreenshotsModal');
  };
  const openCommunityScreenshots = () => {
    initScreenshotsModal(true);
    openModal('communityScreenshotsModal');
  };
  document.getElementById('myScreenshotsButton').onclick = openMyScreenshots;
  document.getElementById('communityScreenshotsButton').onclick = openCommunityScreenshots;
  document.getElementById('fsCommunityScreenshotsButton')?.addEventListener('click', openCommunityScreenshots);

  const communityScreenshotsGameSelect = document.getElementById('communityScreenshotsGame');

  apiFetch('screenshot?command=getScreenshotGames').then(response => {
    if (!response.ok)
      throw new Error(response.statusText);
    return response.json();
  }).then(screenshotGames => {
    for (let gameId of gameIds) {
      if (screenshotGames.indexOf(gameId) > -1) {
        const gameOption = document.createElement('option');
        gameOption.value = gameId;
        communityScreenshotsGameSelect.append(gameOption);
      }
    }
  });

  communityScreenshotsGameSelect.onchange = function() {
    communityScreenshotsGame = this.value;
    initScreenshotsModal(true);
  };
  document.getElementById('communityScreenshotsSortOrder').onchange = function() {
    communityScreenshotsSortOrder = this.value;
    initScreenshotsModal(true);
  };
  document.getElementById('communityScreenshotsInterval').onchange = function() {
    communityScreenshotsInterval = this.value;
    initScreenshotsModal(true);
  };
}

function viewScreenshot(url, date, screenshotData, lastModal) {
  const isRemote = url.startsWith(serverUrl);
  const isTemp = isRemote && url.includes('/temp/');

  const screenshot = document.createElement('img');
  screenshot.classList.add('screenshot', 'unselectable');
  screenshot.src = url;

  const screenshotModal = document.getElementById('screenshotModal');
  const screenshotModalContent = screenshotModal.querySelector('.modalContent');
  screenshotModalContent.innerHTML = '';
  screenshotModalContent.append(screenshot);

  let isTransientSpoiler = false;

  if (screenshotData?.hasOwnProperty('id') && !isTemp) {
    screenshotModalContent.append(getScreenshotControls(screenshotData.hasOwnProperty('owner'), screenshotData, () => {
      if (!screenshotData.owner)
        initScreenshotsModal(false);
      closeModal('screenshotModal');
    }));
  } else if (!isTemp) {
    screenshotModalContent.append(getTransientScreenshotControls(spoiler => isTransientSpoiler = spoiler));
  }

  const saveButton = screenshotModal.querySelector('.saveScreenshotButton');

  screenshotModal.querySelector('.downloadScreenshotButton').onclick = () => downloadScreenshot(url, date, screenshotData);

  saveButton.classList.toggle('hidden', isRemote);
  saveButton.disabled = screenshotCount >= screenshotLimit ? 'disabled' : undefined;
  if (!isRemote) {
    saveButton.onclick = () => {
      if (isRemote)
        return;
      addLoader(screenshotModal, true);
      uploadScreenshot(url, screenshotData?.mapId, screenshotData?.mapX, screenshotData?.mapY).then(success => {
        removeLoader(screenshotModal);
        if (success) {
          initScreenshotsModal(false);
          openModal('myScreenshotsModal');
        }
      });
    };
  }

  const shareButton = screenshotModal.querySelector('.shareScreenshotButton');
  shareButton.classList.toggle('hidden', isTemp || (screenshotData?.owner?.uuid && screenshotData.uuid !== playerData.uuid) || (isRemote && !screenshotData.public));

  const shareScreenshot = (id, isRemote) => {
    const chatInput = document.getElementById("chatInput");
    const inputVal = chatInput.value.toLowerCase();
    if (!inputVal.includes('[screenshot]'))
      chatInput.value += `${chatInput.value.trim() ? ' ' : ''}[screenshot]`;
    chatInput.dataset.screenshotId = id;
    chatInput.dataset.screenshotTemp = !isRemote ? 'temp' : '';
    const flags = +(isTransientSpoiler || !!screenshotData?.spoiler);
    if (flags)
      chatInput.dataset.screenshotFlags = flags;
  }

  shareButton.onclick = () => {
    if (isRemote) {
      shareScreenshot(screenshotData.id, true);
      closeModal();
    } else {
      addLoader(screenshotModal, true);
      uploadScreenshot(url, screenshotData?.mapId, screenshotData?.mapX, screenshotData?.mapY, true).then(id => {
        removeLoader(screenshotModal);
        if (id) {
          closeModal();
          shareScreenshot(id);
        }
      });
    }
  };

  const modalTitle = screenshotModal.querySelector('.modalTitle');
  const playerModalTitle = screenshotModal.querySelector('.playerScreenshotModalTitle');

  if (!screenshotData?.owner?.uuid || screenshotData.owner.uuid === playerData.uuid) {
    modalTitle.classList.remove('hidden');
    playerModalTitle.classList.add('hidden');
    playerModalTitle.innerHTML = '';
  } else {
    modalTitle.classList.add('hidden');
    playerModalTitle.innerHTML = getMassagedLabel(localizedMessages.screenshots.playerScreenshot, true).replace('{USER}', screenshotData.owner.name);
    playerModalTitle.classList.remove('hidden');
  }

  openModal('screenshotModal', null, lastModal);
}

async function downloadScreenshot(url, date, screenshotData, resized) {
  if (url.startsWith(serverUrl)) {
    fetch(url).then(response => response.blob()).then(async blob => {
      const blobUrl = URL.createObjectURL(blob);
      await downloadScreenshot(blobUrl, date, screenshotData, resized);
      URL.revokeObjectURL(blobUrl);
    });
    return;
  }

  if (!resized && globalConfig.screenshotResolution > 1) {
    const scaleCanvas = document.createElement('canvas');
    const scaleContext = scaleCanvas.getContext('2d');

    const width = 320 * globalConfig.screenshotResolution;
    const height = 240 * globalConfig.screenshotResolution;

    scaleCanvas.width = width;
    scaleCanvas.height = height;

    scaleContext.imageSmoothingEnabled = false;

    const img = new Image(320, 240);
    img.onload = async () => {
      scaleContext.drawImage(img, 0, 0, width, height);
      scaleCanvas.toBlob(async blob => {
        const blobUrl = URL.createObjectURL(blob);
        await downloadScreenshot(blobUrl, date, screenshotData, true);
        URL.revokeObjectURL(blobUrl);
      });
    };
    img.src = url;
    await img.decode();
    return;
  }

  const a = document.createElement('a');
  const [month, day, year, hour, minute, second] = [date.getMonth(), date.getDate(), date.getFullYear(), date.getHours(), date.getMinutes(), date.getSeconds()];
  const formattedDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}-${hour.toString().padStart(2, '0')}h${minute.toString().padStart(2, '0')}m${second.toString().padStart(2, '0')}s`;
  const game = screenshotData?.game || ynoGameId;
  let mapName = gameLocalizedMapLocations[game][screenshotData?.mapId];
  if (!mapName && game === '2kki' && screenshotData?.mapId)
    if (screenshotData.game) // if game is set (non-local screenshot) it's incorrect to use the cached 2kki values.
      mapName = await new Promise(resolve => getOrQuery2kkiLocations(screenshotData.mapId, null, null, resolve));
    else
      mapName = await new Promise(resolve => getOrQuery2kkiLocations(screenshotData.mapId, cachedPrevMapId, cachedPrev2kkiLocations, resolve));
  if (mapName) mapName = determineTitle(mapName, screenshotData?.mapX, screenshotData?.mapY);
  if (!mapName || mapName === localizedMessages.location.queryingLocation)
    mapName = localizedMessages.location.unknownLocation;

  a.href = url;
  a.download = `ynoproject_${game}_${mapName.replace(/[\s.]+/g, '_')}_screenshot_${formattedDate}`;
  a.click();
}

function takeScreenshot() {
  // Use requestAnimationFrame to wait for the next repaint
  requestAnimationFrame(function() {
    const screenshotCanvas = document.createElement('canvas');
    const screenshotContext = screenshotCanvas.getContext('2d');

    screenshotCanvas.width = 320;
    screenshotCanvas.height = 240;

    screenshotContext.drawImage(canvas, 0, 0, 320, 240);

    const url = screenshotCanvas.toDataURL();

    const dateTaken = new Date();

    const mapId = cachedMapId;

    const [mapX, mapY] = easyrpgPlayer.api.getPlayerCoords();

    if (notificationConfig.all && notificationConfig.screenshots.all && notificationConfig.screenshots.screenshotTaken) {
      const toast = showScreenshotToastMessage('screenshotTaken', 'image', true, null, true);
      const thumb = document.createElement('img');
      thumb.classList.add('screenshotThumbnail', 'imageThumbnail');
      thumb.src = url;
      toast.querySelector('.toastMessage').prepend(thumb);
      toast.classList.add('screenshotToast');
      // force the toast to appear from the bottom
      const height = toast.getBoundingClientRect().height + 8;
      document.getElementById('toastContainer').style.setProperty('--toast-offset', `-${height}px`);

      thumb.onclick = () => viewScreenshot(url, dateTaken, { mapId, mapX, mapY });

      if (!globalConfig.autoDownloadScreenshots)
        return;
    }

    downloadScreenshot(url, dateTaken, { mapId, mapX, mapY });
  });
}

function uploadScreenshot(url, mapId, mapX, mapY, temp) {
  return new Promise(resolve => {
    apiPost(`screenshot?command=upload&mapId=${mapId}&mapX=${mapX}&mapY=${mapY}&temp=${temp ? 1 : 0}`, getScreenshotBinary(url), 'application/png')
      .then(response => {
        if (!response.ok)
          throw new Error(response.statusText);
        return response.text();
      })
      .then(id => resolve(id))
      .catch(err => {
        console.error(err);
        resolve(null);
      });
  });
}

function checkScreenshot(canvas) {
  const context = canvas.getContext('2d');

  for (let y = 8; y < canvas.height - 8; y += 16) {
    for (let x = 8; x < canvas.width - 8; x += 16) {
      const pixel = context.getImageData(x, y, 1, 1).data;
      if (pixel[0] > 1 || pixel[1] > 1 || pixel[2] > 1)
        return true;
    }
  }

  return false;
}

/** {@link url} must be a data URL. */
function getScreenshotBinary(url) {
  const arr = url.split(',');
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const ret = new Uint8Array(n);
  while (n--)
    ret[n] = bstr.charCodeAt(n);
  return ret;
}

function updateMyScreenshotsModalHeader(screenshotCount) {
  document.getElementById('myScreenshotsLimitLabel').innerHTML = getMassagedLabel(localizedMessages.screenshots.limit, true).replace('{COUNT}', screenshotCount).replace('{LIMIT}', screenshotLimit);
  document.getElementById('myScreenshotsEmptyLabel').classList.toggle('hidden', !!screenshotCount);
}

function initScreenshotsModal(isCommunity) {
  const screenshotsModal = document.getElementById(isCommunity ? 'communityScreenshotsModal' : 'myScreenshotsModal');
  const scrollToRefreshIndicator = isCommunity ? screenshotsModal.querySelector('.infiniteScrollRefreshIndicator') : null;
  const screenshotItemsList = screenshotsModal.querySelector('.itemContainer');
  screenshotItemsList.innerHTML = '';
  if (isCommunity) {
    addFilterInputs('communityScreenshots', () => initScreenshotsModal(true), { id: 'communityScreenshotsUsernameInput', label: 'User Name' }, { id: 'communityScreenshotsMapnameInput', label: 'Map Name' });
    scrollToRefreshIndicator.classList.add('transparent');
    screenshotItemsList.classList.remove('scrollToRefresh');
    screenshotItemsList.classList.remove('end');
    if (communityScreenshotsScrollTimer) {
      clearInterval(communityScreenshotsScrollTimer);
      communityScreenshotsScrollTimer = null;
      screenshotItemsList.onscroll = null;
    }
  } else {
    const totalBp = badgeCache.filter(b => b.unlocked && !b.hidden).reduce((sum, b) => sum + b.bp, 0);

    let levelSlotBp = 0;
    let prevLevelSlotBp = 0;

    for (let sl = 0; sl < screenshotSlotBpLevels.length; sl++) {
      const slotBpLevel = screenshotSlotBpLevels[sl];
      levelSlotBp = Math.max(slotBpLevel.bp - prevLevelSlotBp, 0);
      if (totalBp < slotBpLevel.bp)
        break;
      prevLevelSlotBp = slotBpLevel.bp;
    }

    const rootStyle = document.documentElement.style;

    rootStyle.setProperty('--screenshot-slot-level-total-bp', levelSlotBp);
    rootStyle.setProperty('--screenshot-slot-level-bp', totalBp - prevLevelSlotBp);
  }

  let limitOffset = 0;

  const contentWidth = window.innerWidth - 112 - 18;
  const itemsPerRow = Math.floor(contentWidth / 220);
  const chunkSize = itemsPerRow * 2;

  const addScreenshots = screenshots => {
    if (!isCommunity) {
      screenshotCount = screenshots?.length || 0;
      updateMyScreenshotsModalHeader(screenshotCount);
    }

    if (!screenshots?.length)
      return;

    for (let screenshot of screenshots) {
      const uuid = (isCommunity ? screenshot.owner : screenshot).uuid;
      let screenshotSystemName = (isCommunity ? screenshot.owner : screenshot).systemName.replace(/'/g, '');
      if (allGameUiThemes[screenshot.game].indexOf(screenshotSystemName) === -1)
        screenshotSystemName = getDefaultUiTheme(screenshot.game);
      const parsedSystemName = screenshotSystemName.replace(/ /g, '_');

      const screenshotItem = document.createElement('div');
      screenshotItem.classList.add('screenshotItem', 'imageItem', 'item', 'hideContents');
      if (screenshot.spoiler)
        screenshotItem.classList.add('spoiler');

      const screenshotThumbnailContainer = document.createElement('div');
      screenshotThumbnailContainer.classList.add('screenshotThumbnailContainer', 'imageThumbnailContainer');

      const screenshotThumbnail = document.createElement('img');
      screenshotThumbnail.classList.add('screenshotThumbnail', 'imageThumbnail', 'unselectable');
      screenshotThumbnail.src = `${serverUrl}/screenshots/${uuid}/${screenshot.id}.png`;
      screenshotThumbnail.onclick = () => viewScreenshot(screenshotThumbnail.src, new Date(screenshot.timestamp), screenshot, screenshotsModal.id);

      screenshotThumbnailContainer.append(screenshotThumbnail);

      const spoilerLabel = document.createElement('h3');
      spoilerLabel.classList.add('spoilerLabel', 'infoLabel', 'unselectable');
      spoilerLabel.innerHTML = getMassagedLabel(localizedMessages.screenshots.spoiler.label, true);

      screenshotThumbnailContainer.appendChild(spoilerLabel);

      const screenshotControls = getScreenshotControls(isCommunity, screenshot, () => {
        screenshotItem.remove();
        if (isCommunity)
          limitOffset++;
        else
          updateMyScreenshotsModalHeader(screenshotItemsList.childElementCount);
      });

      screenshotItem.append(screenshotThumbnailContainer);
      screenshotItem.append(screenshotControls);

      if (parseInt(screenshot.mapId)) {
        const screenshotLocation = document.createElement('span');
        screenshotLocation.classList.add('screenshotLocation', 'imageItemLocation', 'infoText');

        screenshotItem.append(screenshotLocation);

        let locationContent;
        const setScreenshotLocation = () => {
          if (gameLocalizedMapLocations[screenshot.game] && gameLocalizedMapLocations[screenshot.game].hasOwnProperty(screenshot.mapId))
            locationContent = getLocalizedMapLocationsHtml(screenshot.game, screenshot.mapId, '0000', screenshot.mapX, screenshot.mapY, getInfoLabel('&nbsp;|&nbsp;'));
          else if (gameId === '2kki') {
            locationContent = getInfoLabel(getMassagedLabel(localizedMessages.location.queryingLocation));
            getOrQuery2kkiLocationsHtml(screenshot.mapId, locationsHtml => {
              locationContent = locationsHtml;
              screenshotLocation.innerHTML = locationsHtml;
            });
          } else
            locationContent = getInfoLabel(getMassagedLabel(localizedMessages.location.unknownLocation));
          screenshotLocation.innerHTML = locationContent;
        };
        if (screenshot.game in gameLocalizedMapLocations)
          setScreenshotLocation();
        else {
          screenshotLocation.innerHTML = getInfoLabel(getMassagedLabel(localizedMessages.location.queryingLocation));
          fetchAndInitLocations(globalConfig.lang, screenshot.game).then(() => setScreenshotLocation());
        }
      }

      if (isCommunity) {
        screenshotControls.insertAdjacentHTML('afterend', getPlayerName({ name: screenshot.owner.name, systemName: screenshotSystemName, rank: screenshot.owner.rank, account: true, badge: screenshot.owner.badge || 'null' }, false, true, true));

        const playerName = screenshotItem.querySelector('.nameTextContainer');
        const badgeEl = playerName.querySelector('.badge');
        if (badgeEl && localizedBadges) {
          const badge = findBadge(screenshot.owner.badge);
          const badgeGame = localizedBadges[badge?.game]?.[screenshot.owner.badge] && badge.game;
          if (badgeGame) {
            const badgeTippy = addTooltip(badgeEl, getMassagedLabel(localizedBadges[badgeGame][screenshot.owner.badge].name, true), true, true);
            if (!badge || badge.hidden)
              badgeTippy.popper.querySelector('.tooltipContent').classList.add('altText');
          }
          if (screenshot.owner.name) {
            if (badge?.overlayType & BadgeOverlayType.LOCATION)
              handleBadgeOverlayLocationColorOverride(badgeEl.querySelector('.badgeOverlay'), badgeEl.querySelector('.badgeOverlay2'), null, screenshot.owner.name);
            addOrUpdatePlayerBadgeGalleryTooltip(badgeEl, screenshot.owner.name, screenshotSystemName);
            badgeEl.classList.toggle('badgeButton', screenshot.owner.name);
          }
        }
      }

      // Filter Screenshots -  filter by text
      let textFilter = document.getElementById('communityScreenshotsFilterInput')?.value;

      if (!isCommunity || textFilter === '')
        screenshotItemsList.append(screenshotItem);
      else {
        textFilter = textFilter.toLowerCase();

        // Filter Screenshots -  Check if location and filter matches
        if (document.getElementById('communityScreenshotsMapnameInput').checked && (screenshotItem.getElementsByClassName("screenshotLocation")[0]?.innerText.toLowerCase().includes(textFilter)))
          screenshotItemsList.append(screenshotItem);
        // Filter Screenshots -  Check if username and filter matches
        else if (document.getElementById('communityScreenshotsUsernameInput').checked && (screenshotItem.getElementsByClassName("nameText")[0]?.innerText.toLowerCase().includes(textFilter)))
          screenshotItemsList.append(screenshotItem);
      }

      initUiThemeContainerStyles(screenshotSystemName, screenshot.game, false, () => {
        initUiThemeFontStyles(screenshotSystemName, screenshot.game, 0, false, () => setTimeout(() => screenshotItem.classList.remove('hideContents'), 0));
      });

      applyThemeStyles(screenshotItem, parsedSystemName, screenshot.game);

      updateThemedContainer(screenshotItem);
    }
  };

  if (isCommunity) {
    const getFeedQuery = (offset, limit, offsetId) => {
      let query = `screenshot?command=getScreenshotFeed&offset=${offset}&limit=${limit}`;
      if (offsetId)
        query += `&offsetId=${offsetId}`;
      if (communityScreenshotsGame)
        query += `&game=${communityScreenshotsGame}`;
      if (communityScreenshotsSortOrder)
        query += `&sortOrder=${communityScreenshotsSortOrder}`;
      if (communityScreenshotsInterval)
        query += `&interval=${communityScreenshotsInterval}`;
      return query;
    };

    let offset = 0;
    let offsetId;

    if (communityScreenshotsScrollWatch)
      communityScreenshotsScrollWatch.destroy();
    communityScreenshotsScrollWatch = new ScrollWatch({
      container: '#communityScreenshotsModal .modalContent',
      watch: '.screenshotItem',
      watchOnce: false,
      infiniteScroll: true,
      infiniteOffset: 32,
      debounce: true,
      scrollDebounce: 125,
      resizeDebounce: 125,
      watchOffsetYTop: 250,
      watchOffsetYBottom: 250,
      onElementInView: e => e.el.classList.remove('hideContents'),
      onElementOutOfView: e => {
        e.el.classList.add('hideContents');
        e.el.style.containIntrinsicHeight = `${e.el.offsetHeight}px`;
      },
      onInfiniteYInView: () => {
        const query = getFeedQuery(offset, chunkSize + limitOffset, offsetId);
        offset += chunkSize + limitOffset;
        if (limitOffset)
          limitOffset = 0;
        apiFetch(query).then(response => {
          if (!response.ok)
            throw new Error(response.statusText);
          return response.json();
        }).then(screenshots => {
          if (screenshots?.length) {
            if (!offsetId) {
              offsetId = screenshots[0].id;
              removeLoader(screenshotsModal);
            }
            addScreenshots(screenshots);
            communityScreenshotsScrollWatch.refresh();
          } else {
            if (!offsetId)
              removeLoader(screenshotsModal);
            communityScreenshotsScrollWatch.pauseInfiniteScroll();
            screenshotItemsList.classList.add('end');
          }
        });
      }
    });

    communityScreenshotsScrollTimer = setInterval(() => {
      if (!offsetId)
        return;
      apiFetch(getFeedQuery(0, 1)).then(response => {
        if (!response.ok)
          throw new Error(response.statusText);
        return response.json();
      }).then(screenshots => {
        if (screenshots?.length && screenshots[0].id !== offsetId) {
          clearInterval(communityScreenshotsScrollTimer);
          communityScreenshotsScrollTimer = null;

          scrollToRefreshIndicator.classList.remove('transparent');
          screenshotItemsList.classList.add('scrollToRefresh');
          if (screenshotItemsList.scrollTop < 32) {
            screenshotItemsList.scrollTo({
              top: 32,
              behavior: 'smooth'
            });
          }
          setTimeout(() => {
            screenshotItemsList.onscroll = e => {
              if (e.target.scrollTop < 32) {
                screenshotItemsList.onscroll = null;
                setTimeout(() => initScreenshotsModal(true), 500);
              }
            };
          }, 250);
        }
      });
    }, 30000);
  } else {
    apiFetch('screenshot?command=getPlayerScreenshots').then(response => {
      if (!response.ok)
        throw new Error(response.statusText);
      return response.json();
    }).then(screenshots => {
      removeLoader(screenshotsModal);
      addScreenshots(screenshots);
    });
  }

  addLoader(screenshotsModal);
}

function getScreenshotControls(isCommunity, screenshot, deleteCallback) {
  const screenshotControls = document.createElement('div');
  screenshotControls.classList.add('screenshotControls', 'imageControls');
  screenshotControls.dataset.screenshotId = screenshot.id;

  if (!isCommunity) {
    const publicButton = getSvgIcon('playerLocation');
    publicButton.classList.add('iconButton', 'toggleButton', 'altToggleButton', 'publicToggle');
    if (screenshot.public)
      publicButton.classList.add('toggled');
    publicButton.onclick = function() {
      const toggled = !this.classList.contains('toggled');
      apiFetch(`screenshot?command=setPublic&id=${screenshot.id}&value=${toggled ? 1 : 0}`).then(response => {
        if (!response.ok)
          throw new Error(response.statusText);
        screenshot.public = toggled;
        document.querySelectorAll(`.screenshotControls[data-screenshot-id='${screenshot.id}'] .publicToggle`).forEach(publicButton => {
          publicButton.classList.toggle('toggled', toggled);
          addTooltip(publicButton, getMassagedLabel(localizedMessages.screenshots.public.tooltip[toggled ? 'off' : 'on'], true), true);
        });
      });
    };
    addTooltip(publicButton, getMassagedLabel(localizedMessages.screenshots.public.tooltip[screenshot.public ? 'off' : 'on'], true), true);

    screenshotControls.append(publicButton);
  }

  const likeContainer = document.createElement('div');
  likeContainer.classList.add('likeContainer');

  const likeButton = getSvgIcon('like');
  likeButton.classList.add('iconButton', 'toggleButton', 'altToggleButton');
  if (screenshot.liked)
    likeButton.classList.add('toggled', 'fillIcon');
  likeButton.onclick = function() {
    const toggled = !this.classList.contains('toggled');
    apiFetch(`screenshot?command=setLike&id=${screenshot.id}&value=${toggled ? 1 : 0}`).then(response => {
      if (!response.ok)
        throw new Error(response.statusText);
      screenshot.liked = toggled;
      screenshot.likeCount += (toggled ? 1 : -1);
      document.querySelectorAll(`.screenshotControls[data-screenshot-id='${screenshot.id}'] .likeContainer`).forEach(likeContainer => {
        const likeButton = likeContainer.querySelector('.toggleButton');
        likeButton.classList.toggle('toggled');
        likeButton.classList.toggle('fillIcon');
        addTooltip(likeButton, getMassagedLabel(localizedMessages.screenshots.like.tooltip[toggled ? 'off' : 'on'], true), true);
        likeContainer.querySelector('.infoLabel').innerText = screenshot.likeCount;
      });
    });
  };
  addTooltip(likeButton, getMassagedLabel(localizedMessages.screenshots.like.tooltip[screenshot.liked ? 'off' : 'on'], true), true);

  likeContainer.append(likeButton);
  screenshotControls.append(likeContainer);

  likeButton.insertAdjacentHTML('afterend', getInfoLabel(screenshot.likeCount));

  const likeCountLabel = likeContainer.querySelector('.infoLabel');
  likeCountLabel.classList.add('likeCount', 'unselectable');

  if (!isCommunity || screenshot.owner.uuid === playerData.uuid || playerData.rank) {
    const spoilerButton = getSvgIcon('visible');
    spoilerButton.classList.add('iconButton', 'offToggleButton', 'spoilerToggle');
    if (screenshot.spoiler)
      spoilerButton.classList.add('toggled');
    spoilerButton.onclick = function() {
      const toggled = !this.classList.contains('toggled');
      apiFetch(`screenshot?command=setSpoiler&id=${screenshot.id}&value=${toggled ? 1 : 0}`).then(response => {
        if (!response.ok)
          throw new Error(response.statusText);
        screenshot.spoiler = toggled;
        document.querySelectorAll(`.screenshotControls[data-screenshot-id='${screenshot.id}'] .spoilerToggle`).forEach(spoilerButton => {
          spoilerButton.classList.toggle('toggled', toggled);
          addTooltip(spoilerButton, getMassagedLabel(localizedMessages.screenshots.spoiler.tooltip[toggled ? 'off' : 'on'], true), true);
          const prevEl = spoilerButton.parentElement.previousElementSibling;
          if (prevEl && prevEl.classList.contains('screenshotThumbnailContainer'))
            prevEl.parentElement.classList.toggle('spoiler', toggled);
        });
      });
    };
    addTooltip(spoilerButton, getMassagedLabel(localizedMessages.screenshots.spoiler.tooltip[screenshot.spoiler ? 'off' : 'on'], true), true);

    const spoilerButtonOffIndicator = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    spoilerButtonOffIndicator.setAttribute('d', 'm-2 16l22-14');

    spoilerButton.querySelector('svg').appendChild(spoilerButtonOffIndicator);

    screenshotControls.append(spoilerButton);

    const deleteButton = getSvgIcon('delete');
    deleteButton.classList.add('iconButton');
    deleteButton.onclick = () => {
      showConfirmModal(localizedMessages.screenshots.delete.confirm, () => {
        let query = `screenshot?command=delete&id=${screenshot.id}`;
        if (isCommunity && screenshot.owner.uuid !== playerData.uuid)
          query += `&uuid=${screenshot.owner.uuid}`;

        apiFetch(query).then(response => {
          if (!response.ok)
            throw new Error(response.statusText);
          if (deleteCallback)
            deleteCallback();
        });
      });
    };
    addTooltip(deleteButton, getMassagedLabel(localizedMessages.screenshots.delete.tooltip, true), true);

    screenshotControls.append(deleteButton);
  }

  return screenshotControls;
}

function getTransientScreenshotControls(spoilerCallback) {
  const screenshotControls = document.createElement('div');
  screenshotControls.classList.add('screenshotControls', 'imageControls');

  const spoilerButton = getSvgIcon('visible');
  spoilerButton.classList.add('iconButton', 'offToggleButton', 'spoilerToggle');
  spoilerButton.onclick = () => {
    const toggled = spoilerButton.classList.toggle('toggled');
    addTooltip(spoilerButton, getMassagedLabel(localizedMessages.screenshots.spoiler.tooltip[toggled ? 'off' : 'on'], true), true);
    if (spoilerCallback)
      spoilerCallback(toggled);
  };
  const spoilerButtonOffIndicator = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  spoilerButtonOffIndicator.setAttribute('d', 'm-2 16l22-14');

  spoilerButton.querySelector('svg').appendChild(spoilerButtonOffIndicator);
  screenshotControls.appendChild(spoilerButton);
  addTooltip(spoilerButton, getMassagedLabel(localizedMessages.screenshots.spoiler.tooltip.on, true), true);

  return screenshotControls;
}

function showScreenshotToastMessage(key, icon, iconFill, systemName, persist) {
  if (!notificationConfig.screenshots.all || !notificationConfig.screenshots[key])
    return;
  const message = getMassagedLabel(localizedMessages.toast.screenshots[key], true);
  return showToastMessage(message, icon, iconFill, systemName, persist);
}

(function () {
  addSessionCommandHandler('psi');
})();
