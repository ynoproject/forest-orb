const maxBadgeSlotRows = 7;
const maxBadgeSlotCols = 7;
let badgeSlotRows = 1;
let badgeSlotCols = 3;

let badgeCache;
let badgeSlotCache;
let badgeFilterCache = [];
let badgeCacheUpdateTimer = null;

let localizedBadgeGroups;
let localizedBadges;
let localizedBadgesIgnoreUpdateTimer = null;

const badgeGalleryRowBpLevels = [
  {
    bp: 1000,
    count: 1
  },
  {
    bp: 2500,
    count: 2
  },
  {
    bp: 5000,
    count: 3
  },
  {
    bp: 10000,
    count: 4
  },
  {
    bp: 17500,
    count: 5
  },
  {
    bp: 30000,
    count: 6
  },
  {
    bp: 0,
    count: 7
  }
];
const badgeGalleryColBcLevels = [
  {
    bc: 50,
    count: 3
  },
  {
    bc: 150,
    count: 4
  },
  {
    bc: 300,
    count: 5
  },
  {
    bc: 500,
    count: 6
  },
  {
    bc: 0,
    count: 7
  }
];
const BadgeOverlayType = {
  GRADIENT: 1,
  MULTIPLY: 2,
  MASK: 4,
  DUAL: 8,
  LOCATION: 16
};

