const roleEmojis = {
  mod: '🛡️',
  dev: '🔧',
  partyOwner: '👑',
  muted: '🔇'
};
const defaultUuid = '0000000000000000';
const medalTypes = [ 'Diamond', 'Gold', 'Silver', 'Bronze' ];
let playerData = null;
let playerUuids = {};
let globalPlayerData = {};
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
    let mutedIcon = null;

    if (player.rank) {
      const rank = Math.min(player.rank, 2);
      rankIcon = getSvgIcon(rank === 1 ? 'mod' : 'dev', true);
      rankIcon.classList.add('rankIcon');
      addTooltip(rankIcon, getMassagedLabel(localizedMessages.roles[rank === 1 ? 'mod' : 'dev'], true), true, true);
      nameTextContainer.appendChild(rankIcon);
    }

    if (player.muted) {
      mutedIcon = getSvgIcon('muted', true);
      mutedIcon.classList.add('muted');
      // TODO: Localize
      addTooltip(mutedIcon, 'Muted', true, true);
      nameTextContainer.appendChild(mutedIcon);
    }

    const badge = includeBadge && player.badge !== 'null' ? badgeCache.find(b => b.badgeId === player.badge) : null;
    let badgeEl = null;
    let badgeOverlayEl = null;
    let badgeOverlay2El = null;

    if (badge) {
      badgeEl = document.createElement('div');
      badgeEl.classList.add('badge');
      badgeEl.classList.add('nameBadge');

      badgeOverlayEl = badge?.overlayType ? document.createElement('div') : null;
      badgeOverlay2El = badge?.overlayType & BadgeOverlayType.DUAL ? document.createElement('div') : null;

      const badgeUrl = getBadgeUrl(player.badge, true);
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

          badgeOverlay2El.classList.add('badgeOverlay');
          badgeOverlay2El.classList.add('badgeOverlay2');
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
      const parsedSystemName = systemName.replace(' ', '_');
      nameText.setAttribute('style', `color: var(--base-color-${parsedSystemName}); background-image: var(--base-gradient-${parsedSystemName}) !important; filter: drop-shadow(1.5px 1.5px var(--shadow-color-${parsedSystemName}));`);
      const nameMarkers = nameTextContainer.querySelectorAll('.nameMarker');
      if (nameMarkers.length) {
        const nameMarkerStyle = `color: var(--alt-color-${parsedSystemName}); background-image: var(--alt-gradient-${parsedSystemName}) !important; filter: drop-shadow(1.5px 1.5px var(--shadow-color-${parsedSystemName}));`;
        for (let nameMarker of nameMarkers)
          nameMarker.setAttribute('style', nameMarkerStyle);
      }
      if (rankIcon)
        rankIcon.querySelector('path').setAttribute('style', `fill: var(--svg-base-gradient-${parsedSystemName}); filter: var(--svg-shadow-${parsedSystemName});`);
      if (mutedIcon)
        mutedIcon.querySelector('path').setAttribute('style', `fill: var(--svg-base-gradient-${parsedSystemName}); filter: var(--svg-shadow-${parsedSystemName});`);
      if (badgeOverlayEl) {
        if (badgeOverlay2El) {
          badgeOverlayEl.style.background = `var(--base-${badge.overlayType & BadgeOverlayType.GRADIENT ? 'gradient' : 'color'}-${parsedSystemName})`;
          badgeOverlay2El.style.background = getStylePropertyValue(`--base-color-${parsedSystemName}`) !== getStylePropertyValue(`--alt-color-${parsedSystemName}`)
            ? `var(--alt-${badge.overlayType & BadgeOverlayType.GRADIENT ? 'gradient' : 'color'}-${parsedSystemName})`
            : `var(--base-bg-color-${parsedSystemName})`;
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

function addOrUpdatePlayerListEntry(playerList, systemName, name, uuid, showLocation, sortEntries) {
  if (!playerList)
    playerList = document.getElementById('playerList');

  let playerListEntry = playerList.querySelector(`.playerListEntry[data-uuid="${uuid}"]`);

  const nameText = playerListEntry ? playerListEntry.querySelector('.nameText') : document.createElement('span');
  const playerListEntrySprite = playerListEntry ? playerListEntry.querySelector('.playerListEntrySprite') : document.createElement('img');
  const playerListEntryMedals = playerListEntry ? playerListEntry.querySelector('.playerListEntryMedals') : document.createElement('div');
  const playerListEntryMedalCounts = [...Array(medalTypes.length)].map(i => playerListEntry ? playerListEntry.querySelector(`.playerListEntry${medalTypes[i]}MedalCount`) : document.createElement('div'));
  const playerListEntryBadge = playerListEntry ? playerListEntry.querySelector('.playerListEntryBadge') : document.createElement('div');
  const playerListEntryBadgeOverlay = playerListEntry ? playerListEntryBadge.querySelector('.playerListEntryBadgeOverlay') : document.createElement('div');
  const playerListEntryBadgeOverlay2 = playerListEntry ? playerListEntryBadge.querySelector('.playerListEntryBadgeOverlay2') : document.createElement('div');
  const playerListEntryActionContainer = playerListEntry ? playerListEntry.querySelector('.playerListEntryActionContainer') : document.createElement('div');

  let rankIcon = playerListEntry ? playerListEntry.querySelector('.rankIcon') : null;
  let mutedIcon = playerListEntry ? playerListEntry.querySelector('.mutedIcon') : null;
  let partyOwnerIcon = playerListEntry ? playerListEntry.querySelector('.partyOwnerIcon') : null;
  let partyKickAction = playerListEntry ? playerListEntry.querySelector('.partyKickAction') : null;
  let transferPartyOwnerAction = playerListEntry ? playerListEntry.querySelector('.transferPartyOwnerAction') : null;

  const player = uuid === defaultUuid ? playerData : globalPlayerData[uuid];

  if (!playerListEntry) {
    playerListEntry = document.createElement('div');
    playerListEntry.classList.add('playerListEntry');
    playerListEntry.classList.add('listEntry');
    playerListEntry.dataset.uuid = uuid;

    const playerListEntryMain = document.createElement('div');
    playerListEntryMain.classList.add('listEntryMain');

    playerListEntrySprite.classList.add('playerListEntrySprite');
    playerListEntrySprite.classList.add('listEntrySprite');
    
    playerListEntryMain.appendChild(playerListEntrySprite);

    const nameTextContainer = document.createElement('div');
    nameTextContainer.classList.add('nameTextContainer');

    nameText.classList.add('nameText');

    if (!player?.account) {
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
      detailsContainer.appendChild(getSvgIcon('playerLocation'));

      playerListEntryMain.appendChild(detailsContainer);
    } else {
      nameTextContainer.appendChild(nameText);
      playerListEntryMain.appendChild(nameTextContainer);
    }

    if (!player?.account) {
      const nameEndMarker = document.createElement('span');
      nameEndMarker.classList.add('nameMarker');
      nameEndMarker.textContent = '>';
      nameTextContainer.appendChild(nameEndMarker);
    }

    playerListEntry.appendChild(playerListEntryMain);

    playerListEntryMedals.classList.add('playerListEntryMedals');

    for (let m = 0; m < medalTypes.length; m++) {
      const medalCount = playerListEntryMedalCounts[m];

      medalCount.classList.add(`playerListEntry${medalTypes[m]}MedalCount`);
      medalCount.classList.add('playerListEntryMedalCount');

      const medalCountImg = document.createElement('img');
      medalCountImg.classList.add('playerListEntryMedalCountImg');
      medalCountImg.src = `images/medal_${medalTypes[m].toLowerCase()}.png`;

      const medalCountLabel = document.createElement('label');
      medalCountLabel.classList.add('playerListEntryMedalCountLabel');
      medalCountLabel.innerHTML = 99;

      medalCount.appendChild(medalCountImg);
      medalCount.appendChild(medalCountLabel);

      playerListEntryMedals.appendChild(medalCount);
    }

    playerListEntry.appendChild(playerListEntryMedals);

    playerListEntryBadge.classList.add('playerListEntryBadge');
    playerListEntryBadge.classList.add('badge');

    playerListEntryBadgeOverlay.classList.add('playerListEntryBadgeOverlay');
    playerListEntryBadgeOverlay.classList.add('badgeOverlay');

    playerListEntryBadgeOverlay2.classList.add('playerListEntryBadgeOverlay2');
    playerListEntryBadgeOverlay2.classList.add('badgeOverlay');
    playerListEntryBadgeOverlay2.classList.add('badgeOverlay2');

    playerListEntryBadge.appendChild(playerListEntryBadgeOverlay);
    playerListEntryBadge.appendChild(playerListEntryBadgeOverlay2);
    playerListEntry.appendChild(playerListEntryBadge);

    playerListEntryActionContainer.classList.add('playerListEntryActionContainer');
    playerListEntryActionContainer.classList.add('listEntryActionContainer');

    if (player && playerData?.rank > player.rank)
      addAdminContextMenu(playerListEntry, player, uuid);

    playerListEntry.appendChild(playerListEntryActionContainer);

    playerList.appendChild(playerListEntry);
  }

  let playerSpriteCacheEntry = playerSpriteCache[uuid];
  if (!playerSpriteCacheEntry && uuid !== defaultUuid)
    playerSpriteCacheEntry = playerSpriteCache[defaultUuid];
  if (playerSpriteCacheEntry) {
    getSpriteProfileImg(playerSpriteCacheEntry.sprite, playerSpriteCacheEntry.idx).then(spriteImg => {
      if (spriteImg)
        playerListEntrySprite.src = spriteImg
    });
    if (uuid === defaultUuid)
      updatePlayerSprite(playerSpriteCacheEntry.sprite, playerSpriteCacheEntry.idx);
  }

  if (name || !nameText.innerText || playerList.id !== 'playerList') {
    nameText.innerText = getPlayerName(name);
    if (player?.account) {
      const nameMarkers = nameText.parentElement.querySelectorAll('.nameMarker');
      for (let nameMarker of nameMarkers)
        nameMarker.remove();
    }

    if (name)
      delete playerListEntry.dataset.unnamed;
    else
      playerListEntry.dataset.unnamed = 'unnamed';

    if (rankIcon)
      rankIcon.remove();

    if (player?.rank) {
      const rank = Math.min(player.rank, 2);
      rankIcon = getSvgIcon(rank === 1 ? 'mod' : 'dev', true);
      rankIcon.classList.add('rankIcon');
      addTooltip(rankIcon, getMassagedLabel(localizedMessages.roles[rank === 1 ? 'mod' : 'dev'], true), true, true);
      nameText.after(rankIcon);
    }

    if (mutedIcon)
      mutedIcon.remove();

    if (player?.muted) {
      mutedIcon = getSvgIcon('muted', true);
      mutedIcon.classList.add('muted');
      // TODO: Localize
      addTooltip(mutedIcon, 'Muted', true, true);
      nameText.after(mutedIcon);
    }
  }

  const showMedals = playerData?.rank === 2 && player?.account && !globalConfig.hideRankings;

  playerListEntryMedals.classList.toggle('hidden', !showMedals);

  const showBadge = player?.account && player.badge && badgeCache;
  const badge = showBadge ? badgeCache.find(b => b.badgeId === player.badge) : null;
  const showBadgeOverlay = showBadge && badge?.overlayType;
  const showBadgeOverlay2 = showBadgeOverlay && badge.overlayType & BadgeOverlayType.DUAL;
  const badgeUrl = showBadge ? getBadgeUrl(player.badge) : '';

  playerListEntryBadge.classList.toggle('hidden', !showBadge);
  playerListEntryBadge.style.backgroundImage = showBadge ? `url('${badgeUrl}')` : '';

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
      const badgeGame = Object.keys(localizedBadges).find(game => {
        return Object.keys(localizedBadges[game]).find(b => b === player.badge);
      });
      if (badgeGame) {
        playerListEntryBadge._badgeTippy = addOrUpdateTooltip(playerListEntryBadge, getMassagedLabel(localizedBadges[badgeGame][player.badge].name, true), true, true, false, null, playerListEntryBadge._badgeTippy);
        if (!badge || badge.hidden)
          playerListEntryBadge._badgeTippy.popper.querySelector('.tooltipContent').classList.add('altText');
      }
    }
    if (player.name) {
      addOrUpdatePlayerBadgeGalleryTooltip(playerListEntryBadge, player.name, (player.systemName || getDefaultUiTheme()).replace(/'/g, ''));
      playerListEntryBadge.classList.toggle('badgeButton', player.name);
    }
  }

  if (partyOwnerIcon)
    partyOwnerIcon.remove();
  if (partyKickAction)
    partyKickAction.remove();
  if (transferPartyOwnerAction)
    transferPartyOwnerAction.remove();

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
        const parsedPartySystemName = party.systemName.replace(' ', '_');
        partyOwnerIcon.querySelector('path').setAttribute('style', `fill: var(--svg-base-gradient-${parsedPartySystemName}); filter: var(--svg-shadow-${parsedPartySystemName});`);
      }
      nameText.parentElement.appendChild(partyOwnerIcon);
    } else if (playerData?.uuid === party.ownerUuid && playerList.id.startsWith('partyModal')) {
      partyKickAction = document.createElement('a');
      partyKickAction.classList.add('partyKickAction');
      partyKickAction.classList.add('listEntryAction');
      partyKickAction.href = 'javascript:void(0);';
      partyKickAction.onclick = () => kickPlayerFromJoinedParty(uuid);
      partyKickAction.appendChild(getSvgIcon('leave', true));
      addTooltip(partyKickAction, getMassagedLabel(localizedMessages.playerList.actions.partyKick, true), true, true);
      playerListEntryActionContainer.appendChild(partyKickAction);

      const transferPartyOwnerAction = document.createElement('a');
      transferPartyOwnerAction.classList.add('transferPartyOwnerAction');
      transferPartyOwnerAction.classList.add('listEntryAction');
      transferPartyOwnerAction.href = 'javascript:void(0);';
      transferPartyOwnerAction.onclick = () => transferJoinedPartyOwner(uuid);
      transferPartyOwnerAction.appendChild(getSvgIcon('transferPartyOwner', true));
      addTooltip(transferPartyOwnerAction, getMassagedLabel(localizedMessages.playerList.actions.transferPartyOwner, true), true, true);
      playerListEntryActionContainer.appendChild(transferPartyOwnerAction);
    }
  }

  if (systemName) {
    systemName = systemName.replace(/'/g, '');
    if (playerListEntry.dataset.unnamed || gameUiThemes.indexOf(systemName) === -1)
      systemName = getDefaultUiTheme();
    const parsedSystemName = systemName.replace(' ', '_');
    initUiThemeContainerStyles(systemName, false, () => {
      initUiThemeFontStyles(systemName, 0, false, () => {
        playerListEntry.setAttribute('style', `background-image: var(--container-bg-image-url-${parsedSystemName}) !important; border-image: var(--border-image-url-${parsedSystemName}) 8 repeat !important;`);
        nameText.setAttribute('style', `color: var(--base-color-${parsedSystemName}); background-image: var(--base-gradient-${parsedSystemName}) !important; filter: drop-shadow(1.5px 1.5px var(--shadow-color-${parsedSystemName}));`);
        const nameMarkers = nameText.parentElement.querySelectorAll('.nameMarker');
        if (nameMarkers.length) {
          const nameMarkerStyle = `color: var(--alt-color-${parsedSystemName}); background-image: var(--alt-gradient-${parsedSystemName}) !important; filter: drop-shadow(1.5px 1.5px var(--shadow-color-${parsedSystemName}));`;
          for (let nameMarker of nameMarkers)
            nameMarker.setAttribute('style', nameMarkerStyle);
        }
        if (rankIcon || mutedIcon || playerListEntryActionContainer.childElementCount || showLocation) {
          if (rankIcon)
            rankIcon.querySelector('path').setAttribute('style', `fill: var(--svg-base-gradient-${parsedSystemName}); filter: var(--svg-shadow-${parsedSystemName});`);
          for (let iconPath of playerListEntryActionContainer.querySelectorAll('path'))
            iconPath.setAttribute('style', `fill: var(--svg-base-gradient-${parsedSystemName}); filter: var(--svg-shadow-${parsedSystemName}); filter: var(--svg-shadow-${parsedSystemName});`);
          if (showLocation)
            playerListEntry.querySelector('.playerLocationIcon path').setAttribute('style', `stroke: var(--svg-alt-gradient-${parsedSystemName}); filter: var(--svg-shadow-${parsedSystemName})`);
        }
        if (showBadgeOverlay) {
          playerListEntryBadgeOverlay.style.background = `var(--base-${badge.overlayType & BadgeOverlayType.GRADIENT ? 'gradient' : 'color'}-${parsedSystemName})`;
          if (showBadgeOverlay2) {
            playerListEntryBadgeOverlay2.style.background = getStylePropertyValue(`--base-color-${parsedSystemName}`) !== getStylePropertyValue(`--alt-color-${parsedSystemName}`)
              ? `var(--alt-${badge.overlayType & BadgeOverlayType.GRADIENT ? 'gradient' : 'color'}-${parsedSystemName})`
              : `var(--base-bg-color-${parsedSystemName})`;
          }
          if (gameId === '2kki' && badge.overlayType & BadgeOverlayType.LOCATION)
            handle2kkiBadgeOverlayLocationColorOverride(playerListEntryBadgeOverlay, playerListEntryBadgeOverlay2, null, player.name);
        }
      });
    });
  }

  if (sortEntries)
    sortPlayerListEntries(playerList);

  if (playerList.id === 'playerList')
    updateMapPlayerCount(playerList.childElementCount);

  return playerListEntry;
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
      return a.innerText.localeCompare(b.innerText, { sensitivity:'base' });
    });

    entries.forEach(function (ple) {
        playerList.appendChild(ple);
    });
  }
}

