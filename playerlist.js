const rankEmojis = {
  1: '🛡️',
  2: '🔧',
  3: '👑'
};
let playerData = null;
let playerUuids = {};
let globalPlayerData = {};
let spriteData = {};
let playerSpriteCache = {};

function addOrUpdatePlayerListEntry(playerList, systemName, name, uuid) {
  if (!playerList)
    playerList = document.getElementById("playerList");

  let playerListEntry = playerList.querySelector(`.playerListEntry[data-uuid="${uuid}"]`);

  const nameText = playerListEntry ? playerListEntry.querySelector(".nameText") : document.createElement("span");
  const playerListEntryActionContainer = playerListEntry ? playerListEntry.querySelector(".playerListEntryActionContainer") : document.createElement("div");

  let roleIcon = playerListEntry ? playerListEntry.querySelector(".roleIcon") : null;

  if (!playerListEntry) {
    playerListEntry = document.createElement("div");
    playerListEntry.classList.add("playerListEntry");
    playerListEntry.classList.add("listEntry");
    playerListEntry.dataset.uuid = uuid;

    const playerListEntrySprite = document.createElement("img");
    playerListEntrySprite.classList.add("playerListEntrySprite");
    playerListEntrySprite.classList.add("listEntrySprite");

    let playerSpriteCacheEntry = playerSpriteCache[uuid];
    if (!playerSpriteCacheEntry && uuid !== playerData?.uuid)
      playerSpriteCacheEntry = playerSpriteCache[playerData?.uuid];
    if (playerSpriteCacheEntry) {
      getSpriteImg(playerSpriteCacheEntry.sprite, playerSpriteCacheEntry.idx, function (spriteImg) {
        playerListEntrySprite.src = spriteImg;
      });
    }

    playerListEntry.appendChild(playerListEntrySprite);

    nameText.classList.add("nameText");
    playerListEntry.appendChild(nameText);

    playerListEntryActionContainer.classList.add("playerListEntryActionContainer");
    playerListEntryActionContainer.classList.add("listEntryActionContainer");

    // Not yet supported
    /*if (globalPlayerData[uuid] && playerData?.rank > globalPlayerData[uuid].rank) {
      const banAction = document.createElement("a");
      banAction.href = "javascript:void(0);";
      banAction.onclick = function () {
        const uuidPtr = Module.allocate(Module.intArrayFromString(uuid), Module.ALLOC_NORMAL);
        Module._SendBanUserRequest(msgPtr);
        Module._free(uuidPtr);
      };
      banAction.appendChild(document.getElementsByTagName("template")[4].content.cloneNode(true));
      playerListEntryActionContainer.appendChild(banAction);
    }*/

    playerListEntry.appendChild(playerListEntryActionContainer);

    playerList.appendChild(playerListEntry);
  }

  if (name || !nameText.innerText) {
    nameText.innerText = name || localizedMessages.playerList.unnamed;
    if (name)
      delete playerListEntry.dataset.unnamed;
    else
      playerListEntry.dataset.unnamed = "unnamed";

    if (globalPlayerData[uuid]?.rank) {
      const rank = Math.min(globalPlayerData[uuid].rank, 3);
      nameText.appendChild(document.getElementsByTagName("template")[rank].content.cloneNode(true));
      roleIcon = nameText.children[0];
      roleIcon.title = localizedMessages.roles[Object.keys(localizedMessages.roles)[rank - 1]];
    }
  }

  if (systemName) {
    systemName = systemName.replace(/'/g, "");
    if (playerListEntry.dataset.unnamed || gameUiThemes.indexOf(systemName) === -1)
      systemName = getDefaultUiTheme();
    const parsedSystemName = systemName.replace(" ", "_");
    initUiThemeContainerStyles(systemName, false, () => {
      playerListEntry.setAttribute("style", `background-image: var(--container-bg-image-url-${parsedSystemName}) !important; border-image: var(--border-image-url-${parsedSystemName}) 8 repeat !important;`);
      getFontShadow(systemName, shadow => {
        nameText.style.filter = `drop-shadow(1.5px 1.5px var(--shadow-color-${parsedSystemName}))`;
        if (roleIcon || playerListEntryActionContainer.childElementCount) {
          addSystemSvgDropShadow(systemName, shadow);
          if (roleIcon)
            roleIcon.querySelector("path").style.filter = `url(#dropShadow_${parsedSystemName})`;
          for (let iconPath of playerListEntryActionContainer.querySelectorAll("path"))
            iconPath.style.filter = `url(#dropShadow_${parsedSystemName})`;
        }
      });
    });
    initUiThemeFontStyles(systemName, 0, false, () => {
      getFontColors(systemName, 0, colors => {
        nameText.setAttribute("style", `background-image: var(--base-gradient-${parsedSystemName}) !important`);
        if (roleIcon || playerListEntryActionContainer.childElementCount) {
          addSystemSvgGradient(systemName, colors);
          if (roleIcon)
            roleIcon.querySelector("path").style.fill = `url(#baseGradient_${parsedSystemName})`;
          for (let iconPath of playerListEntryActionContainer.querySelectorAll("path"))
            iconPath.style.fill = `url(#baseGradient_${parsedSystemName})`;
        }
      });
    });
  }

  if (playerList.childElementCount > 1) {
    const playerListEntries = playerList.querySelectorAll(".playerListEntry");

    const entries = [].slice.call(playerListEntries).sort(function (a, b) {
      if (a.dataset.uuid == playerData?.uuid)
        return -1;
      if (b.dataset.uuid == playerData?.uuid)
        return 1;
      if (a.dataset.unnamed) {
        if (b.dataset.unnamed)
          return a.dataset.uuid >= b.dataset.uuid ? 1 : -1;
        return 1;
      }
      if (b.dataset.unnamed)
        return -1;
      return a.innerText.localeCompare(b.innerText);
    });

    entries.forEach(function (ple) {
        playerList.appendChild(ple);
    });
  }

  if (playerList.id === 'playerList')
    updateMapPlayerCount(playerList.childElementCount);
}

function updatePlayerListEntrySprite(playerList, sprite, idx, uuid) {
  if (!playerList)
    playerList = document.getElementById("playerList");
  
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
    playerList = document.getElementById("playerList");

  const playerListEntry = playerList.querySelector(`.playerListEntry[data-uuid="${uuid}"]`);
  if (playerListEntry)
    playerListEntry.remove();
  if (playerList.id === 'playerList')
    updateMapPlayerCount(document.getElementById("playerList").childElementCount);
}

function clearPlayerList(playerList) {
  if (!playerList)
    playerList = document.getElementById("playerList");

  playerList.innerHTML = "";

  if (playerList.id === 'playerList')
    updateMapPlayerCount(0);
}

function getSpriteImg(sprite, idx, callback, dir) {
  if (!spriteData[sprite])
    spriteData[sprite] = {};
  if (!spriteData[sprite][idx])
    spriteData[sprite][idx] = null;
  let spriteUrl = spriteData[sprite][idx];
  if (spriteUrl)
    return callback(spriteUrl);
  const img = new Image();
  img.onload = function () {
    const canvas = document.createElement("canvas");
    canvas.width = 24;
    canvas.height = 32;
    const context = canvas.getContext("2d");
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
      const blobImg = document.createElement("img");
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
    addOrUpdatePlayerListEntry(null, systemName, playerName, uuid);
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
  updatePlayerListEntrySprite(null, sprite, idx, id !== undefined ? playerUuids[id] : -1);
}

// EXTERNAL
function onPlayerDisconnected(id) {
  const uuid = playerUuids[id];
  if (uuid) {
    delete playerUuids[id];
    removePlayerListEntry(null, uuid);
  }
}