function initBadgeControls() {
  const badgeModalContent = document.querySelector('#badgesModal .modalContent');

  const onClickBadgeButton = (prevModal, slotRow, slotCol) => {
    if (slotRow && slotCol && (slotRow > badgeSlotRows || slotCol > badgeSlotCols))
      return;

    badgeModalContent.innerHTML = '';

    const updateBadgesAndPopulateModal = () => {
      document.getElementById('badgeGalleryButton').classList.toggle('hidden', !!(slotRow && slotCol));
      fetchPlayerBadges(playerBadges => {
        let lastGame = null;
        let lastGroup = null;
        const badgeCompareFunc = (a, b) => {
          if (a.game !== b.game) {
            if (a.game === 'ynoproject')
              return -1;
            if (b.game === 'ynoproject')
              return 1;
            if (a.game === gameId)
              return -1;
            if (b.game === gameId)
              return 1;
            return gameIds.indexOf(a.game) < gameIds.indexOf(b.game) ? -1 : 1;
          }
          return 0;
        };
        badgeFilterCache.splice(0, badgeFilterCache.length);
        const badges = [{ badgeId: 'null', game: null}].concat(playerBadges.sort(badgeCompareFunc));
        for (let badge of badges) {
          if (badge.game !== lastGame) {
            const gameHeader = document.createElement('h2');
            gameHeader.classList.add('itemCategoryHeader');
            gameHeader.dataset.game = badge.game;
            gameHeader.innerHTML = getMassagedLabel(localizedMessages.games[badge.game]);
            badgeModalContent.appendChild(gameHeader);
            lastGame = badge.game;
            lastGroup = null;
          }
          if (badge.group != lastGroup && localizedBadgeGroups.hasOwnProperty(lastGame) && localizedBadgeGroups[lastGame].hasOwnProperty(badge.group)) {
            const groupHeader = document.createElement('h3');
            groupHeader.classList.add('itemCategoryHeader');
            groupHeader.dataset.game = badge.game;
            groupHeader.dataset.group = badge.group;
            groupHeader.innerHTML = getMassagedLabel(localizedBadgeGroups[lastGame][badge.group]);
            badgeModalContent.appendChild(groupHeader);
            lastGroup = badge.group;
          }
          const item = getBadgeItem(badge, true, true, true, true, true);
          if (badge.badgeId === (playerData?.badge || 'null'))
            item.children[0].classList.add('selected');
          if (!item.classList.contains('disabled')) {
            item.onclick = slotRow && slotCol
              ? () => updatePlayerBadgeSlot(badge.badgeId, slotRow, slotCol, () => {
                updateBadgeSlots(() => {
                  initAccountSettingsModal();
                  initBadgeGalleryModal();
                  closeModal()
                });
              })
              : () => updatePlayerBadge(badge.badgeId, () => {
                initAccountSettingsModal();
                closeModal();
              });
          }
          badgeModalContent.appendChild(item);
        }
        removeLoader(document.getElementById('badgesModal'));
      });
    };
    updateBadgeVisibility();
    openModal('badgesModal', null, prevModal || null);
    addLoader(document.getElementById('badgesModal'), true);
    if (!badgeCache.filter(b => !localizedBadges.hasOwnProperty(b.game) || !localizedBadges[b.game].hasOwnProperty(b.badgeId)).length || localizedBadgesIgnoreUpdateTimer)
      updateBadgesAndPopulateModal();
    else
      updateLocalizedBadges(updateBadgesAndPopulateModal);
  };

  document.getElementById('badgeButton').onclick = () => onClickBadgeButton();
  document.getElementById('accountBadgeButton').onclick = () => onClickBadgeButton('accountSettingsModal');

  const updateBadgeVisibility = () => {
    const unlockStatus = document.getElementById('badgeUnlockStatus').value;
    const searchTerm = document.getElementById('badgeSearch').value.toLowerCase();

    const gameVisibilities = {};
    const gameGroupVisibilities = {};

    for (let item of badgeFilterCache) {
      let visible = true;
      if (unlockStatus !== "")
        visible &= item.el.classList.contains('locked') === !parseInt(unlockStatus);
      if (searchTerm.trim().length)
        visible &= item.title && item.title.indexOf(searchTerm) > -1;
      if (!gameVisibilities.hasOwnProperty(item.game)) {
        gameVisibilities[item.game] = false;
        gameGroupVisibilities[item.game] = {};
      }
      if (item.group && !gameGroupVisibilities[item.game].hasOwnProperty(item.group))
        gameGroupVisibilities[item.game][item.group] = false;
      if (visible) {
        if (!gameVisibilities[item.game])
          gameVisibilities[item.game] = true;
        if (item.group && !gameGroupVisibilities[item.game][item.group])
          gameGroupVisibilities[item.game][item.group] = true;
      }
      item.el.classList.toggle('hidden', !visible);
    }

    for (let header of badgeModalContent.querySelectorAll('.itemCategoryHeader'))
      header.classList.toggle('hidden', !(header.dataset.group ? gameGroupVisibilities[header.dataset.game][header.dataset.group] : gameVisibilities[header.dataset.game]));
  };

  document.getElementById('badgeUnlockStatus').onchange = updateBadgeVisibility;

  let searchTimer = null;
  document.getElementById('badgeSearch').oninput = function () {
    const _this = this;
    const value = this.value;
    if (searchTimer) {
      clearTimeout(searchTimer);
      searchTimer = null;
    } else
      addLoader(badgeModalContent, true);
    searchTimer = setTimeout(() => {
      searchTimer = null;
      if (_this.value === value)
        updateBadgeVisibility();
      removeLoader(badgeModalContent);
    }, 500);
  };

  document.getElementById('badgeGalleryButton').onclick = () => {
    updateBadgeSlots(() => {
      initBadgeGalleryModal();
      openModal('badgeGalleryModal');
    });
  };

  const badgeGalleryModalContent = document.querySelector('#badgeGalleryModal .modalContent');

  for (let r = 1; r <= maxBadgeSlotRows; r++) {
    const badgeSlotRow = document.createElement('div');
    badgeSlotRow.classList.add('itemRow');
    for (let c = 1; c <= maxBadgeSlotCols; c++) {
      const badgeSlotButton = document.createElement('div');
      badgeSlotButton.classList.add('badgeSlotButton');
      badgeSlotButton.classList.add('badgeItem');
      badgeSlotButton.classList.add('item');
      badgeSlotButton.classList.add('unselectable');
      badgeSlotButton.dataset.row = r;
      badgeSlotButton.dataset.col = c;
      badgeSlotButton.onclick = () => onClickBadgeButton('badgeGalleryModal', r, c);
      badgeSlotRow.appendChild(badgeSlotButton);
    }
    badgeGalleryModalContent.appendChild(badgeSlotRow);
  }
}

