let playerData = {};
let globalPlayerData = {};
let spriteData = {};
let playerSpriteCache = {};

function addOrUpdatePlayerListEntry(systemName, name, id) {
  const playerList = document.getElementById("playerList");

  let playerListEntry = document.querySelector(`.playerListEntry[data-id="${id}"]`);

  const nameText = playerListEntry ? playerListEntry.querySelector(".nameText") : document.createElement("span");
  const playerListEntryActionContainer = playerListEntry ? playerListEntry.querySelector(".playerListEntryActionContainer") : document.createElement("div");

  let roleIcon = playerListEntry ? playerListEntry.querySelector(".roleIcon") : null;

  if (!playerListEntry) {
    playerListEntry = document.createElement("div");
    playerListEntry.classList.add("playerListEntry");
    playerListEntry.dataset.id = id;

    const playerListEntrySprite = document.createElement("img");
    playerListEntrySprite.classList.add("playerListEntrySprite");

    let playerSpriteCacheEntry = playerSpriteCache[id];
    if (!playerSpriteCacheEntry && id > -1)
      playerSpriteCacheEntry = playerSpriteCache[-1];
    if (playerSpriteCacheEntry) {
      getSpriteImg(playerSpriteCacheEntry.sprite, playerSpriteCacheEntry.idx, function (spriteImg) {
        playerListEntrySprite.src = spriteImg;
      });
    }

    playerListEntry.appendChild(playerListEntrySprite);

    nameText.classList.add("nameText");
    playerListEntry.appendChild(nameText);

    playerListEntryActionContainer.classList.add("playerListEntryActionContainer");

    // Not yet supported
    /*if (playerData[id] && playerData[-1].rank > playerData[id].rank) {
      const banAction = document.createElement("a");
      banAction.href = "javascript:void(0);";
      banAction.onclick = function () {
        const uuidPtr = Module.allocate(Module.intArrayFromString(playerData[id].uuid), Module.ALLOC_NORMAL);
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

    if (playerData[id]?.rank) {
      const rank = Math.min(playerData[id].rank, 3);
      nameText.appendChild(document.getElementsByTagName("template")[rank].content.cloneNode(true));
      roleIcon = nameText.children[0];
      roleIcon.title = localizedMessages.roles[Object.keys(localizedMessages.roles)[rank - 1]];
    }
  }

  if (systemName) {
    systemName = systemName.replace(/'/g, "");
    const parsedSystemName = systemName.replace(" ", "_");
    if (playerListEntry.dataset.unnamed || gameUiThemes.indexOf(systemName) === -1)
      systemName = getDefaultUiTheme();
    playerListEntry.setAttribute("style", `background-image: url('images/ui/${gameId}/${systemName}/containerbg.png') !important; border-image: url('images/ui/${gameId}/${systemName}/border.png') 8 repeat !important;`);
    getFontColors(systemName, 0, colors => {
      nameText.setAttribute("style", `background-image: linear-gradient(to bottom, ${getGradientText(colors)}) !important`);
      if (roleIcon || playerListEntryActionContainer.childElementCount) {
        addSystemSvgGradient(systemName, colors);
        if (roleIcon)
          roleIcon.querySelector("path").style.fill = `url(#baseGradient_${parsedSystemName})`;
        for (let iconPath of playerListEntryActionContainer.querySelectorAll("path"))
          iconPath.style.fill = `url(#baseGradient_${parsedSystemName})`;
      }
    });
    getFontShadow(systemName, shadow => {
      nameText.style.filter = `drop-shadow(1.5px 1.5px ${shadow})`;
      if (roleIcon || playerListEntryActionContainer.childElementCount) {
        addSystemSvgDropShadow(systemName, shadow);
        if (roleIcon)
          roleIcon.querySelector("path").style.filter = `url(#dropShadow_${parsedSystemName})`;
        for (let iconPath of playerListEntryActionContainer.querySelectorAll("path"))
          iconPath.style.filter = `url(#dropShadow_${parsedSystemName})`;
      }
    });
  }

  if (playerList.childElementCount > 1) {
    const playerListEntries = document.getElementsByClassName("playerListEntry");

    const entries = [].slice.call(playerListEntries).sort(function (a, b) {
      if (a.dataset.id == -1)
        return -1;
      if (b.dataset.id == -1)
        return 1;
      if (a.dataset.unnamed) {
        if (b.dataset.unnamed)
          return a.dataset.id >= b.dataset.id ? 1 : -1;
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

  updateMapPlayerCount(playerList.childElementCount);
}

function updatePlayerListEntrySprite(sprite, idx, id) {
  const playerListEntrySprite = document.querySelector(`.playerListEntry[data-id="${id}"] > img.playerListEntrySprite`);

  const callback = function (spriteImg) {
    if (playerListEntrySprite && playerSpriteCache[id].sprite === sprite && playerSpriteCache[id].idx === idx)
      playerListEntrySprite.src = spriteImg;
  };

  playerSpriteCache[id] = { sprite: sprite, idx: idx };
  getSpriteImg(sprite, idx, callback);
}

function removePlayerListEntry(id) {
  const playerListEntry = document.querySelector(`.playerListEntry[data-id="${id}"]`);
  if (playerListEntry)
    playerListEntry.remove();
  updateMapPlayerCount(document.getElementById("playerList").childElementCount);
}

function clearPlayerList() {
  const playerList = document.getElementById("playerList");
  playerList.innerHTML = "";
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
  playerData[id] = {
    uuid: uuid,
    name: globalPlayerData[uuid]?.name || null,
    systemName: globalPlayerData[uuid]?.systemName || null,
    rank: rank
  };

  if (id === -1) {
    playerData[id].name = playerName;
    playerData[id].systemName = systemName;
  }

  if (globalPlayerData[uuid])
    globalPlayerData[uuid].rank = rank;
  else
    globalPlayerData[uuid] = {
      name: null,
      systemName: null,
      rank: rank
    };
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
  const uuid = playerData[id]?.uuid;
  if (name) {
    if (playerData[id])
      playerData[id].name = name;
    if (uuid)
      globalPlayerData[uuid].name = name;
  }
  if (systemName) {
    if (playerData[id])
      playerData[id].systemName = systemName;
    if (uuid)
      globalPlayerData[uuid].systemName = systemName;
  }
  addOrUpdatePlayerListEntry(systemName, name, id);
}

// EXTERNAL
function onPlayerSpriteUpdated(sprite, idx, id) {
  updatePlayerListEntrySprite(sprite, idx, id !== undefined ? id : -1);
}

// EXTERNAL
function onPlayerDisconnected(id) {
  delete playerData[id];
  removePlayerListEntry(id);
}