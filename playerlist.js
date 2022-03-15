const roleEmojis = {
  mod: '🛡️',
  dev: '🔧',
  partyOwner: '👑'
};
const defaultUuid = '0000000000000000';
let playerData = null;
let playerUuids = {};
let globalPlayerData = {};
let spriteData = {};
let playerSpriteCache = {};

function addOrUpdatePlayerListEntry(playerList, systemName, name, uuid, showLocation) {
  if (!playerList)
    playerList = document.getElementById('playerList');

  let playerListEntry = playerList.querySelector(`.playerListEntry[data-uuid="${uuid}"]`);

  const nameText = playerListEntry ? playerListEntry.querySelector('.nameText') : document.createElement('span');
  const playerListEntrySprite = playerListEntry ? playerListEntry.querySelector('.playerListEntrySprite') : document.createElement('img');
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

    playerListEntryActionContainer.classList.add('playerListEntryActionContainer');
    playerListEntryActionContainer.classList.add('listEntryActionContainer');

    // Not yet supported
    /*if (player && playerData?.rank > player.rank) {
      const banAction = document.createElement('a');
      banAction.classList.add('listEntryAction');
      banAction.href = 'javascript:void(0);';
      banAction.onclick = function () {
        const uuidPtr = Module.allocate(Module.intArrayFromString(uuid), Module.ALLOC_NORMAL);
        Module._SendBanUserRequest(msgPtr);
        Module._free(uuidPtr);
      };
      banAction.appendChild(getSvgIcon('ban', true));
      playerListEntryActionContainer.appendChild(banAction);
    }*/

    playerListEntry.appendChild(playerListEntryActionContainer);

    playerList.appendChild(playerListEntry);
  }

  let playerSpriteCacheEntry = playerSpriteCache[uuid];
  if (!playerSpriteCacheEntry && uuid !== defaultUuid)
    playerSpriteCacheEntry = playerSpriteCache[defaultUuid];
  if (playerSpriteCacheEntry)
    getSpriteImg(playerSpriteCacheEntry.sprite, playerSpriteCacheEntry.idx, spriteImg => playerListEntrySprite.src = spriteImg);

  nameText.innerText = name || localizedMessages.playerList.unnamed;
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
    rankIcon.title = localizedMessages.roles[Object.keys(localizedMessages.roles)[rank - 1]];
    nameText.parentElement.appendChild(rankIcon);
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
      partyOwnerIcon.title = localizedMessages.parties.partyOwner;
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
      partyKickAction.title = localizedMessages.playerList.actions.partyKick;
      playerListEntryActionContainer.appendChild(partyKickAction);

      const transferPartyOwnerAction = document.createElement('a');
      transferPartyOwnerAction.classList.add('transferPartyOwnerAction');
      transferPartyOwnerAction.classList.add('listEntryAction');
      transferPartyOwnerAction.href = 'javascript:void(0);';
      transferPartyOwnerAction.onclick = () => transferJoinedPartyOwner(uuid);
      transferPartyOwnerAction.appendChild(getSvgIcon('transferPartyOwner', true));
      transferPartyOwnerAction.title = localizedMessages.playerList.actions.transferPartyOwner;
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
        if (rankIcon || playerListEntryActionContainer.childElementCount || showLocation) {
          if (rankIcon) {
            rankIcon.querySelector('path').style.fill = `var(--svg-base-gradient-${parsedSystemName})`;
            rankIcon.querySelector('path').style.filter = `var(--svg-shadow-${parsedSystemName})`;
          }
          for (let iconPath of playerListEntryActionContainer.querySelectorAll('path'))
            iconPath.setAttribute('style', `fill: var(--svg-base-gradient-${parsedSystemName}); filter: var(--svg-shadow-${parsedSystemName}); filter: var(--svg-shadow-${parsedSystemName});`);
          if (showLocation)
            playerListEntry.querySelector('.playerLocationIcon path').setAttribute('style', `stroke: var(--svg-alt-gradient-${parsedSystemName}); filter: var(--svg-shadow-${parsedSystemName})`);
        }
      });
    });
  }

  if (playerList.childElementCount > 1) {
    const playerListEntries = playerList.querySelectorAll('.playerListEntry');

    const sortFunc = getPlayerListIdEntrySortFunc(playerList.id);

    const entries = [].slice.call(playerListEntries).sort(function (a, b) {
      if (sortFunc) {
        const sortValue = sortFunc(a, b);
        if (sortValue !== 0)
          return sortValue;
      }
      return a.innerText.localeCompare(b.innerText);
    });

    entries.forEach(function (ple) {
        playerList.appendChild(ple);
    });
  }

  if (playerList.id === 'playerList')
    updateMapPlayerCount(playerList.childElementCount);

  return playerListEntry;
}