function initBadgeGalleryModal() {
  const unlockedBadges = badgeCache.filter(b => b.unlocked && !b.hidden);
  const totalBp = unlockedBadges.reduce((sum, b) => sum + b.bp, 0);
  const totalBc = unlockedBadges.length;

  let levelRowBp = 0;
  let prevLevelRowBp = 0;
  
  for (let rl = 0; rl < badgeGalleryRowBpLevels.length; rl++) {
    const rowBpLevel = badgeGalleryRowBpLevels[rl];
    levelRowBp = Math.max(rowBpLevel.bp - prevLevelRowBp, 0);
    if (totalBp < rowBpLevel.bp)
      break;
    prevLevelRowBp = rowBpLevel.bp;
  }

  let levelColBc = 0;
  let prevLevelColBc = 0;

  for (let cl = 0; cl < badgeGalleryColBcLevels.length; cl++) {
    const colBcLevel = badgeGalleryColBcLevels[cl];
    levelColBc = Math.max(colBcLevel.bc - prevLevelColBc, 0);
    if (totalBc < colBcLevel.bc)
      break;
    prevLevelColBc = colBcLevel.bc;
  }

  const rootStyle = document.documentElement.style;

  rootStyle.setProperty('--row-level-total-bp', levelRowBp);
  rootStyle.setProperty('--row-level-bp', totalBp - prevLevelRowBp);
  document.getElementById('totalBp').innerHTML = getMassagedLabel(localizedMessages.badgeGallery.bp.replace('{BP}', totalBp), true);
  rootStyle.setProperty('--col-level-total-bc', levelColBc);
  rootStyle.setProperty('--col-level-bc', totalBc - prevLevelColBc);
  document.getElementById('totalBc').innerHTML = getMassagedLabel(localizedMessages.badgeGallery.count.replace('{COUNT}', totalBc), true);

  for (let r = 1; r <= maxBadgeSlotRows; r++) {
    for (let c = 1; c <= maxBadgeSlotCols; c++) {
      const badgeId = r <= badgeSlotCache.length && c <= badgeSlotCache[r - 1].length ? badgeSlotCache[r - 1][c - 1] : null;
      const badgeSlotButton = document.querySelector(`.badgeSlotButton[data-row='${r}'][data-col='${c}']`);
      if (badgeSlotButton) {
        let badge = badgeId && badgeId !== 'null' ? badgeCache.find(b => b.badgeId === badgeId) : null;
        if (!badge)
          badge = { badgeId: 'null' };
        badgeSlotButton.classList.toggle('hidden', r > badgeSlotRows || c > badgeSlotCols);
        badgeSlotButton.innerHTML = getBadgeItem(badge).innerHTML;
        if (gameId === '2kki' && badge?.overlayType & BadgeOverlayType.LOCATION)
          handle2kkiBadgeOverlayLocationColorOverride(badgeSlotButton.querySelector('.badgeOverlay'), badgeSlotButton.querySelector('.badgeOverlay2'), cachedLocations);
      }
    }
  }
}

function updateBadgeButton() {
  const badgeId = playerData?.badge || 'null';
  const badge = playerData?.badge ? badgeCache.find(b => b.badgeId === badgeId) : null;
  const badgeButton = document.getElementById('badgeButton');
  badgeButton.innerHTML = getBadgeItem(badge || { badgeId: 'null' }, false, true).innerHTML;
  if (gameId === '2kki' && badge?.overlayType & BadgeOverlayType.LOCATION)
    handle2kkiBadgeOverlayLocationColorOverride(badgeButton.querySelector('.badgeOverlay'), badgeButton.querySelector('.badgeOverlay2'), cachedLocations);
}

function getBadgeUrl(badge, staticOnly) {
  let badgeId;
  if (typeof badge === 'string') {
    badgeId = badge;
    badge = badgeId ? badgeCache.find(b => b.badgeId === badgeId) : null;
  } else
    badgeId = badge.badgeId;
  return badgeId ? `images/badge/${badgeId}${!staticOnly && badge?.animated ? '.gif' : '.png'}` : '';
}

