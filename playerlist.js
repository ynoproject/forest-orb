function addOrUpdatePlayerListEntry(systemName, name, id) {
  const playerList = document.getElementById("playerList");

  let playerListEntry = document.querySelector(`.playerListEntry[data-id="${id}"]`);

  const nameText = playerListEntry ? playerListEntry.querySelector('.nameText') : document.createElement("span");

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

    playerList.appendChild(playerListEntry);
  }

  if (name || !nameText.innerText) {
    nameText.innerText = name || localizedMessages.playerList.unnamed;
    if (name)
      delete playerListEntry.dataset.unnamed;
    else
      playerListEntry.dataset.unnamed = 'unnamed';
  }

  if (systemName) {
    systemName = systemName.replace(/'/g, '');
    if (playerListEntry.dataset.unnamed || gameUiThemes.indexOf(systemName) === -1)
      systemName = getDefaultUiTheme();
    playerListEntry.setAttribute("style", `background-image: url('images/ui/${gameId}/${systemName}/containerbg.png') !important; border-image: url('images/ui/${gameId}/${systemName}/border.png') 8 repeat !important;`);
    getFontColors(systemName, 0, colors => nameText.setAttribute("style", `background-image: linear-gradient(to bottom, ${getGradientText(colors)}) !important`));
    getFontShadow(systemName, shadow => nameText.style.filter = `drop-shadow(1.5px 1.5px ${shadow})`);
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
function onPlayerConnectedOrUpdated(systemName, name, id) {
  addOrUpdatePlayerListEntry(systemName, name, id);
}

// EXTERNAL
function onPlayerSpriteUpdated(sprite, idx, id) {
  updatePlayerListEntrySprite(sprite, idx, id !== undefined ? id : -1);
}

// EXTERNAL
function onPlayerDisconnected(id) {
  removePlayerListEntry(id);
}