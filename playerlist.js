
const gameDefaultSprite = {
  'yume': '0000000078',
  '2kki': 'syujinkou1',
  'flow': 'sabituki',
  'prayers': 'Flourette',
  'deepdreams': 'main',
  'someday': 'itsuki1',
  'amillusion': { sprite: 'parapluie ', idx: 1 },
  'unevendream': 'kubo',
  'braingirl': 'mikan2'
}[gameId];
const roleEmojis = {
  mod: '🛡️',
  dev: '🔧',
  partyOwner: '👑'
};
const defaultUuid = '0000000000000000';
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

    if (player.rank) {
      const rank = Math.min(player.rank, 2);
      rankIcon = getSvgIcon(rank === 1 ? 'mod' : 'dev', true);
      rankIcon.classList.add('rankIcon');
      addTooltip(rankIcon, getMassagedLabel(localizedMessages.roles[rank === 1 ? 'mod' : 'dev'], true), true, true);
      nameTextContainer.appendChild(rankIcon);
    }

    let badge = null;
    let badgeOverlay = null;

    if (includeBadge && player.badge !== 'null') {
      badge = document.createElement('div');
      badge.classList.add('badge');
      badge.classList.add('nameBadge');

      badgeOverlay = badge && overlayBadgeIds.indexOf(player.badge) > -1 ? document.createElement('div') : null;

      if (localizedBadges) {
        const badgeGame = Object.keys(localizedBadges).find(game => {
          return Object.keys(localizedBadges[game]).find(b => b === player.badge);
        });
        if (badgeGame)
          addTooltip(badge, getMassagedLabel(localizedBadges[badgeGame][player.badge].name, true), true, true);
      }

      const badgeUrl = `images/badge/${player.badge}.png`;
      badge.style.backgroundImage = `url('${badgeUrl}')`;

      if (badgeOverlay) {
        badge.classList.add('overlayBadge');

        badgeOverlay.classList.add('badgeOverlay');
        badgeOverlay.setAttribute('style', `-webkit-mask-image: url('${badgeUrl}'); mask-image: url('${badgeUrl}');`);
        badge.appendChild(badgeOverlay);
      }

      nameTextContainer.appendChild(badge);
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
      if (badgeOverlay)
        badgeOverlay.style.backgroundImage = `var(--base-gradient-${parsedSystemName})`;
    }

    return nameTextContainer.outerHTML;
  }
  
  if (includeMarkers && isPlayerObj) {
    if (player.rank)
      playerName += roleEmojis[player.rank === 1 ? 'mod' : 'dev'];
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
  const playerListEntryBadge = playerListEntry ? playerListEntry.querySelector('.playerListEntryBadge') : document.createElement('div');
  const playerListEntryBadgeOverlay = playerListEntry ? playerListEntryBadge.querySelector('.playerListEntryBadgeOverlay') : document.createElement('div');
  const playerListEntryActionContainer = playerListEntry ? playerListEntry.querySelector('.playerListEntryActionContainer') : document.createElement('div');

  let rankIcon = playerListEntry ? playerListEntry.querySelector('.rankIcon') : null;
  let partyOwnerIcon = playerListEntry ? playerListEntry.querySelector('.partyOwnerIcon') : null;
  let partyKickAction = playerListEntry ? playerListEntry.querySelector('.partyKickAction') : null;
  let transferPartyOwnerAction = playerListEntry ? playerListEntry.querySelector('.transferPartyOwnerAction') : null;

  const player = uuid === defaultUuid ? playerData : globalPlayerData[uuid];

  if (!playerListEntry) {
    playerListEntry = document.createElement('div');
    playerListEntry.classList.add('playerListEntry');
    playerListEntry.classList.add('listEntry');
    playerListEntry.dataset.uuid = uuid;

    playerListEntrySprite.classList.add('playerListEntrySprite');
    playerListEntrySprite.classList.add('listEntrySprite');
    
    playerListEntry.appendChild(playerListEntrySprite);

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

      playerListEntry.appendChild(detailsContainer);
    } else {
      nameTextContainer.appendChild(nameText);
      playerListEntry.appendChild(nameTextContainer);
    }

    if (!player?.account) {
      const nameEndMarker = document.createElement('span');
      nameEndMarker.classList.add('nameMarker');
      nameEndMarker.textContent = '>';
      nameTextContainer.appendChild(nameEndMarker);
    }

    playerListEntryBadge.classList.add('playerListEntryBadge');
    playerListEntryBadge.classList.add('badge');

    playerListEntryBadgeOverlay.classList.add('playerListEntryBadgeOverlay');
    playerListEntryBadgeOverlay.classList.add('badgeOverlay');

    playerListEntryBadge.appendChild(playerListEntryBadgeOverlay);
    playerListEntry.appendChild(playerListEntryBadge);

    playerListEntryActionContainer.classList.add('playerListEntryActionContainer');
    playerListEntryActionContainer.classList.add('listEntryActionContainer');

    if (player && playerData?.rank > player.rank) {
      const banAction = document.createElement('a');
      banAction.classList.add('listEntryAction');
      banAction.href = 'javascript:void(0);';
      banAction.onclick = function () {
        if (confirm(`Are you sure you want to permanently ban ${getPlayerName(player, true)}?`)) {
          apiFetch(`admin?command=ban&player=${uuid}`)
            .then(response => {
              if (!response.ok)
                throw new Error(response.statusText);
              return response.text();
            })
            .then(_ => showToastMessage(`${getPlayerName(player, true)} has been banned.`, 'ban', true, systemName))
            .catch(err => console.error(err));
        }
      };
      banAction.appendChild(getSvgIcon('ban', true));
      playerListEntryActionContainer.appendChild(banAction);
    }

    playerListEntry.appendChild(playerListEntryActionContainer);

    playerList.appendChild(playerListEntry);
  }

  let playerSpriteCacheEntry = playerSpriteCache[uuid];
  if (!playerSpriteCacheEntry && uuid !== defaultUuid)
    playerSpriteCacheEntry = playerSpriteCache[defaultUuid];
  if (playerSpriteCacheEntry) {
    getSpriteImg(playerSpriteCacheEntry.sprite, playerSpriteCacheEntry.idx).then(spriteImg => {
      if (spriteImg)
        playerListEntrySprite.src = spriteImg
    });
    if (uuid === defaultUuid)
      updateFaviconSprite(playerSpriteCacheEntry.sprite, playerSpriteCacheEntry.idx);
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
  }

  const showBadge = player?.account && player.badge;
  const showBadgeOverlay = showBadge && overlayBadgeIds.indexOf(player.badge) > -1;
  const badgeUrl = showBadge ? `images/badge/${player.badge}.png` : '';

  playerListEntryBadge.classList.toggle('hidden', !showBadge);
  playerListEntryBadge.style.backgroundImage = showBadge ? `url('${badgeUrl}')` : '';

  playerListEntryBadgeOverlay.classList.toggle('hidden', !showBadgeOverlay);
  playerListEntryBadgeOverlay.setAttribute('style', `-webkit-mask-image: url('${badgeUrl}'); mask-image: url('${badgeUrl}');`);

  if (showBadge) {
    if (localizedBadges) {
      const badgeGame = Object.keys(localizedBadges).find(game => {
        return Object.keys(localizedBadges[game]).find(b => b === player.badge);
      });
      if (badgeGame)
        playerListEntryBadge._badgeTippy = addOrUpdateTooltip(playerListEntryBadge, getMassagedLabel(localizedBadges[badgeGame][player.badge].name, true), true, true, false, null, playerListEntryBadge._badgeTippy);
    }
    if (player.name) {
      addOrUpdatePlayerBadgeGalleryTooltip(playerListEntryBadge, player.name, player.systemName || getDefaultUiTheme());
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
    } else if (playerData?.uuid === party.ownerUuid) {
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
        if (rankIcon || playerListEntryActionContainer.childElementCount || showLocation) {
          if (rankIcon)
            rankIcon.querySelector('path').setAttribute('style', `fill: var(--svg-base-gradient-${parsedSystemName}); filter: var(--svg-shadow-${parsedSystemName});`);
          for (let iconPath of playerListEntryActionContainer.querySelectorAll('path'))
            iconPath.setAttribute('style', `fill: var(--svg-base-gradient-${parsedSystemName}); filter: var(--svg-shadow-${parsedSystemName}); filter: var(--svg-shadow-${parsedSystemName});`);
          if (showLocation)
            playerListEntry.querySelector('.playerLocationIcon path').setAttribute('style', `stroke: var(--svg-alt-gradient-${parsedSystemName}); filter: var(--svg-shadow-${parsedSystemName})`);
        }
        if (showBadgeOverlay)
          playerListEntryBadgeOverlay.style.backgroundImage = `var(--base-gradient-${parsedSystemName})`;
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
  if (!playerList)
    playerList = document.getElementById('playerList');
  
  const playerListEntrySprite = playerList.querySelector(`.playerListEntry[data-uuid="${uuid}"] > img.playerListEntrySprite`);

  playerSpriteCache[uuid] = { sprite: sprite, idx: idx };
  getSpriteImg(sprite, idx).then(spriteImg => {
    if (spriteImg !== null && playerListEntrySprite && playerSpriteCache[uuid].sprite === sprite && playerSpriteCache[uuid].idx === idx)
      playerListEntrySprite.src = spriteImg;
  });

  if (uuid === defaultUuid)
    updateFaviconSprite(sprite, idx);
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

async function getSpriteImg(sprite, idx, favicon, dir) {
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
        getSpriteImg(defaultSprite, defaultIdx, favicon).then(defaultSpriteImg => resolve(defaultSpriteImg));
      else
        resolve(null);
    });
    if (!sprite || idx === -1)
      return getDefaultSpriteImg.then(defaultSpriteImg => resolve(defaultSpriteImg));
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = 24;
      canvas.height = 32;
      const context = canvas.getContext('2d');
      const startX = (idx % 4) * 72 + 24;
      const startY = (idx >> 2) * 128 + 64;
      context.drawImage(img, startX, startY, 24, 32, 0, 0, 24, 32);
      const imageData = context.getImageData(0, 0, 24, 32);
      const data = imageData.data;
      const transPixel = data.slice(0, 3);
      let yOffset = -1;
      const checkPixelTransparent = isBrave
        ? o => (data[o] === transPixel[0] || data[o] - 1 === transPixel[0]) && (data[o + 1] === transPixel[1] || data[o + 1] - 1 === transPixel[1]) && (data[o + 2] === transPixel[2] || data[o + 2] - 1 === transPixel[2])
        : o => data[o] === transPixel[0] && data[o + 1] === transPixel[1] && data[o + 2] === transPixel[2];
      for (let i = 0; i < data.length; i += 4) {
        if (checkPixelTransparent(i))
          data[i + 3] = 0;
        else if (yOffset === -1)
          yOffset = Math.max(Math.min(i >> 7, 15), 3);
      }
      if (yOffset === -1)
        yOffset = 0;
      canvas.width = favicon ? 16 : 20;
      canvas.height = 16;
      context.putImageData(imageData, favicon ? -4 : -2, yOffset * -1, favicon ? 4 : 2, 0, 20, 32);
      canvas.toBlob(blob => {
        const blobImg = document.createElement('img');
        const url = URL.createObjectURL(blob);
      
        blobImg.onload = () => URL.revokeObjectURL(url);
      
        spriteData[sprite][idx] = url;
        canvas.remove();
        resolve(url);
      });
    };
    if (!dir) {
      dir = `../data/${gameId}/CharSet/`;
      img.onerror = () => getSpriteImg(sprite, idx, favicon, `images/charsets/${gameId}/`).then(url => resolve(url));
    } else {
      img.onerror = () => {
        console.error(`Charset '${sprite}' not found`);
        getDefaultSpriteImg.then(defaultSpriteImg => resolve(defaultSpriteImg));
      };
    }

    img.src = `${dir}${sprite}.png`;
  });
}

function updateFaviconSprite(sprite, idx) {
  getSpriteImg(sprite, idx, true).then(faviconImg => document.getElementById('favicon').href = faviconImg);
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
  getSpriteImg(sprite, idx);
  getSpriteImg(sprite, idx, true).then(faviconImg => {
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
    globalPlayerData[uuid].account = !!sessionId;
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
function syncGlobalPlayerData(uuid, name, systemName, rank, account, badge) {
  if (badge === 'null')
    badge = null;
  globalPlayerData[uuid] = {
    name: name,
    systemName: systemName,
    rank: rank,
    account: account,
    badge: badge
  };
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