function getBadgeItem(badge, includeTooltip, emptyIcon, lockedIcon, scaled, filterable) {
  const badgeId = badge.badgeId;

  const item = document.createElement('div');
  item.classList.add('badgeItem');
  item.classList.add('item');
  item.classList.add('unselectable');

  let filterItem;
  if (filterable && badgeId !== 'null') {
    filterItem = {
      el: item,
      title: '',
      game: badge.game,
      group: badge.group
    };
    badgeFilterCache.push(filterItem);
  }

  const badgeContainer = document.createElement('div');
  badgeContainer.classList.add('badgeContainer');
  if (badge.hidden && badge.unlocked)
    badgeContainer.classList.add('special');
  
  const badgeEl = (badge.unlocked || !badge.secret) && badgeId !== 'null' ? document.createElement('div') : null;
  const badgeUrl = badgeEl ? getBadgeUrl(badge, !badge.unlocked) : null;

  if (badgeEl) {
    badgeEl.classList.add('badge');
    if (scaled)
      badgeEl.classList.add('scaledBadge');
    badgeEl.style.backgroundImage = `url('${badgeUrl}')`;

    if (badge.overlayType) {
      badgeEl.classList.add('overlayBadge');

      const badgeOverlay = document.createElement('div');
      badgeOverlay.classList.add('badgeOverlay');
      if (badge.overlayType & BadgeOverlayType.MULTIPLY)
        badgeOverlay.classList.add('badgeOverlayMultiply');
      
      badgeEl.appendChild(badgeOverlay);

      const badgeMaskValue = badge.overlayType & BadgeOverlayType.MASK
        ? `url('${badgeUrl.replace('.', badge.overlayType & BadgeOverlayType.DUAL ? '_mask_fg.' : '_mask.')}')`
        : badgeEl.style.backgroundImage;

      badgeOverlay.setAttribute('style', `-webkit-mask-image: ${badgeMaskValue}; mask-image: ${badgeMaskValue};`);

      if (badge.overlayType & BadgeOverlayType.DUAL) {
        const badgeMask2Value = badge.overlayType & BadgeOverlayType.MASK
          ? `url(${badgeUrl.replace('.', '_mask_bg.')})`
          : badgeEl.style.backgroundImage;

        badgeOverlay.classList.add('badgeOverlayBase');

        const badgeOverlay2 = document.createElement('div');
        badgeOverlay2.classList.add('badgeOverlay');
        badgeOverlay2.classList.add('badgeOverlay2');
        if (badge.overlayType & BadgeOverlayType.MULTIPLY)
          badgeOverlay2.classList.add('badgeOverlayMultiply');
        badgeOverlay2.classList.add(getStylePropertyValue('--base-color') !== getStylePropertyValue('--alt-color') ? 'badgeOverlayAlt' : 'badgeOverlayBg');

        badgeEl.appendChild(badgeOverlay2);

        badgeOverlay2.setAttribute('style', `-webkit-mask-image: ${badgeMask2Value}; mask-image: ${badgeMask2Value};`);
      }
    }

    badgeContainer.appendChild(badgeEl);
    if (!badge.unlocked) {
      item.classList.add('locked');
      item.classList.add('disabled');
      if (lockedIcon)
        badgeContainer.appendChild(getSvgIcon('locked', true));
    }
  } else if (badgeId !== 'null') {
    item.classList.add('locked');
    item.classList.add('disabled');
    if (lockedIcon)
      badgeContainer.appendChild(getSvgIcon('locked', true));
    badgeContainer.appendChild(document.createElement('div'));
  } else
    badgeContainer.appendChild(emptyIcon ? getSvgIcon('ban', true) : document.createElement('div'));

  if (includeTooltip) {
    let tooltipContent = '';

    if (badgeId === 'null')
      tooltipContent = `<label>${localizedMessages.badges.null}</label>`;
    else {
      if (localizedBadges.hasOwnProperty(badge.game) && localizedBadges[badge.game].hasOwnProperty(badgeId)) {
        let badgeTitle = localizedMessages.badges.locked;
        const localizedTooltip = localizedBadges[badge.game][badgeId];
        if ((badge.unlocked || !badge.secret) && localizedTooltip.name)
          badgeTitle = getMassagedLabel(localizedTooltip.name);
        if (filterItem)
          filterItem.title = badgeTitle.toLowerCase();
        if (badge.bp)
          badgeTitle = getMassagedLabel(localizedMessages.badges.badgeTitle).replace('{TITLE}', badgeTitle).replace('{BP}', badge.bp);
        tooltipContent += `<h3 class="tooltipTitle${badge.hidden ? ' altText' : ''}">${badgeTitle}</h3>`;
        if ((badge.unlocked || !badge.secret) && localizedTooltip.description)
          tooltipContent += `<div class="tooltipContent">${getMassagedLabel(localizedTooltip.description)}</div>`;
        tooltipContent += '<div class="tooltipSpacer"></div>';
        if (badge.mapId)
          tooltipContent += `<span class="tooltipLocation"><label>${getMassagedLabel(localizedMessages.badges.location)}</label><span class="tooltipLocationText">{LOCATION}</span></span>`;
        if ((badge.unlocked || !badge.secret) && localizedTooltip.condition) {
          if (badge.unlocked || !badge.secretCondition) {
            let condition = getMassagedLabel(localizedTooltip.condition);
            if (badge.seconds) {
              const minutes = Math.floor(badge.seconds / 60);
              const seconds = badge.seconds - minutes * 60;
              condition = condition.replace('{TIME}', localizedMessages.badges.time.replace('{MINUTES}', minutes.toString().padStart(2, '0')).replace('{SECONDS}', seconds.toString().padStart(2, '0')));
            }
            tooltipContent += `<div class="tooltipContent">${condition}</div>`;
          } else
            tooltipContent += `<h3 class="tooltipTitle">${localizedMessages.badges.locked}</h3>`;
        }
      } else {
        tooltipContent += `<h3 class="tooltipTitle">${localizedMessages.badges.locked}</h3>`;
        if (filterItem)
          filterItem.title = localizedMessages.badges.locked;
      }
        
      tooltipContent += '<label class="tooltipFooter">';
      if (!badge.secret && !badge.secretCondition && badge.goalsTotal > 1)
        tooltipContent += `${getMassagedLabel(localizedMessages.badges.goalProgress).replace('{CURRENT}', badge.goals).replace('{TOTAL}', badge.goalsTotal)}<br>`;

      const percentMultiplier = badge.percent < 1 ? 100 : 10;
      tooltipContent += `${getMassagedLabel(localizedMessages.badges.percentUnlocked).replace('{PERCENT}', Math.floor(badge.percent * percentMultiplier) / percentMultiplier)}`;

      if ((badge.unlocked || !badge.secret) && badge.art)
        tooltipContent += `<small class="tooltipCornerText">${getMassagedLabel(localizedMessages.badges.artCredit).replace('{ARTIST}', badge.art)}</small>`

      tooltipContent += '</label>';
        
      if (tooltipContent) {
        const baseTooltipContent = tooltipContent;
        const tooltipOptions = {};

        const assignTooltip = instance => addOrUpdateTooltip(item, tooltipContent, false, false, !!badge.mapId, tooltipOptions, instance);

        if (badge.mapId) {
          const mapId = badge.mapId.toString().padStart(4, '0');
          const setTooltipLocation = instance => {
            if (gameLocalizedMapLocations[badge.game] && gameLocalizedMapLocations[badge.game].hasOwnProperty(mapId))
              tooltipContent = baseTooltipContent.replace('{LOCATION}', getLocalizedMapLocationsHtml(badge.game, mapId, '0000', badge.mapX, badge.mapY, getInfoLabel('&nbsp;|&nbsp;')));
            else if (gameId === '2kki') {
              tooltipContent = baseTooltipContent.replace('{LOCATION}', getInfoLabel(getMassagedLabel(localizedMessages.location.queryingLocation)));
              tooltipOptions.onShow = instance => getOrQuery2kkiLocationsHtml(mapId, locationsHtml => instance.setContent(baseTooltipContent.replace('{LOCATION}', locationsHtml)));
            } else
              tooltipContent = baseTooltipContent.replace('{LOCATION}', getInfoLabel(getMassagedLabel(localizedMessages.location.unknownLocation)));
            assignTooltip(instance);
          };
          if (gameLocalizedMapLocations.hasOwnProperty(badge.game))
            setTooltipLocation();
          else {
            tooltipContent = baseTooltipContent.replace('{LOCATION}', getInfoLabel(getMassagedLabel(localizedMessages.location.queryingLocation)));
            tooltipOptions.onShow = instance => {
              if (gameLocalizedMapLocations.hasOwnProperty(badge.game))
                setTooltipLocation(instance);
              else
                initLocations(globalConfig.lang, badge.game, () => setTooltipLocation(instance));
            };
            assignTooltip();
          }
        } else
          assignTooltip();
      }
    }
  }

  item.appendChild(badgeContainer);

  return item;
}