function updatePlayerListEntrySprite(playerList, sprite, idx, uuid) {
  if (playerSpriteCache.hasOwnProperty(uuid) && playerSpriteCache[uuid].sprite === sprite && playerSpriteCache[uuid].idx === idx)
    return;

  if (!playerList)
    playerList = document.getElementById('playerList');
  
  const playerListEntrySprite = playerList.querySelector(`.playerListEntry[data-uuid="${uuid}"] > img.playerListEntrySprite`);

  playerSpriteCache[uuid] = { sprite: sprite, idx: idx };
  getSpriteProfileImg(sprite, idx).then(spriteImg => {
    if (spriteImg !== null && playerListEntrySprite && playerSpriteCache[uuid].sprite === sprite && playerSpriteCache[uuid].idx === idx)
      playerListEntrySprite.src = spriteImg;
  });

  if (uuid === defaultUuid)
    updatePlayerSprite(sprite, idx);
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
  clearPlayerList(document.getElementById('partyPlayerList'))
}

function getPlayerListIdEntrySortFunc(playerListId) {
  if (playerListId) {
    switch (playerListId) {
      case 'playerList':
      case 'partyPlayerList':
        const baseFunc = (a, b) => {
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
              if (memberA.online !== memberB.online)
                return memberB.online ? 1 : -1;
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

async function getSpriteProfileImg(sprite, idx, favicon, dir) {
  const isBrave = ((navigator.brave && await navigator.brave.isBrave()) || false);
  return new Promise(resolve => {
    const spriteData = favicon ? faviconCache : spriteCache;
    if (!spriteData[sprite])
      spriteData[sprite] = {};
    if (!spriteData[sprite][idx])
      spriteData[sprite][idx] = null;
    const spriteUrl = spriteData[sprite][idx];
    if (spriteUrl)
      return resolve(spriteUrl);
    const defaultSpriteObj = getDefaultSprite();
    const defaultSprite = defaultSpriteObj.sprite;
    const defaultIdx = defaultSpriteObj.idx;
    const getDefaultSpriteImg = new Promise(resolve => {
      if (sprite !== defaultSprite || idx !== defaultIdx)
        getSpriteProfileImg(defaultSprite, defaultIdx, favicon).then(defaultSpriteImg => resolve(defaultSpriteImg));
      else
        resolve(null);
    });
    if (!sprite || idx === -1)
      return getDefaultSpriteImg.then(defaultSpriteImg => resolve(defaultSpriteImg));
    const img = new Image();
    img.onload = function () {
      getSpriteImg(img, spriteData, sprite, idx, 1, favicon ? 16 : 20, 16, favicon ? 4 : 2, true, isBrave)
        .then(url => resolve(url));
    };
    if (!dir) {
      dir = `../data/${ynoGameId}/CharSet/`;
      img.onerror = () => getSpriteProfileImg(sprite, idx, favicon, `images/charsets/${ynoGameId}/`).then(url => resolve(url));
    } else {
      img.onerror = () => {
        console.error(`Charset '${sprite}' not found`);
        getDefaultSpriteImg.then(defaultSpriteImg => resolve(defaultSpriteImg));
      };
    }

    img.src = `${dir}${sprite}.png`;
  });
}

function updatePlayerSprite(sprite, idx) {
  getSpriteProfileImg(sprite, idx, true).then(faviconImg => document.getElementById('favicon').href = faviconImg);
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
function syncPlayerData(uuid, rank, account, badge, id) {
  if (badge === 'null')
    badge = null;

  playerUuids[id] = uuid;

  if (globalPlayerData[uuid]) {
    globalPlayerData[uuid].rank = rank;
    globalPlayerData[uuid].account = account;
    globalPlayerData[uuid].badge = badge;
  } else {
    globalPlayerData[uuid] = {
      name: null,
      systemName: null,
      rank: rank,
      account: account,
      badge: badge
    };
  }

  if (id === -1) {
    globalPlayerData[uuid].name = playerName;
    globalPlayerData[uuid].systemName = systemName;
    globalPlayerData[uuid].account = !!loginToken;
    playerData = {
      uuid: uuid,
      name: playerName,
      systemName: systemName,
      rank: rank,
      account: account,
      badge: badge
    };
  }
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
  addOrUpdatePlayerListEntry(null, systemName, name, uuid, false, true);
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
      badge: badge
    };
  });
})();