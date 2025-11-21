const roleEmojis = {
  mod: '🛡️',
  dev: '🔧',
  partyOwner: '👑',
  muted: '🔇'
};
const defaultUuid = '0000000000000000';
const medalTypes = [ 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond' ];
let playerData = null;
let playerUuids = {};
let globalPlayerData = {};
let blockedPlayerUuids = [];
let spriteCache = {};
let faviconCache = {};
let playerSpriteCache = {};

function getPlayerName(player, includeMarkers, includeBadge, asHtml) {
  const isPlayerObj = typeof player === 'object';
  let playerName = isPlayerObj ? player.name : player;
  const unnamed = !playerName;
  if (unnamed)
    playerName = localizedMessages.playerList.unnamed;

  if (asHtml && isPlayerObj) {
    const nameTextContainer = document.createElement('div');
    nameTextContainer.classList.add('nameTextContainer');

    if (!player.account) {
      const nameBeginMarker = document.createElement('span');
      nameBeginMarker.classList.add('nameMarker');
      nameBeginMarker.textContent = '<';
      nameTextContainer.appendChild(nameBeginMarker);
    }

    const nameText = document.createElement('span');
    nameText.classList.add('nameText');
    nameText.innerText = playerName;

    nameTextContainer.appendChild(nameText);

    if (!player.account) {
      const nameEndMarker = document.createElement('span');
      nameEndMarker.classList.add('nameMarker');
      nameEndMarker.textContent = '>';
      nameTextContainer.appendChild(nameEndMarker);
    }

    let rankIcon = null;
    let friendIcon = null;
    let mutedIcon = null;

    if (player.rank) {
      const rank = Math.min(player.rank, 2);
      rankIcon = getSvgIcon(rank === 1 ? 'mod' : 'dev', true);
      rankIcon.classList.add('rankIcon');
      addTooltip(rankIcon, getMassagedLabel(localizedMessages.roles[rank === 1 ? 'mod' : 'dev'], true), true, true);
      nameTextContainer.appendChild(rankIcon);
    }

    if (playerFriendsCache.find(pf => pf.accepted && (isPlayerObj ? pf.uuid === player.uuid : pf.name === playerName))) {
      friendIcon = getSvgIcon('friend', true);
      friendIcon.classList.add('friendIcon');
      addTooltip(friendIcon, document.createTextNode(getMassagedLabel(localizedMessages.friends.friend)), true, true);
      nameTextContainer.appendChild(friendIcon);
    }

    if (player.muted) {
      mutedIcon = getSvgIcon('muted', true);
      mutedIcon.classList.add('muted');
      addTooltip(mutedIcon, getMassagedLabel(localizedMessages.playerList.muted, true), true, true);
      nameTextContainer.appendChild(mutedIcon);
    }

    const badge = includeBadge && player.badge !== 'null' ? findBadge(player.badge) : null;
    let badgeEl = null;
    let badgeOverlayEl = null;
    let badgeOverlay2El = null;

    if (badge) {
      badgeEl = document.createElement('div');
      badgeEl.classList.add('badge', 'nameBadge');

      badgeOverlayEl = badge?.overlayType ? document.createElement('div') : null;
      badgeOverlay2El = badge?.overlayType & BadgeOverlayType.DUAL ? document.createElement('div') : null;

      const badgeUrl = getBadgeUrl(badge || player.badge, true);
      badgeEl.style.backgroundImage = `url('${badgeUrl}')`;

      if (badgeOverlayEl) {
        badgeEl.classList.add('overlayBadge');

        badgeOverlayEl.classList.add('badgeOverlay');
        if (badge.overlayType & BadgeOverlayType.MULTIPLY)
          badgeOverlayEl.classList.add('badgeOverlayMultiply');
        
        badgeEl.appendChild(badgeOverlayEl);

        const badgeMaskUrl = badge.overlayType & BadgeOverlayType.MASK
          ? badgeUrl.replace('.', badge.overlayType & BadgeOverlayType.DUAL ? '_mask_fg.' : '_mask.')
          : badgeUrl;

        badgeOverlayEl.setAttribute('style', `-webkit-mask-image: url('${badgeMaskUrl}'); mask-image: url('${badgeMaskUrl}');`);
        
        if (badgeOverlay2El) {
          const badgeMask2Url = badge.overlayType & BadgeOverlayType.MASK
            ? badgeUrl.replace('.', '_mask_bg.')
            : badgeUrl;

          badgeOverlay2El.classList.add('badgeOverlay', 'badgeOverlay2');
          if (badge.overlayType & BadgeOverlayType.MULTIPLY)
            badgeOverlay2El.classList.add('badgeOverlayMultiply');

          badgeEl.appendChild(badgeOverlay2El);

          badgeOverlay2El.setAttribute('style', `-webkit-mask-image: url('${badgeMask2Url}'); mask-image: url('${badgeMask2Url}');`);
        }
      }

      nameTextContainer.appendChild(badgeEl);
    }
    
    if (player.systemName) {
      let systemName = player.systemName.replace(/'/g, '');
      if (unnamed || gameUiThemes.indexOf(systemName) === -1)
        systemName = getDefaultUiTheme();
      const parsedSystemName = systemName.replace(/ /g, '_');
      applyThemeStyles(nameTextContainer, parsedSystemName);
      if (badgeOverlayEl) {
        if (badgeOverlay2El) {
          badgeOverlayEl.style.background = badge.overlayType & BadgeOverlayType.GRADIENT
            ? `var(--base-gradient-${parsedSystemName})`
            : `rgb(var(--base-color-${parsedSystemName}))`;
          if (getStylePropertyValue(`--base-color-${parsedSystemName}`) !== getStylePropertyValue(`--alt-color-${parsedSystemName}`)) {
            badgeOverlay2El.style.background = badge.overlayType & BadgeOverlayType.GRADIENT
              ? `var(--alt-gradient-${parsedSystemName})`
              : `rgb(var(--alt-color-${parsedSystemName}))`;
          } else
            badgeOverlay2El.style.background = `rgb(var(--base-bg-color-${parsedSystemName}))`;
        } else
          badgeOverlayEl.style.background = `var(--base-gradient-${parsedSystemName})`;
      }
    }

    return nameTextContainer.outerHTML;
  }
  
  if (includeMarkers && isPlayerObj) {
    if (player.rank)
      playerName += roleEmojis[player.rank === 1 ? 'mod' : 'dev'];
    if (player.muted)
      playerName += roleEmojis['muted'];
    if (!asHtml && !player.account)
      playerName = `<${playerName}>`;
  }
  
  return playerName;
}

function addOrUpdatePlayerListEntry(playerList, player, showLocation, sortEntries) {
  const uuid = player.uuid === defaultUuid ? playerData?.uuid || defaultUuid : player.uuid;
  const name = player.name;
  /** @type {string} */
  let systemName = player.systemName;
  let playerGameId = player.game || gameId;

  let spriteName = player.spriteName ? player.spriteName : (typeof gameDefaultSprite === 'object' && gameDefaultSprite[playerGameId] ? gameDefaultSprite[playerGameId].sprite : gameDefaultSprite[playerGameId] || '');
  let spriteIndex = (typeof player.spriteIndex === 'number' && player.spriteIndex >= 0) ? player.spriteIndex : (typeof gameDefaultSprite === 'object' && gameDefaultSprite[playerGameId] && typeof gameDefaultSprite[playerGameId].idx === 'number' ? gameDefaultSprite[playerGameId].idx : 0);

  if (spriteName) {
    getSpriteProfileImg(spriteName, spriteIndex, undefined, undefined, playerGameId).then(spriteImg => {
      if (spriteImg && playerListEntrySprite.src !== spriteImg)
        fastdom.mutate(() => {
          playerListEntrySprite.src = spriteImg
        })
    });
  } else {
    let playerSpriteCacheEntry = playerSpriteCache[playerGameId + ':' + uuid];
    if (!playerSpriteCacheEntry && uuid !== defaultUuid)
      playerSpriteCacheEntry = playerSpriteCache[playerGameId + ':' + defaultUuid];
    if (playerSpriteCacheEntry) {
      const entry = playerSpriteCacheEntry;
      getSpriteProfileImg(entry.sprite, entry.idx, undefined, undefined, playerGameId).then(spriteImg => {
        if (spriteImg && playerListEntrySprite.src !== spriteImg)
          fastdom.mutate(() => {
            playerListEntrySprite.src = spriteImg
          })
      });
      if (uuid === defaultUuid)
        updatePlayerSprite(entry.sprite, entry.idx, playerGameId);
    }
  }

  if (!playerList)
    playerList = document.getElementById('playerList');

  let playerListEntry = playerList.querySelector(`.playerListEntry[data-uuid="${uuid}"]`);

  /** @type {HTMLSpanElement} */
  const nameText = playerListEntry ? playerListEntry.querySelector('.nameText') : document.createElement('span');
  const playerListEntrySprite = playerListEntry ? playerListEntry.querySelector('.playerListEntrySprite') : document.createElement('img');
  const playerListEntryMedals = playerListEntry ? playerListEntry.querySelector('.playerListEntryMedals') : document.createElement('div');
  const playerListEntryBadge = playerListEntry ? playerListEntry.querySelector('.playerListEntryBadge') : document.createElement('div');
  const playerListEntryBadgeOverlay = playerListEntry ? playerListEntryBadge.querySelector('.playerListEntryBadgeOverlay') : document.createElement('div');
  const playerListEntryBadgeOverlay2 = playerListEntry ? playerListEntryBadge.querySelector('.playerListEntryBadgeOverlay2') : document.createElement('div');
  const playerListEntryActionContainer = playerListEntry ? playerListEntry.querySelector('.playerListEntryActionContainer') : document.createElement('div');

  let friendIcon = playerListEntry?._friendIcon; // playerListEntry ? playerListEntry.querySelector('.friendIcon') : null;
  let rankIcon = playerListEntry ? playerListEntry.querySelector('.rankIcon') : null;
  let mutedIcon = playerListEntry ? playerListEntry.querySelector('.mutedIcon') : null;
  let acceptFriendAction = playerListEntry ? playerListEntry.querySelector('.acceptFriendAction') : null;
  let rejectCancelFriendAction = playerListEntry ? playerListEntry.querySelector('.rejectCancelFriendAction') : null;
  let partyOwnerIcon = playerListEntry ? playerListEntry.querySelector('.partyOwnerIcon') : null;
  let partyKickAction = playerListEntry ? playerListEntry.querySelector('.partyKickAction') : null;
  let transferPartyOwnerAction = playerListEntry ? playerListEntry.querySelector('.transferPartyOwnerAction') : null;

  if (!playerListEntry) {
    playerListEntry = document.createElement('div');
    playerListEntry.classList.add('playerListEntry', 'listEntry');
    playerListEntry.dataset.uuid = uuid;
    playerListEntry.dataset.name = player.name || '';

    const playerListEntryMain = document.createElement('div');
    playerListEntryMain.classList.add('listEntryMain');

    playerListEntrySprite.classList.add('playerListEntrySprite', 'listEntrySprite');
    
    playerListEntryMain.appendChild(playerListEntrySprite);

    const nameTextContainer = document.createElement('div');
    nameTextContainer.classList.add('nameTextContainer');

    nameText.classList.add('nameText');

    if (!player.account) {
      const nameBeginMarker = document.createElement('span');
      nameBeginMarker.classList.add('nameMarker');
      nameBeginMarker.textContent = '<';
      nameTextContainer.appendChild(nameBeginMarker);
    }
    
    if (showLocation) {
      const detailsContainer = document.createElement('div');
      detailsContainer.classList.add('detailsContainer');
      
      nameTextContainer.appendChild(nameText);

      detailsContainer.appendChild(nameTextContainer);

      playerListEntryMain.appendChild(detailsContainer);
    } else {
      nameTextContainer.appendChild(nameText);
      playerListEntryMain.appendChild(nameTextContainer);
    }

    if (!player.account) {
      const nameEndMarker = document.createElement('span');
      nameEndMarker.classList.add('nameMarker');
      nameEndMarker.textContent = '>';
      nameTextContainer.appendChild(nameEndMarker);
    }

    playerListEntry.appendChild(playerListEntryMain);

    playerListEntryMedals.classList.add('playerListEntryMedals', 'medalsContainer');

    playerListEntry.appendChild(playerListEntryMedals);

    playerListEntryBadge.classList.add('playerListEntryBadge', 'badge');

    playerListEntryBadgeOverlay.classList.add('playerListEntryBadgeOverlay', 'badgeOverlay');

    playerListEntryBadgeOverlay2.classList.add('playerListEntryBadgeOverlay2', 'badgeOverlay', 'badgeOverlay2');

    playerListEntryBadge.appendChild(playerListEntryBadgeOverlay);
    playerListEntryBadge.appendChild(playerListEntryBadgeOverlay2);
    playerListEntry.appendChild(playerListEntryBadge);

    playerListEntryActionContainer.classList.add('playerListEntryActionContainer', 'listEntryActionContainer');

    addPlayerContextMenu(playerListEntry, player, uuid, playerList.id === 'playerList' ? MESSAGE_TYPE.MAP : playerList.id === 'partyPlayerList' ? MESSAGE_TYPE.PARTY : null);

    playerListEntry.appendChild(playerListEntryActionContainer);

    const shouldScroll = playerList.scrollHeight > playerList.clientHeight && Math.abs((playerList.scrollHeight - playerList.scrollTop) - playerList.clientHeight) <= 20;

    playerList.appendChild(playerListEntry);

    if (shouldScroll)
      playerList.scrollTop = playerList.scrollHeight;
  }

  if (name || !nameText.innerText || playerList.id !== 'playerList') {
    const playerNameText = getPlayerName(player);
    fastdom.mutate(() => nameText.innerText = playerNameText);
    if (player.account) {
      const nameMarkers = nameText.parentElement.querySelectorAll('.nameMarker');
      for (let nameMarker of nameMarkers)
        nameMarker.remove();
    }

    if (name)
      delete playerListEntry.dataset.unnamed;
    else
      playerListEntry.dataset.unnamed = 'unnamed';

    const isFriend = playerFriendsCache.findIndex(pf => pf.accepted && pf.uuid === uuid) !== -1;
    if (isFriend && !friendIcon) {
      friendIcon = getSvgIcon('friend', true);
      friendIcon.classList.add('friendIcon');
      addTooltip(friendIcon, document.createTextNode(getMassagedLabel(localizedMessages.friends.friend)), true, true);
      nameText.after(friendIcon);
      playerListEntry._friendIcon = friendIcon;
    } else if (!isFriend) { 
      friendIcon?.remove();
      playerListEntry._friendIcon = undefined;
    }

    if (rankIcon)
      rankIcon.remove();

    if (player.rank) {
      const rank = Math.min(player.rank, 2);
      rankIcon = getSvgIcon(rank === 1 ? 'mod' : 'dev', true);
      rankIcon.classList.add('rankIcon');
      addTooltip(rankIcon, getMassagedLabel(localizedMessages.roles[rank === 1 ? 'mod' : 'dev'], true), true, true);
      nameText.after(rankIcon);
    }

    if (mutedIcon)
      mutedIcon.remove();

    if (player.muted) {
      mutedIcon = getSvgIcon('muted', true);
      mutedIcon.classList.add('muted');
      addTooltip(mutedIcon, getMassagedLabel(localizedMessages.playerList.muted, true), true, true);
      nameText.after(mutedIcon);
    }
  }

  let showMedals = player?.account && player?.medals && !globalConfig.hideRankings;

  playerListEntryMedals.innerHTML = '';

  if (player.medals) {
    let medalCount = 0;
    for (let t = medalTypes.length - 1; t >= 0; t--) {
      const imgSrc = `images/medal_${medalTypes[t].toLowerCase()}.png`;
      for (let m = 0; m < player.medals[t]; m++) {
        const medalImg = document.createElement('img');
        medalImg.classList.add('playerListEntryMedal', 'medal');
        playerListEntryMedals.prepend(medalImg);
        fastdom.mutate(() => {
          medalImg.src = imgSrc;
        })
        if (++medalCount >= 5)
          break;
      }
      if (medalCount >= 5)
        break;
    }

    playerListEntryMedals.style.minWidth = `${Math.max(medalCount << 3, 16)}px`;
  }

  const showBadge = player.account && player.badge && badgeCache;
  const badge = showBadge ? findBadge(player.badge) : null;
  const showBadgeOverlay = showBadge && badge?.overlayType;
  const showBadgeOverlay2 = showBadgeOverlay && badge.overlayType & BadgeOverlayType.DUAL;
  const badgeUrl = showBadge ? getBadgeUrl(badge || player.badge) : '';

  playerListEntryBadge.classList.toggle('hidden', !showBadge);
  const backgroundImageLink = showBadge ? `url('${badgeUrl}')` : '';
  if (playerListEntryBadge.style.backgroundImage !== backgroundImageLink)
    fastdom.mutate(() => {
      playerListEntryBadge.style.backgroundImage = backgroundImageLink;
    });

  if (showBadgeOverlay) {
    const badgeMaskUrl = badge.overlayType & BadgeOverlayType.MASK
      ? badgeUrl.replace('.', badge.overlayType & BadgeOverlayType.DUAL ? '_mask_fg.' : '_mask.')
      : badgeUrl;

    playerListEntryBadgeOverlay.classList.toggle('badgeOverlayMultiply', badge.overlayType & BadgeOverlayType.MULTIPLY);
    playerListEntryBadgeOverlay.setAttribute('style', `-webkit-mask-image: url('${badgeMaskUrl}'); mask-image: url('${badgeMaskUrl}');`);

    if (showBadgeOverlay2) {
      const badgeMask2Url = badge.overlayType & BadgeOverlayType.MASK
        ? badgeUrl.replace('.', '_mask_bg.')
        : badgeUrl;

      playerListEntryBadgeOverlay2.classList.toggle('badgeOverlayMultiply', badge.overlayType & BadgeOverlayType.MULTIPLY);
      playerListEntryBadgeOverlay2.setAttribute('style', `-webkit-mask-image: url('${badgeMask2Url}'); mask-image: url('${badgeMask2Url}');`);
    }
  }

  playerListEntryBadgeOverlay.classList.toggle('hidden', !showBadgeOverlay);
  playerListEntryBadgeOverlay2.classList.toggle('hidden', !showBadgeOverlay2);

  if (showBadge) {
    if (localizedBadges) {
      const badgeGame = localizedBadges[badge?.game]?.[player.badge] && badge.game;
      if (badgeGame) {
        playerListEntryBadge._badgeTippy = addOrUpdateTooltip(playerListEntryBadge, document.createTextNode(getMassagedLabel(localizedBadges[badgeGame][player.badge].name)), true, true, false, null, playerListEntryBadge._badgeTippy);
        if (!badge || badge.hidden)
          playerListEntryBadge._badgeTippy.popper.querySelector('.tooltipContent').classList.add('altText');
      }
    }
    if (player.name) {
      // Doesn't support x/y so location color badges may be incorrect for maps with multiple locations
      addOrUpdatePlayerBadgeGalleryTooltip(playerListEntryBadge, player.name, (player.systemName || getDefaultUiTheme(playerGameId)).replace(/'/g, ''));
      playerListEntryBadge.classList.toggle('badgeButton', player.name);
    }
  }

  if (acceptFriendAction)
    acceptFriendAction.remove();
  if (rejectCancelFriendAction)
    rejectCancelFriendAction.remove();

  if (partyOwnerIcon)
    partyOwnerIcon.remove();
  if (partyKickAction)
    partyKickAction.remove();
  if (transferPartyOwnerAction)
    transferPartyOwnerAction.remove();

  if (playerList.id === 'friendsPlayerList') {
    const playerFriend = playerFriendsCache.find(pf => pf.uuid === uuid);
    if (showMedals)
      showMedals = playerFriend?.accepted;
    if (playerFriend && !playerFriend.accepted) {
      if (playerFriend.incoming) {
        acceptFriendAction = document.createElement('a');
        acceptFriendAction.classList.add('acceptFriendAction', 'listEntryAction');
        acceptFriendAction.href = 'javascript:void(0);';
        acceptFriendAction.onclick = () => {
          apiFetch(`addplayerfriend?uuid=${uuid}`)
            .then(response => {
              if (!response.ok)
                throw new Error(response.statusText);
              return response.text();
            })
            .then(_ => {
              const cachedPlayerFriend = playerFriendsCache.find(pf => pf.uuid === uuid);
              if (cachedPlayerFriend) {
                cachedPlayerFriend.accepted = true;
                showFriendsToastMessage('accept', 'approve', cachedPlayerFriend);
              }
              updatePlayerFriends();
            })
            .catch(err => console.error(err));
        };
        acceptFriendAction.appendChild(getSvgIcon('approve', true));
        addTooltip(acceptFriendAction, getMassagedLabel(localizedMessages.playerList.actions.approveFriend, true), true, true);
        playerListEntryActionContainer.appendChild(acceptFriendAction);
      }

      rejectCancelFriendAction = document.createElement('a');
      rejectCancelFriendAction.classList.add('rejectCancelFriendAction', 'listEntryAction');
      rejectCancelFriendAction.href = 'javascript:void(0);';
      rejectCancelFriendAction.onclick = () => {
        apiFetch(`removeplayerfriend?uuid=${uuid}`)
          .then(response => {
            if (!response.ok)
              throw new Error(response.statusText);
            return response.text();
          })
          .then(_ => {
            const cachedPlayerFriend = playerFriendsCache.find(pf => pf.uuid === uuid);
            if (cachedPlayerFriend) {
              playerFriendsCache.splice(playerFriendsCache.indexOf(cachedPlayerFriend), 1);
              showFriendsToastMessage(playerFriend.incoming ? 'reject' : 'cancel', 'deny', cachedPlayerFriend);
            }
            updatePlayerFriends();
          })
          .catch(err => console.error(err));
      };
      rejectCancelFriendAction.appendChild(getSvgIcon('deny', true));
      addTooltip(rejectCancelFriendAction, getMassagedLabel(localizedMessages.playerList.actions[playerFriend.incoming ? 'rejectFriend' : 'cancelFriend'], true), true, true);
      playerListEntryActionContainer.appendChild(rejectCancelFriendAction);
    }
  } else {
    let party;
    if (playerList.id === 'partyPlayerList')
      party = joinedPartyCache;
    else if (playerList.id.startsWith('partyModal')) {
      const partyModalPartyId = document.getElementById('partyModal').dataset.partyId;
      party = Object.values(partyCache).find(p => p.id == partyModalPartyId);
    }

    if (party) {
      if (uuid === party.ownerUuid || (uuid === defaultUuid && playerData?.uuid === party.ownerUuid)) {
        partyOwnerIcon = getSvgIcon('partyOwner', true);
        addTooltip(partyOwnerIcon, getMassagedLabel(localizedMessages.parties.partyOwner, true), true, true);
        if (party.systemName) {
          const parsedPartySystemName = party.systemName.replace(/ /g, '_');
          partyOwnerIcon.querySelector('path').setAttribute('style', `fill: var(--svg-base-gradient-${parsedPartySystemName}); filter: var(--svg-shadow-${parsedPartySystemName});`);
        }
        nameText.parentElement.appendChild(partyOwnerIcon);
      } else if (playerData?.uuid === party.ownerUuid && playerList.id.startsWith('partyModal')) {
        partyKickAction = document.createElement('a');
        partyKickAction.classList.add('partyKickAction', 'listEntryAction');
        partyKickAction.href = 'javascript:void(0);';
        partyKickAction.onclick = () => kickPlayerFromJoinedParty(uuid);
        partyKickAction.appendChild(getSvgIcon('leave', true));
        addTooltip(partyKickAction, getMassagedLabel(localizedMessages.playerList.actions.partyKick, true), true, true);
        playerListEntryActionContainer.appendChild(partyKickAction);

        const transferPartyOwnerAction = document.createElement('a');
        transferPartyOwnerAction.classList.add('transferPartyOwnerAction', 'listEntryAction');
        transferPartyOwnerAction.href = 'javascript:void(0);';
        transferPartyOwnerAction.onclick = () => transferJoinedPartyOwner(uuid);
        transferPartyOwnerAction.appendChild(getSvgIcon('transferPartyOwner', true));
        addTooltip(transferPartyOwnerAction, getMassagedLabel(localizedMessages.playerList.actions.transferPartyOwner, true), true, true);
        playerListEntryActionContainer.appendChild(transferPartyOwnerAction);
      }
    }
  }

  playerListEntryMedals.classList.toggle('hidden', !showMedals);

  if (systemName) {
    systemName = systemName.replaceAll("'", '');
    if (playerListEntry.dataset.unnamed || !(playerGameId in allGameUiThemes) || allGameUiThemes[playerGameId].indexOf(systemName) === -1)
      systemName = getDefaultUiTheme(playerGameId);
    const parsedSystemName = systemName.replaceAll(' ', '_');
    initUiThemeContainerStyles(systemName, playerGameId, false, () => {
      initUiThemeFontStyles(systemName, playerGameId, 0, false, () => {
        const gameParsedSystemName = `${playerGameId !== gameId ? `${playerGameId}-` : ''}${parsedSystemName}`;
        if (showBadgeOverlay) {
          playerListEntryBadgeOverlay.style.background = badge.overlayType & BadgeOverlayType.GRADIENT
            ? `var(--base-gradient-${gameParsedSystemName})`
            : `rgb(var(--base-color-${gameParsedSystemName}))`;
          if (showBadgeOverlay2) {
            if (getStylePropertyValue(`--base-color-${gameParsedSystemName}`) !== getStylePropertyValue(`--alt-color-${gameParsedSystemName}`)) {
              playerListEntryBadgeOverlay2.style.background = badge.overlayType & BadgeOverlayType.GRADIENT
                ? `var(--alt-gradient-${gameParsedSystemName})`
                : `rgb(var(--alt-color-${gameParsedSystemName}))`;
            } else
            playerListEntryBadgeOverlay2.style.background = `rgb(var(--base-bg-color-${gameParsedSystemName}))`;
          }
          if (badge.overlayType & BadgeOverlayType.LOCATION)
            handleBadgeOverlayLocationColorOverride(playerListEntryBadgeOverlay, playerListEntryBadgeOverlay2, null, player.name);
        }
      });
    });
    applyThemeStyles(playerListEntry, parsedSystemName, playerGameId);
  }

  updateThemedContainer(playerListEntry);

  if (sortEntries)
    sortPlayerListEntries(playerList);

  if (playerList.id === 'playerList')
    updateMapPlayerCount(playerList.childElementCount);

  return playerListEntry;
}

function addOrUpdatePlayerListEntryLocation(locationVisible, player, entry) {
  let playerLocation = entry.querySelector('.playerLocation');
  const initLocation = !playerLocation;
  const isValidMap = !!parseInt(player.mapId);
  const showLastOnline = !player.online && player.lastActive;
  
  if (initLocation) {
    playerLocation = document.createElement('small');
    playerLocation.classList.add('playerLocation');
  }

  let playerGameId = player.game || gameId;
  const shouldDisplayLocation = isValidMap || playerGameId !== gameId;
  playerLocation.classList.toggle('hidden', (!locationVisible || !shouldDisplayLocation) && !showLastOnline);

  if (locationVisible && player.online && shouldDisplayLocation) {
    if (!(playerGameId in allGameUiThemes))
      playerGameId = gameId;
    const parsedSystemName = player.systemName ? (allGameUiThemes[playerGameId].indexOf(player.systemName) > -1 ? player.systemName : getDefaultUiTheme(playerGameId)).replace(/ /g, '_') : null;
    playerLocation.dataset.systemOverride = parsedSystemName || null;
    if (playerGameId === gameId) {
      if (gameId === '2kki' && (!localizedMapLocations?.hasOwnProperty(player.mapId))) {
        const prevLocations = player.prevLocations && player.prevMapId !== '0000' ? decodeURIComponent(window.atob(player.prevLocations)).split('|').map(l => { return { title: l }; }) : null;
        set2kkiGlobalChatMessageLocation(playerLocation, player.mapId, player.prevMapId, prevLocations);
      } else {
        const locationsHtml = getLocalizedMapLocationsHtml(gameId, player.mapId, player.prevMapId, player.x, player.y, getInfoLabel('&nbsp;|&nbsp;'));
        fastdom.mutate(() => {
          playerLocation.innerHTML = locationsHtml;
        });
        if (playerLocation.dataset.systemOverride)
          applyThemeStyles(playerLocation, playerLocation.dataset.systemOverride);
      }
    } else {
      fastdom.mutate(() => {
        playerLocation.innerHTML = `<span class="infoLabel"><a href="../${playerGameId}/" target="_blank">${getMassagedLabel(localizedMessages.location.playing).replace('{GAME}', localizedMessages.games[playerGameId])}</a></span>`;
      });
      if (playerLocation.dataset.systemOverride)
        applyThemeStyles(playerLocation, playerLocation.dataset.systemOverride, playerGameId);
    }
  } else if (showLastOnline) {
    const lastActive = getLastOnlineInterval(new Date(player.lastActive));
    const infoLabel = document.createElement('span');
    infoLabel.classList.add('infoLabel');
    if (parseInt(lastActive) < 5000)
      infoLabel.innerHTML = getMassagedLabel(localizedMessages.lastOnline.template).replace('{INTERVAL}', lastActive);
    else
      infoLabel.innerHTML = getMassagedLabel(localizedMessages.lastOnline.longTime);
    fastdom.mutate(() => {
      playerLocation.replaceChildren(infoLabel);
    });
    if (playerLocation.dataset.systemOverride)
      applyThemeStyles(playerLocation, playerLocation.dataset.systemOverride, playerGameId);
  }

  if (initLocation) {
    entry.querySelector('.detailsContainer').appendChild(playerLocation);
  }
}

function updatePlayerListEntryHeader(playerList, key, categoryId) {
  const elements = playerList.querySelectorAll(`.listEntry[data-category-id='${categoryId}']`);
  if (!elements.length)
    return;

  const header = document.createElement('span');
  header.classList.add('infoText', 'listEntryCategoryHeader');
  header.innerHTML = getMassagedLabel(localizedMessages[key].categories[categoryId].replace('{COUNT}', elements.length), true);

  playerList.insertBefore(header, elements[0]);
}

function sortPlayerListEntries(playerList) {
  if (playerList.childElementCount > 1) {
    const playerListEntries = playerList.querySelectorAll('.playerListEntry');

    const sortFunc = getPlayerListIdEntrySortFunc(playerList.id);

    const entries = [].slice.call(playerListEntries).sort(function (a, b) {
      if (sortFunc) {
        const sortValue = sortFunc(a, b);
        if (sortValue !== 0)
          return sortValue;
      }
      return a.innerText.localeCompare(b.innerText, { sensitivity: 'base' });
    });

    for (const ple of entries)
      playerList.appendChild(ple);
  }
}

function updatePlayerListEntrySprite(playerList, sprite, idx, uuid, gameId) {
  const cacheKey = (gameId ? gameId : gameId) + ':' + uuid;
  const entry = playerSpriteCache[cacheKey];
  if (playerSpriteCache.hasOwnProperty(cacheKey) && entry && typeof entry === 'object' && 'sprite' in entry && 'idx' in entry && entry.sprite === sprite && entry.idx === idx)
    return;

  if (!playerList)
    playerList = document.getElementById('playerList');

  const playerListEntrySprite = playerList.querySelector(`.playerListEntry[data-uuid="${uuid}"] img.playerListEntrySprite`);

  playerSpriteCache[cacheKey] = { sprite: sprite, idx: idx };
  getSpriteProfileImg(sprite, idx, undefined, undefined, gameId).then(spriteImg => {
    if (spriteImg !== null && playerListEntrySprite && playerSpriteCache[cacheKey].sprite === sprite && playerSpriteCache[cacheKey].idx === idx)
      playerListEntrySprite.src = spriteImg;
  });

  if (uuid === defaultUuid)
    updatePlayerSprite(sprite, idx, gameId);
}

function removePlayerListEntry(playerList, uuid) {
  if (!playerList)
    playerList = document.getElementById('playerList');

  const playerListEntry = playerList.querySelector(`.playerListEntry[data-uuid="${uuid}"]`);
  if (playerListEntry)
    playerListEntry.remove();
  if (playerList.id === 'playerList')
    updateMapPlayerCount(document.getElementById('playerList').childElementCount);
}

function clearPlayerList(playerList) {
  if (!playerList)
    playerList = document.getElementById('playerList');

  playerList.innerHTML = '';

  if (playerList.id === 'playerList')
    updateMapPlayerCount(0);
}

function clearPlayerLists() {
  clearPlayerList(document.getElementById('playerList'));
  clearPlayerList(document.getElementById('friendsPlayerList'));
  clearPlayerList(document.getElementById('partyPlayerList'))
}

function getPlayerListIdEntrySortFunc(playerListId) {
  if (playerListId) {
    switch (playerListId) {
      case 'playerList':
      case 'partyPlayerList':
        const collator = new Intl.Collator(undefined, { sensitivity: 'base' });
        const baseFunc = (a, b) => {
          const playerA = globalPlayerData[a.dataset.uuid];
          const playerB = globalPlayerData[b.dataset.uuid];
          if (playerA?.rank !== playerB?.rank)
            return playerA?.rank < playerB?.rank ? 1 : -1;
          if (a.dataset.name && b.dataset.name)
            return collator.compare(a.dataset.name, b.dataset.name);
          if (a.dataset.unnamed) {
            if (b.dataset.unnamed)
              return a.dataset.uuid >= b.dataset.uuid ? 1 : -1;
            return 1;
          }
          if (b.dataset.unnamed)
            return -1;
          if (playerA?.account != playerB?.account)
            return playerA?.account ? -1 : 1;
          return 0;
        };
        return playerListId === 'playerList'
          ? (a, b) => {
            if (a.dataset.uuid === defaultUuid)
              return -1;
            if (b.dataset.uuid === defaultUuid)
              return 1;
            return baseFunc(a, b);
          }
          : (a, b) => {
            const memberA = joinedPartyCache?.members.find(m => m.uuid === a.dataset.uuid);
            const memberB = joinedPartyCache?.members.find(m => m.uuid === b.dataset.uuid);
            if (memberA && memberB) {
              if (a.dataset.categoryId !== b.dataset.categoryId)
                return a.dataset.categoryId === 'online' ? -1 : 1;
            } else if (memberA)
              return -1;
            else if (memberB)
              return 1;
            if (a.dataset.uuid === playerData?.uuid)
              return -1;
            if (b.dataset.uuid === playerData?.uuid)
              return 1;
            if (a.dataset.uuid === joinedPartyCache?.ownerUuid)
              return -1;
            if (b.dataset.uuid === joinedPartyCache?.ownerUuid)
              return 1;
            return baseFunc(a, b);
          };
      case 'friendsPlayerList':
        return (a, b) => {
          const categoryA = a.dataset.categoryId;
          const categoryB = b.dataset.categoryId;
          if (categoryA !== categoryB) {
            const getCategoryIndex = category => {
              switch (category) {
                case 'incoming':
                  return 1;
                case 'outgoing':
                  return 3;
                case 'online':
                  return 2;
                case 'offline':
                  return 4;
              };
            };
            return getCategoryIndex(categoryA) < getCategoryIndex(categoryB) ? -1 : 1;
          }

          if (typeof a.dataset.name !== 'string')
            return 0;
          return a.dataset.name.localeCompare(b.dataset.name);
        };
        break;
      case 'partyModalOnlinePlayerList':
      case 'partyModalOfflinePlayerList':
        return (a, b) => {
          const partyModalPartyId = document.getElementById('partyModal').dataset.partyId;
          if (a.dataset.uuid === partyCache[partyModalPartyId]?.ownerUuid)
            return -1;
          if (b.dataset.uuid === partyCache[partyModalPartyId]?.ownerUuid)
            return 1;
          if (a.dataset.uuid === playerData?.uuid)
            return -1;
          if (b.dataset.uuid === playerData?.uuid)
            return 1;
          const playerA = globalPlayerData[a.dataset.uuid];
          const playerB = globalPlayerData[b.dataset.uuid];
          if (playerA?.rank !== playerB?.rank)
            return playerA?.rank < playerB?.rank ? 1 : -1;
          if (a.dataset.unnamed) {
            if (b.dataset.unnamed)
              return a.dataset.uuid >= b.dataset.uuid ? 1 : -1;
            return 1;
          }
          if (b.dataset.unnamed)
            return -1;
          if (playerA?.account != playerB?.account)
            return playerA?.account ? -1 : 1;
          return 0;
        };
    }
  }
  return null;
}

function updateBlocklist(updateModal) {
  return new Promise(resolve => {
    apiFetch('blocklist')
      .then(response => response.json())
      .then(jsonResponse => {
        const blocklist = jsonResponse || [];
        const blocklistModalPlayerList = document.getElementById('blocklistModalPlayerList');

        if (updateModal)
          blocklistModalPlayerList.innerHTML = '';

        blockedPlayerUuids = [];

        Array.from(document.querySelectorAll('.messageContainer.blockedHidden, .gameChatMessageContainer.blockedHidden')).map(el => el.classList.add('pendingUnblock'));

        for (let blockedPlayer of blocklist) {
          globalPlayerData[blockedPlayer.uuid] = {
            name: blockedPlayer.name,
            systemName: blockedPlayer.systemName,
            rank: blockedPlayer.rank,
            account: blockedPlayer.account,
            badge: blockedPlayer.badge || null,
            medals: blockedPlayer.medals
          };
          blockedPlayerUuids.push(blockedPlayer.uuid);

          Array.from(document.querySelectorAll(`.messageContainer[data-sender-uuid='${blockedPlayer.uuid}'], .gameChatMessageContainer[data-sender-uuid='${blockedPlayer.uuid}']`)).map(el => {
            el.classList.add('blockedHidden');
            el.classList.remove('pendingUnblock');
          });

          if (updateModal) {
            addOrUpdatePlayerListEntry(blocklistModalPlayerList, blockedPlayer);

            updatePlayerListEntrySprite(blocklistModalPlayerList, blockedPlayer.spriteName, blockedPlayer.spriteIndex, blockedPlayer.uuid);
          }
        };

        Array.from(document.querySelectorAll('.messageContainer.pendingUnblock, .gameChatMessageContainer.pendingUnblock')).map(el => {
          el.classList.remove('blockedHidden');
          el.classList.remove('pendingUnblock');
        });

        if (updateModal)
          document.getElementById('blocklistModalEmptyLabel').classList.toggle('hidden', !!blocklist.length);

        resolve();
    });
  });
}

function getLastOnlineInterval(date) {
  const localizedInterval = localizedMessages.lastOnline.interval;
  const timeDiffSeconds = (Date.now() - date.getTime()) / 1000;
  if (timeDiffSeconds < 60)
    return localizedInterval.short;
  const timeDiffMinutes = Math.floor(timeDiffSeconds / 60);
  if (timeDiffMinutes < 60)
    return localizedInterval.minutes[timeDiffMinutes === 1 ? 'singular' : 'plural'].replace('{VALUE}', timeDiffMinutes);
  const timeDiffHours = Math.floor(timeDiffMinutes / 60);
  if (timeDiffHours < 24)
    return localizedInterval.hours[timeDiffHours === 1 ? 'singular' : 'plural'].replace('{VALUE}', timeDiffHours);
  const timeDiffDays = Math.floor(timeDiffHours / 24);
  return localizedInterval.days[timeDiffDays === 1 ? 'singular' : 'plural'].replace('{VALUE}', timeDiffDays);
}

async function getSpriteProfileImg(sprite, idx, favicon, dir, gameId) {
  const isBrave = ((navigator.brave && await navigator.brave.isBrave()) || false);
  if (!gameId)
    gameId = ynoGameId;
  let spriteData = favicon ? faviconCache : spriteCache;
  let cacheKey = gameId + ':' + sprite;
  if (!spriteData[cacheKey])
    spriteData[cacheKey] = {};
  if (!spriteData[cacheKey][idx])
    spriteData[cacheKey][idx] = null;
  const spriteUrl = spriteData[cacheKey][idx];
  if (spriteUrl)
    return spriteUrl;
  return await new Promise(resolve => {
    const defaultSpriteObj = getDefaultSprite();
    const defaultSprite = defaultSpriteObj.sprite;
    const defaultIdx = defaultSpriteObj.idx;
    const getDefaultSpriteImg = new Promise(resolve => {
      if (sprite !== defaultSprite || idx !== defaultIdx)
        getSpriteProfileImg(defaultSprite, defaultIdx, favicon, undefined, ynoGameId).then(defaultSpriteImg => resolve(defaultSpriteImg));
      else
        resolve(null);
    });
    if (!sprite || idx === -1)
      return getDefaultSpriteImg.then(defaultSpriteImg => resolve(defaultSpriteImg));
    const img = new Image();
    img.onload = function () {
      getSpriteImg(img, spriteData[cacheKey], sprite, idx, 1, favicon ? 16 : 20, 16, favicon ? 4 : 2, true, isBrave)
        .then(url => resolve(url));
    };
    if (!dir) {
      dir = `../data/${gameId}/CharSet/`;
      img.onerror = () => getSpriteProfileImg(sprite, idx, favicon, `images/charsets/${gameId}/`, gameId).then(url => resolve(url));
    } else {
      img.onerror = () => {
        console.error(`Charset '${sprite}' not found`);
        getDefaultSpriteImg.then(defaultSpriteImg => resolve(defaultSpriteImg));
      };
    }

    img.src = !sprite?.startsWith('#') ? `${dir}${sprite}.png` : '';
  });
}

function updatePlayerSprite(sprite, idx, gameId) {
  getSpriteProfileImg(sprite, idx, true, undefined, gameId).then(faviconImg => document.getElementById('favicon').href = faviconImg);
  playerLoaderSprite = sprite;
  playerLoaderSpriteIdx = idx;
}

function getDefaultSprite() {
  if (typeof gameDefaultSprite === 'object')
    return gameDefaultSprite;
  return { sprite: gameDefaultSprite, idx: 0 };
}

function initDefaultSprites() {
  const defaultSprite = getDefaultSprite();
  const sprite = defaultSprite.sprite;
  const idx = defaultSprite.idx;
  getSpriteProfileImg(sprite, idx);
  getSpriteProfileImg(sprite, idx, true).then(faviconImg => {
    const faviconLink = document.createElement('link');
    faviconLink.id = 'favicon';
    faviconLink.rel = 'shortcut icon';
    faviconLink.type = 'image/x-icon';
    faviconLink.href = faviconImg;
    document.head.appendChild(faviconLink);
  });
}

// EXTERNAL
function syncPlayerData(uuid, rank, account, badge, medals, id) {
  if (badge === 'null')
    badge = null;

  playerUuids[id] = uuid;

  if (globalPlayerData[uuid]) {
    globalPlayerData[uuid].rank = rank;
    globalPlayerData[uuid].account = account;
    globalPlayerData[uuid].badge = badge;
    globalPlayerData[uuid].medals = medals;
  } else {
    globalPlayerData[uuid] = {
      name: null,
      systemName: null,
      rank: rank,
      account: account,
      badge: badge,
      medals: medals
    };
  }

  if (id === -1) {
    globalPlayerData[uuid].name = playerName;
    globalPlayerData[uuid].systemName = systemName;
    globalPlayerData[uuid].account = loggedIn;
    playerData = {
      uuid: uuid,
      name: playerName,
      systemName: systemName,
      rank: rank,
      account: account,
      badge: badge,
      medals: medals
    };
    updateModControls();
  }
}

// EXTERNAL
function shouldConnectPlayer(uuid) {
  return blockedPlayerUuids.indexOf(uuid) === -1;
}

// EXTERNAL
function onPlayerConnectedOrUpdated(systemName, name, id) {
  const uuid = playerUuids[id];
  if (uuid) {
    if (name)
      globalPlayerData[uuid].name = name;
    if (systemName)
      globalPlayerData[uuid].systemName = systemName;
  }
  setTimeout(() => addOrUpdatePlayerListEntry(null, Object.assign({ uuid }, globalPlayerData[uuid]), false, true));
}

// EXTERNAL
function onPlayerSpriteUpdated(sprite, idx, id) {
  updatePlayerListEntrySprite(null, sprite, idx, id !== -1 ? playerUuids[id] : defaultUuid);
}

// EXTERNAL
function onPlayerDisconnected(id) {
  const uuid = playerUuids[id];
  if (uuid) {
    delete playerUuids[id];
    removePlayerListEntry(null, uuid);
  }
}

function showPlayerToastMessage(key, playerName, icon, iconFill, systemName, persist) {
  if (!notificationConfig.players.all || !notificationConfig.players[key])
    return;
  const message = getMassagedLabel(localizedMessages.toast.players[key], true).replace('{PLAYER}', playerName);
  showToastMessage(message, icon, iconFill, systemName, persist);
}

(function () {
  addSessionCommandHandler('p', args => {
    const uuid = args[0];
    const name = args[1];
    const systemName = args[2];
    const rank = parseInt(args[3]);
    const account = parseInt(args[4]) === 1;
    let badge = args[5];
    
    if (badge === 'null')
      badge = null;
    globalPlayerData[uuid] = {
      name: name,
      systemName: systemName,
      rank: rank,
      account: account,
      badge: badge,
      medals: [ parseInt(args[6]), parseInt(args[7]), parseInt(args[8]), parseInt(args[9]), parseInt(args[10]) ]
    };
  });
})();