function fetchPlayerBadges(callback) {
  apiFetch('badge?command=list')
    .then(response => {
      if (!response.ok)
        throw new Error(response.statusText);
      return response.json();
    })
    .then(badges => {
      const newUnlockedBadges = badges.filter(b => b.newUnlock);

      badges = badges.map(badge => {
        delete badge.newUnlock;
        return badge;
      });

      for (let b = 0; b < newUnlockedBadges.length; b++)
        showBadgeToastMessage('badgeUnlocked', 'info', newUnlockedBadges[b]);
      
      if (callback)
        callback(badges);
    })
    .catch(err => console.error(err));
}

function updateBadges(callback) {
  apiFetch('badge?command=list&simple=true')
    .then(response => {
      if (!response.ok)
        throw new Error(response.statusText);
      return response.json();
    })
    .then(badges => {
      const newUnlockedBadges = badges.filter(b => b.newUnlock);
      
      badgeCache = badges.map(badge => {
        delete badge.newUnlock;
        return badge;
      });
    
      for (let b = 0; b < newUnlockedBadges.length; b++)
        showBadgeToastMessage('badgeUnlocked', 'info', newUnlockedBadges[b]);

      if (badgeCacheUpdateTimer)
        clearInterval(badgeCacheUpdateTimer);
      badgeCacheUpdateTimer = setInterval(updateBadges, 900000);
      
      if (callback)
        callback();
    })
    .catch(err => console.error(err));
}

