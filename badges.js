const badgeSlotsPerRow = 5;
const maxBadgeSlotRows = 4;
let badgeSlotRows = 1;

let badgeCache;
let badgeSlotCache;
let badgeCacheUpdateTimer = null;

let localizedBadgeGroups;
let localizedBadges;
let localizedBadgesIgnoreUpdateTimer = null;

function initBadgeControls() {
  const onClickBadgeButton = (prevModal, slotId) => {
    if (slotId && (slotId > badgeSlotCache.length + 1 || Math.ceil(slotId / badgeSlotsPerRow) > badgeSlotRows))
      return;

    const badgeModalContent = document.querySelector('#badgesModal .modalContent');
    badgeModalContent.innerHTML = '';

    const updateBadgesAndOpenModal = () => {
      fetchPlayerBadges(playerBadges => {
        let lastGame = null;
        let lastGroup = null;
        const badgeCompareFunc = (a, b) => {
          if (a.game !== b.game) {
            if (a.game === gameId)
              return -1;
            if (b.game === gameId)
              return 1;
            return gameIds.indexOf(a.game) < gameIds.indexOf(b.game) ? -1 : 1;
          }
          return 0;
        };
        const badges = [{ badgeId: 'null', game: null}].concat(playerBadges.sort(badgeCompareFunc));
        for (let badge of badges) {
          if (badge.game !== lastGame) {
            const gameHeader = document.createElement('h2');
            gameHeader.classList.add('itemCategoryHeader');
            gameHeader.innerHTML = getMassagedLabel(localizedMessages.games[badge.game]);
            badgeModalContent.appendChild(gameHeader);
            lastGame = badge.game;
            lastGroup = null;
          }
          if (badge.group != lastGroup && localizedBadgeGroups.hasOwnProperty(lastGame) && localizedBadgeGroups[lastGame].hasOwnProperty(badge.group)) {
            const groupHeader = document.createElement('h3');
            groupHeader.classList.add('itemCategoryHeader');
            groupHeader.innerHTML = getMassagedLabel(localizedBadgeGroups[lastGame][badge.group]);
            badgeModalContent.appendChild(groupHeader);
            lastGroup = badge.group;
          }
          const item = getBadgeItem(badge, true, true, true);
          if (badge.badgeId === (playerData?.badge || 'null'))
            item.children[0].classList.add('selected');
          if (!item.classList.contains('disabled')) {
            item.onclick = slotId 
              ? () => updatePlayerBadgeSlot(badge.badgeId, slotId, () => {
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

        openModal('badgesModal', null, prevModal || null);
      });
    };
    if (!badgeCache.filter(b => !localizedBadges.hasOwnProperty(b.game) || !localizedBadges[b.game].hasOwnProperty(b.badgeId)).length || localizedBadgesIgnoreUpdateTimer)
      updateBadgesAndOpenModal();
    else
      updateLocalizedBadges(updateBadgesAndOpenModal);
  };

  document.getElementById('badgeButton').onclick = () => onClickBadgeButton();
  document.getElementById('accountBadgeButton').onclick = () => onClickBadgeButton('accountSettingsModal');

  document.getElementById('badgeGalleryButton').onclick = () => {
    updateBadgeSlots(() => {
      initBadgeGalleryModal();
      openModal('badgeGalleryModal', null, 'accountSettingsModal');
    });
  };

  const badgeGalleryModalContent = document.querySelector('#badgeGalleryModal .modalContent');

  for (let s = 1; s <= maxBadgeSlotRows * badgeSlotsPerRow; s++) {
    const badgeSlotButton = document.createElement('div');
    badgeSlotButton.classList.add('badgeSlotButton');
    badgeSlotButton.classList.add('badgeItem');
    badgeSlotButton.classList.add('item');
    badgeSlotButton.classList.add('unselectable');
    badgeSlotButton.dataset.slotId = s;
    badgeSlotButton.onclick = () => onClickBadgeButton('badgeGalleryModal', s);
    badgeGalleryModalContent.appendChild(badgeSlotButton);
  }
}

function initBadgeGalleryModal() {
  for (let s = 1; s <= maxBadgeSlotRows * badgeSlotsPerRow; s++) {
    const rowIndex = Math.ceil(s / badgeSlotsPerRow);
    const badgeId = s <= badgeSlotCache.length ? badgeSlotCache[s - 1] : null;
    const badgeSlotButton = document.querySelector(`.badgeSlotButton[data-slot-id='${s}']`);
    if (badgeSlotButton) {
      let badge = badgeId ? badgeCache.find(b => b.badgeId === badgeId) : null;
      if (!badge)
        badge = { badgeId: 'null' };
      badgeSlotButton.classList.toggle('disabled', s > badgeSlotCache.length + 1);
      badgeSlotButton.classList.toggle('hidden', rowIndex > badgeSlotRows);
      badgeSlotButton.innerHTML = getBadgeItem(badge).innerHTML;
    }
  }
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

function getBadgeItem(badge, includeTooltip, emptyIcon, scaled) {
  const badgeId = badge.badgeId;

  const item = document.createElement('div');
  item.classList.add('badgeItem');
  item.classList.add('item');
  item.classList.add('unselectable');

  const badgeContainer = document.createElement('div');
  badgeContainer.classList.add('badgeContainer');
  if (badge.hidden && badge.unlocked)
    badgeContainer.classList.add('special');
  
  const badgeEl = (badge.unlocked || !badge.secret) && badgeId !== 'null' ? document.createElement('div') : null;

  if (badgeEl) {
    badgeEl.classList.add('badge');
    if (scaled)
      badgeEl.classList.add('scaledBadge');
    badgeEl.style.backgroundImage = `url('${getBadgeUrl(badge, !badge.unlocked)}')`;
  } else {
    if (badgeId !== 'null') {
      item.classList.add('locked');
      item.classList.add('disabled');
      badgeContainer.appendChild(getSvgIcon('locked', true));
      badgeContainer.appendChild(document.createElement('div'));
    } else
      badgeContainer.appendChild(emptyIcon ? getSvgIcon('ban', true) : document.createElement('div'));
  }

  if (badgeEl) {
    if (badge.overlay) {
      badgeEl.classList.add('overlayBadge');

      const badgeOverlay = document.createElement('div');
      badgeOverlay.classList.add('badgeOverlay');
      badgeOverlay.setAttribute('style', `-webkit-mask-image: ${badgeEl.style.backgroundImage}; mask-image: ${badgeEl.style.backgroundImage};`);
      badgeEl.appendChild(badgeOverlay);
    }

    badgeContainer.appendChild(badgeEl);
    if (!badge.unlocked) {
      item.classList.add('locked');
      item.classList.add('disabled');
      badgeContainer.appendChild(getSvgIcon('locked', true));
    }
  }

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
      } else
        tooltipContent += `<h3 class="tooltipTitle">${localizedMessages.badges.locked}</h3>`;
        
      tooltipContent += '<label class="tooltipFooter">';
      if (!badge.unlocked && badge.goalsTotal > 0)
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
              tooltipContent = baseTooltipContent.replace('{LOCATION}', getLocalizedMapLocationsHtml(badge.game, mapId, '0000', badge.mapX, badge.mapY, getInfoLabel("&nbsp;|&nbsp;")));
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
        showBadgeToastMessage('badgeUnlocked', 'info');
      
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
        showBadgeToastMessage('badgeUnlocked', 'info');

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
      syncPlayerData(playerUuids[-1], playerData?.rank, playerData?.account, badgeSlotCache.length ? badgeSlotCache[0] : 'null', -1);
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

function updatePlayerBadgeSlot(badgeId, slotId, callback) {
  apiFetch(`badge?command=slotSet&id=${badgeId}&slot=${slotId}`)
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
          showBadgeToastMessage('badgeUnlocked', 'info');
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

function addOrUpdatePlayerBadgeGalleryTooltip(badgeElement, name, sysName) {
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
            if (!badgeSlots)
              badgeSlots = [];

            const tooltipContent = document.createElement('div');
            tooltipContent.classList.add('tooltipContent');
    
            const tooltipTitle = document.createElement('h4');
            tooltipTitle.classList.add('tooltipTitle');
            tooltipTitle.innerHTML = getMassagedLabel(localizedMessages.badgeGallery.label, true).replace('{PLAYER}', playerName);
    
            const badgeSlotsContainer = document.createElement('div');
            badgeSlotsContainer.classList.add('badgeSlotsContainer');
    
            for (badgeId of badgeSlots) {
              const badgeSlot = document.createElement('div');
              badgeSlot.classList.add('badgeSlot');
              badgeSlot.classList.add('badge');
    
              const badgeUrl = getBadgeUrl(badgeId);
    
              badgeSlot.style.backgroundImage = `url('${badgeUrl}')`;

              const badgeSlotOverlay = badgeCache.find(b => b.badgeId === badgeId)?.overlay ? document.createElement('div') : null;
    
              if (badgeSlotOverlay) {
                badgeSlotOverlay.classList.add('badgeSlotOverlay');
                badgeSlotOverlay.classList.add('badgeOverlay');
                badgeSlotOverlay.setAttribute('style', `-webkit-mask-image: url('${badgeUrl}'); mask-image: url('${badgeUrl}');`);
    
                badgeSlot.appendChild(badgeSlotOverlay);
              }
    
              badgeSlotsContainer.appendChild(badgeSlot);
            }

            const tippyBox = instance.popper.children[0];

            let boxStyles;
            let textStyles;
    
            if (systemName) {
              const parsedSystemName = (gameUiThemes.indexOf(systemName) > -1 ? systemName : getDefaultUiTheme()).replace(' ', '_');
              boxStyles = `background-image: var(--container-bg-image-url-${parsedSystemName}) !important; border-image: var(--border-image-url-${parsedSystemName}) 8 repeat !important; border-image-width: 2 !important;`;
              textStyles = `color: var(--base-color-${parsedSystemName}); background-image: var(--base-gradient-${parsedSystemName}) !important; filter: drop-shadow(1.5px 1.5px var(--shadow-color-${parsedSystemName}));`;
              tippyBox.setAttribute('style', boxStyles);
              tooltipTitle.setAttribute('style', textStyles);
              const badgeSlotOverlays = badgeSlotsContainer.querySelectorAll('.badgeSlotOverlay');
              for (let badgeSlotOverlay of badgeSlotOverlays)
                badgeSlotOverlay.style.backgroundImage = `var(--base-gradient-${parsedSystemName})`;
            }
    
            tooltipContent.appendChild(tooltipTitle);
            tooltipContent.appendChild(badgeSlotsContainer);
    
            instance.setContent(tooltipContent.outerHTML);

            if (localizedBadges) {
              const badges = instance.popper.querySelectorAll('.badge');
              for (let b = 0; b < badgeSlots.length; b++) {
                const badgeId = badgeSlots[b];
                const badgeGame = Object.keys(localizedBadges).find(game => {
                  return Object.keys(localizedBadges[game]).find(b => b === badgeId);
                });
                if (badgeGame) {
                  const badgeTippy = addTooltip(badges[b], getMassagedLabel(localizedBadges[badgeGame][badgeId].name, true), true, false, true);
                  if (systemName) {
                    badgeTippy.popper.children[0].setAttribute('style', boxStyles);
                    const badgeTextStyles = badgeCache.find(b => b.badgeId === badgeId)?.hidden
                      ? textStyles.replace(/\-\-base\-/g, '--alt-')
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
  if (sessionId)
    checkNewBadgeUnlocks();
}

function showBadgeToastMessage(key, icon) {
  if (!notificationConfig.badges.all || (notificationConfig.badges.hasOwnProperty(key) && !notificationConfig.badges[key]))
    return;
  const message = getMassagedLabel(localizedMessages.toast.badges[key], true);
  showToastMessage(message, icon, true);
}