function updatePlayerListEntrySprite(playerList, sprite, idx, uuid) {
  if (!playerList)
    playerList = document.getElementById('playerList');
  
  const playerListEntrySprite = playerList.querySelector(`.playerListEntry[data-uuid="${uuid}"] > img.playerListEntrySprite`);

  const callback = function (spriteImg) {
    if (playerListEntrySprite && playerSpriteCache[uuid].sprite === sprite && playerSpriteCache[uuid].idx === idx)
      playerListEntrySprite.src = spriteImg;
  };

  playerSpriteCache[uuid] = { sprite: sprite, idx: idx };
  getSpriteImg(sprite, idx, callback);
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
          const rankA = globalPlayerData[a.dataset.uuid]?.rank;
          const rankB = globalPlayerData[b.dataset.uuid]?.rank;
          if (rankA !== rankB)
            return rankA < rankB ? 1 : -1;
          if (a.dataset.unnamed) {
            if (b.dataset.unnamed)
              return a.dataset.uuid >= b.dataset.uuid ? 1 : -1;
            return 1;
          }
          if (b.dataset.unnamed)
            return -1;
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
            const uuidA = a.dataset.uuid === defaultUuid ? playerData?.uuid : a.dataset.uuid;
            const uuidB = b.dataset.uuid === defaultUuid ? playerData?.uuid : b.dataset.uuid;
            const memberA = joinedPartyCache?.members.find(m => m.uuid === uuidA);
            const memberB = joinedPartyCache?.members.find(m => m.uuid === uuidB);
            if (memberA && memberB) {
              if (memberA.online !== memberB.online)
                return memberB.online ? 1 : -1;
            } else if (memberA)
              return -1;
            else if (memberB)
              return 1;
            if (uuidA === playerData?.uuid)
              return -1;
            if (uuidB === playerData?.uuid)
              return 1;
            if (uuidA === joinedPartyCache?.ownerUuid)
              return -1;
            if (uuidB === joinedPartyCache?.ownerUuid)
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
          const rankA = globalPlayerData[a.dataset.uuid]?.rank;
          const rankB = globalPlayerData[b.dataset.uuid]?.rank;
          if (rankA !== rankB)
            return rankA < rankB ? 1 : -1;
          if (a.dataset.unnamed) {
            if (b.dataset.unnamed)
              return a.dataset.uuid >= b.dataset.uuid ? 1 : -1;
            return 1;
          }
          if (b.dataset.unnamed)
            return -1;
          return 0;
        };
    }
  }
  return null;
}

function getSpriteImg(sprite, idx, callback, dir) {
  if (!spriteData[sprite])
    spriteData[sprite] = {};
  if (!spriteData[sprite][idx])
    spriteData[sprite][idx] = null;
  let spriteUrl = spriteData[sprite][idx];
  if (spriteUrl)
    return callback(spriteUrl);
  if (!sprite || idx === -1)
    return null;
  const img = new Image();
  img.onload = function () {
    const canvas = document.createElement('canvas');
    canvas.width = 24;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    const startX = (idx % 4) * 72 + 24;
    const startY = (idx >> 2) * 128 + 64;
    context.drawImage(img, startX, startY, 24, 32, 0, 0, 24, 32);
    const transPixel = context.getImageData(0, 0, 1, 1).data;
    const imageData = context.getImageData(0, 0, 24, 32);
    const data = imageData.data;
    let yOffset = -1;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] === transPixel[0] && data[i + 1] === transPixel[1] && data[i + 2] === transPixel[2])
        data[i + 3] = 0;
      else if (yOffset === -1)
        yOffset = Math.max(Math.min(i >> 7, 15), 3);
    }
    if (yOffset === -1)
      yOffset = 0;
    canvas.width = 20;
    canvas.height = 16;
    context.putImageData(imageData, -2, yOffset * -1, 2, 0, 20, 32);
    canvas.toBlob(function (blob) {
      const blobImg = document.createElement('img');
      const url = URL.createObjectURL(blob);
    
      blobImg.onload = function () {
        URL.revokeObjectURL(url);
      };
    
      spriteData[sprite][idx] = url;
      canvas.remove();
      callback(url);
    });
  };
  if (!dir) {
    dir = `../data/${gameId}/CharSet/`;
    img.onerror = function () {
      getSpriteImg(sprite, idx, callback, `images/charsets/${gameId}/`);
    };
  } else {
    img.onerror = function () {
      console.error(`Charset '${sprite}' not found`);
    };
  }

  img.src = `${dir}${sprite}.png`;
}

// EXTERNAL
function syncPlayerData(uuid, rank, id) {
  playerUuids[id] = uuid;

  if (globalPlayerData[uuid])
    globalPlayerData[uuid].rank = rank;
  else
    globalPlayerData[uuid] = {
      name: null,
      systemName: null,
      rank: rank
    };

  if (id === -1) {
    playerData = {
      uuid: uuid,
      name: globalPlayerData[uuid]?.name || null,
      systemName: globalPlayerData[uuid]?.systemName || null,
      rank: rank
    };
    globalPlayerData[uuid].name = playerName;
    globalPlayerData[uuid].systemName = systemName;
  }
}

// EXTERNAL
function syncGlobalPlayerData(uuid, name, systemName, rank) {
  globalPlayerData[uuid] = {
    name: name,
    systemName: systemName,
    rank: rank
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
  addOrUpdatePlayerListEntry(null, systemName, name, uuid);
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