function updateBadgeSlots(callback) {
  apiFetch('badge?command=slotList')
    .then(response => {
      if (!response.ok)
        throw new Error(response.statusText);
      return response.json();
    })
    .then(badgeSlots => {
      badgeSlotCache = badgeSlots || [];
      if (callback)
        callback();
  })
  .catch(err => console.error(err));
}

function updatePlayerBadge(badgeId, callback) {
  apiFetch(`badge?command=set&id=${badgeId}`)
    .then(response => {
      if (!response.ok)
        throw new Error(response.statusText);
      syncPlayerData(playerUuids[-1], playerData?.rank, playerData?.account, badgeId, -1);
      if (callback)
        callback();
    })
    .catch(err => console.error(err));
}

function updatePlayerBadgeSlot(badgeId, slotRow, slotCol, callback) {
  apiFetch(`badge?command=slotSet&id=${badgeId}&row=${slotRow}&col=${slotCol}`)
    .then(response => {
      if (!response.ok)
        throw new Error(response.statusText);
      if (callback)
        callback();
    })
    .catch(err => console.error(err));
}

function checkNewBadgeUnlocks() {
  apiFetch('badge?command=new')
    .then(response => {
      if (!response.ok)
        throw new Error(response.statusText);
      return response.json();
    })
    .then(unlockedBadgeIds => {
      if (unlockedBadgeIds) {
        for (let b = 0; b < unlockedBadgeIds.length; b++)
          showBadgeToastMessage('badgeUnlocked', 'info', unlockedBadgeIds[b]);
      }
    })
    .catch(err => console.error(err));
}

function updateLocalizedBadgeGroups(callback) {
  fetch(`lang/badge/groups/${globalConfig.lang}.json`)
    .then(response => response.json())
    .then(function (jsonResponse) {
      localizedBadgeGroups = jsonResponse;
      if (callback)
        callback(true);
    })
    .catch(err => console.error(err));
}

function updateLocalizedBadges(callback) {
  if (localizedBadgesIgnoreUpdateTimer)
    clearInterval(localizedBadgesIgnoreUpdateTimer);
    
  fetchNewest(`lang/badge/${globalConfig.lang}.json`)
    .then(response => response.json())
    .then(function (jsonResponse) {
      localizedBadges = jsonResponse;
      localizedBadgesIgnoreUpdateTimer = setTimeout(() => localizedBadgesIgnoreUpdateTimer = null, 300000);
      if (callback)
        callback(true);
    })
    .catch(err => console.error(err));
}

function addOrUpdatePlayerBadgeGalleryTooltip(badgeElement, name, sysName, mapId, prevMapId, prevLocationsStr) {
  badgeElement.dataset.playerName = name;
  badgeElement.dataset.systemName = sysName;

  if (!badgeElement._badgeGalleryTippy) {
    badgeElement._badgeGalleryTippy = tippy(badgeElement, Object.assign({
      trigger: 'click',
      interactive: true,
      content: `<div class="tooltipContent">${getMassagedLabel(localizedMessages.badgeGallery.loading, true)}</div>`,
      appendTo: document.getElementById('layout'),
      onShow: instance => {
        const playerName = instance.reference.dataset.playerName;
        const systemName = instance.reference.dataset.systemName;

        apiFetch(`badge?command=playerSlotList&player=${playerName}`)
          .then(response => {
            if (!response.ok)
              throw new Error(response.statusText);
            return response.json();
          })
          .then(badgeSlots => {
            if (!badgeSlots || !badgeSlots.flat().filter(b => b !== 'null').length) {
              instance.hide();
              return;
            }

            const tooltipContent = document.createElement('div');
            tooltipContent.classList.add('tooltipContent');
            tooltipContent.classList.add('noShadow');
    
            const tooltipTitle = document.createElement('h4');
            tooltipTitle.classList.add('tooltipTitle');
            tooltipTitle.innerHTML = getMassagedLabel(localizedMessages.badgeGallery.label, true).replace('{PLAYER}', playerName);

            const badgeSlotRowsContainer = document.createElement('div');
            badgeSlotRowsContainer.classList.add('badgeSlotRowsContainer');
    
            badgeSlots.forEach((badgeRowSlots, r) => {
              const badgeSlotRow = document.createElement('div');
              badgeSlotRow.classList.add('badgeSlotRow');

              badgeRowSlots.forEach((badgeId, c) => {
                const badgeSlot = document.createElement('div');
                badgeSlot.classList.add('badgeSlot');
                badgeSlot.classList.add('badge');
                badgeSlot.dataset.rowIndex = r;
                badgeSlot.dataset.colIndex = c;
      
                if (badgeId !== 'null') {
                  const badgeUrl = getBadgeUrl(badgeId);
        
                  badgeSlot.style.backgroundImage = `url('${badgeUrl}')`;

                  const badge = badgeCache.find(b => b.badgeId === badgeId);

                  if (badge?.overlayType) {
                    const badgeSlotOverlay = document.createElement('div');

                    badgeSlotOverlay.classList.add('badgeSlotOverlay');
                    badgeSlotOverlay.classList.add('badgeOverlay');
                    if (badge.overlayType & BadgeOverlayType.MULTIPLY)
                      badgeSlotOverlay.classList.add('badgeOverlayMultiply');
                    badgeSlotOverlay.dataset.overlayType = badge.overlayType;

                    badgeSlot.appendChild(badgeSlotOverlay);

                    const badgeMaskUrl = badge.overlayType & BadgeOverlayType.MASK
                      ? badgeUrl.replace('.', badge.overlayType & BadgeOverlayType.DUAL ? '_mask_fg.' : '_mask.')
                      : badgeUrl;

                    badgeSlotOverlay.setAttribute('style', `-webkit-mask-image: url('${badgeMaskUrl}'); mask-image: url('${badgeMaskUrl}');`);

                    if (badge.overlayType & BadgeOverlayType.DUAL) {
                      const badgeSlotOverlay2 = document.createElement('div');

                      badgeSlotOverlay2.classList.add('badgeOverlay');
                      badgeSlotOverlay2.classList.add('badgeOverlay2');
                      if (badge.overlayType & BadgeOverlayType.MULTIPLY)
                        badgeSlotOverlay2.classList.add('badgeOverlayMultiply');
            
                      badgeSlot.appendChild(badgeSlotOverlay2);

                      const badgeMask2Url = badge.overlayType & BadgeOverlayType.MASK
                        ? badgeUrl.replace('.', '_mask_bg.')
                        : badgeUrl;

                      badgeSlotOverlay2.setAttribute('style', `-webkit-mask-image: url('${badgeMask2Url}'); mask-image: url('${badgeMask2Url}');`);
                    }
                  }
                }

                badgeSlotRow.appendChild(badgeSlot);
              });

              badgeSlotRowsContainer.appendChild(badgeSlotRow);
            });

            const tippyBox = instance.popper.children[0];

            let boxStyles;
            let textStyles;

            const parsedSystemName = systemName ? (gameUiThemes.indexOf(systemName) > -1 ? systemName : getDefaultUiTheme()).replace(' ', '_') : null;

            if (parsedSystemName) {
              boxStyles = `background-image: var(--container-bg-image-url-${parsedSystemName}) !important; border-image: var(--border-image-url-${parsedSystemName}) 8 repeat !important; border-image-width: 2 !important;`;
              textStyles = `color: var(--base-color-${parsedSystemName}); background-image: var(--base-gradient-${parsedSystemName}) !important; filter: drop-shadow(1.5px 1.5px var(--shadow-color-${parsedSystemName}));`;
              tippyBox.setAttribute('style', boxStyles);
              tooltipTitle.setAttribute('style', textStyles);
            }
    
            tooltipContent.appendChild(tooltipTitle);
            tooltipContent.appendChild(badgeSlotRowsContainer);
    
            instance.setContent(tooltipContent.outerHTML);

            if (parsedSystemName) {
              const badgeSlotOverlays = tippyBox.querySelectorAll('.badgeSlotOverlay');
              for (let badgeSlotOverlay of badgeSlotOverlays) {
                const overlayType = parseInt(badgeSlotOverlay.dataset.overlayType);
                badgeSlotOverlay.style.background = `var(--base-${overlayType & BadgeOverlayType.GRADIENT ? 'gradient' : 'color'}-${parsedSystemName})`;

                const badgeSlotOverlay2 = overlayType & BadgeOverlayType.DUAL ? badgeSlotOverlay.parentElement.querySelector('.badgeOverlay2') : null;
               
                if (badgeSlotOverlay2)
                  badgeSlotOverlay2.style.background = getStylePropertyValue(`--base-color-${parsedSystemName}`) !== getStylePropertyValue(`--alt-color-${parsedSystemName}`)
                    ? `var(--alt-${overlayType & BadgeOverlayType.GRADIENT ? 'gradient' : 'color'}-${parsedSystemName})`
                    : `var(--base-bg-color-${parsedSystemName})`;

                if (gameId === '2kki' && overlayType & BadgeOverlayType.LOCATION)
                  handle2kkiBadgeOverlayLocationColorOverride(badgeSlotOverlay, badgeSlotOverlay2, null, playerName, mapId, prevMapId, prevLocationsStr);
              }
            }

            if (localizedBadges) {
              const badges = instance.popper.querySelectorAll('.badge');
              for (let badge of badges) {
                const badgeId = badgeSlots[badge.dataset.rowIndex][badge.dataset.colIndex];
                if (badgeId === 'null')
                  continue;
                const badgeGame = Object.keys(localizedBadges).find(game => {
                  return Object.keys(localizedBadges[game]).find(b => b === badgeId);
                });
                if (badgeGame) {
                  const badgeTippy = addTooltip(badge, getMassagedLabel(localizedBadges[badgeGame][badgeId].name, true), true, false, true);
                  if (systemName) {
                    badgeTippy.popper.children[0].setAttribute('style', boxStyles);
                    const badgeTextStyles = badgeCache.find(b => b.badgeId === badgeId)?.hidden
                      ? textStyles.replace(/--base-/g, '--alt-')
                      : textStyles;
                    badgeTippy.popper.querySelector('.tooltipContent').setAttribute('style', badgeTextStyles);
                  }
                }
              }
            }
          })
          .catch(err => {
            console.error(err);
            instance.setContent('');
          });
      }
    }, tippyConfig));
  }

  return badgeElement._badgeGalleryTippy;
}

// EXTERNAL
function onBadgeUpdateRequested() {
  if (loginToken)
    checkNewBadgeUnlocks();
}

function showBadgeToastMessage(key, icon, badgeId) {
  if (!notificationConfig.badges.all || (notificationConfig.badges.hasOwnProperty(key) && !notificationConfig.badges[key]))
    return;
  const message = getMassagedLabel(localizedMessages.toast.badges[key], true);
  const toast = showToastMessage(message, icon, true, null, !!badgeId);

  if (badgeId) {
    const badgeObj = badgeCache.find(b => b.badgeId === badgeId);

    if (badgeObj) {
      const badge = getBadgeItem(badgeObj).querySelector('.badgeContainer');

      toast.querySelector('.icon').remove();
      toast.prepend(badge);

      addTooltip(badge, localizedBadges[badgeObj.game][badgeId].name, true, true);
    }
  }
}