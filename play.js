const gameIdsElements = document.querySelectorAll('[data-game-ids]');
for (let el of gameIdsElements) {
  if (el.dataset.gameIds.split(',').indexOf(gameId) > -1)
    el.style.display = '';
  else
    el.remove();
}

let localizedMessages;
let localizedMapLocations;
let mapLocations;
let localizedLocationUrlRoot;
let locationUrlRoot;

const langLabelMassageFunctions = {
  'ja': (value, isUI) => {
    if (isUI && value.indexOf(' ') > -1)
      return value.split(/ +/g).map(v => `<span class="nowrap">${v}</span>`).join('');
    return value;
  },
  'ru': (value, _isUI) => {
    return value.replace(/([\u0400-\u04FF]+)/g, '<span class="ru-spacing-fix">$1</span>');
  }
};

let globalConfig = {
  lang: 'en',
  name: '',
  chatTipIndex: -1
};

let config = {
  singlePlayer: false,
  disableChat: false,
  disableNametags: false,
  disablePlayerSounds: false,
  immersionMode: false,
  globalMessage: false,
  chatTabIndex: 0,
  showGlobalMessageLocation: false
};

let connStatus;
let hasConnected = false;

// EXTERNAL
function onUpdateConnectionStatus(status) {
  const updateStatusText = function () {
    const connStatusIcon = document.getElementById('connStatusIcon');
    const connStatusText = document.getElementById('connStatusText');
    connStatusIcon.classList.toggle('connecting', status === 2);
    connStatusIcon.classList.toggle('connected', status === 1);
    connStatusIcon.classList.toggle('singlePlayer', status === 3);
    if (localizedMessages)
      connStatusText.innerHTML = getMassagedLabel(localizedMessages.connStatus[status]);
    connStatusText.classList.toggle('altText', !status);
  }; 
  if (connStatus !== undefined && (!status || status === 2))
    window.setTimeout(function () {
      if (connStatus === status)
        updateStatusText();
    }, 500);
  else
    updateStatusText();
  if (status === 1) {
    addOrUpdatePlayerListEntry(systemName, playerName, -1);
    fetchAndUpdatePlayerCount();
    if (!hasConnected) {
      addChatTip();
      hasConnected = true;
    }
    syncPrevLocation();
  } else
    clearPlayerList();
  connStatus = status;
}

let playerCount;

function fetchAndUpdatePlayerCount() {
  fetch(`../connect/${gameId}/players`)
    .then(response => response.text())
    .then(count => updatePlayerCount(count))
    .catch(err => console.error(err));
}

function updatePlayerCount(count) {
  if (isNaN(count))
    return;
  const playerCountLabel = document.getElementById('playerCountLabel');
  if (localizedMessages)
    playerCountLabel.innerHTML = getMassagedLabel(localizedMessages.playersOnline[count == 1 ? 'singular' : 'plural'].replace('{COUNT}', count), true);
  if (playerCount === undefined)
    document.getElementById('onlineInfo').classList.remove('hidden');
  playerCount = count;
}

function updateMapPlayerCount(count) {
  if (isNaN(count))
    return;
  const mapPlayerCountLabel = document.getElementById('mapPlayerCountLabel');
  if (localizedMessages)
    mapPlayerCountLabel.innerHTML = getMassagedLabel(localizedMessages.playersInMap[count == 1 ? 'singular' : 'plural'].replace('{COUNT}', count), true);
}

let playerName;
let systemName;

setSystemName(getDefaultUiTheme());

if (hasUiThemes)
  populateUiThemes();

const gameLogoUrl = `../images/logo_${gameId}.png`;
const gameLogoImg = new Image();
gameLogoImg.onload = function () {
  let width = gameLogoImg.width;
  let height = gameLogoImg.height;

  width *= 48 / height;
  height = 48;

  if (width > 180) {
    height *= 180 / width;
    width = 180;
  }
  
  const gameLogo = document.getElementById('gameLogo');
  gameLogo.setAttribute('style', `background-image: url('${gameLogoUrl}'); width: ${width}px; height: ${height}px;`);
  document.getElementById('gameLogoOverlay').setAttribute('style', `-webkit-mask-image: url('${gameLogoUrl}'); mask-image: url('${gameLogoUrl}'); mix-blend-mode: ${gameLogoBlendModeOverrides[gameId] || 'multiply'};`);
  gameLogo.classList.remove('hidden');
};
gameLogoImg.src = gameLogoUrl;

let cachedMapId = null;
let cachedPrevMapId = null;
let cachedLocations = null;
let cached2kkiLocations = null; // Used only by Yume 2kki
let cachedPrev2kkiLocations = null; // Used only by Yume 2kki
let ignoredMapIds = [];

// EXTERNAL
function onLoadMap(mapName) {
  let mapIdMatch = /^Map(\d{4})\.lmu$/.exec(mapName);
  if (mapIdMatch) {
    const mapId = mapIdMatch[1];

    if (mapId === cachedMapId || ignoredMapIds.indexOf(mapId) > -1)
      return;

    markMapUpdateInChat();
    
    const is2kki = gameId === '2kki';

    if (is2kki && (!localizedMapLocations || !localizedMapLocations.hasOwnProperty(mapId)))
      onLoad2kkiMap(mapId);
    else {
      if (localizedMapLocations) {
        if (!cachedMapId)
          document.getElementById('location').classList.remove('hidden');

        document.getElementById('locationText').innerHTML = getLocalizedMapLocationsHtml(mapId, cachedMapId, '<br>');
        onUpdateChatboxInfo();

        if (is2kki) {
          cachedPrev2kkiLocations = cached2kkiLocations;
          cached2kkiLocations = null;
          set2kkiExplorerLinks(null);
          set2kkiMaps([]);
        }
      }

      cachedPrevMapId = cachedMapId;
      cachedMapId = mapId;

      if (localizedMapLocations) {
        const locations = getMapLocationsArray(mapLocations, cachedMapId, cachedPrevMapId);
        if (!locations || !cachedLocations || JSON.stringify(locations) !== JSON.stringify(cachedLocations))
          addChatMapLocation();

        cachedLocations = locations;
      }
    }
  }
}

function syncPrevLocation() {
  const prevLocationsStr = cachedPrev2kkiLocations?.length ? window.btoa(encodeURIComponent(cachedPrev2kkiLocations.map(l => l.title).join('|'))) : '';
  const prevMapIdPtr = Module.allocate(Module.intArrayFromString(cachedPrevMapId || '0000'), Module.ALLOC_NORMAL);
  const prevLocationsPtr = Module.allocate(Module.intArrayFromString(prevLocationsStr), Module.ALLOC_NORMAL);
  Module._SendPrevLocation(prevMapIdPtr, prevLocationsPtr);
  Module._free(prevMapIdPtr);
  Module._free(prevLocationsPtr);
}

// EXTERNAL
function onReceiveInputFeedback(inputId) {
  if (inputId) {
    let buttonElement;
    let configKey;
    switch (inputId) {
      case 1:
        buttonElement = document.getElementById('singlePlayerButton');
        configKey = 'singlePlayer';
        document.getElementById('layout').classList.toggle('singlePlayer');
        break;
      case 2:
        buttonElement = document.getElementById('nametagButton');
        configKey = 'disableNametags';
        break;
      case 3:
        buttonElement = document.getElementById('playerSoundsButton');
        configKey = 'disablePlayerSounds';
        break;
    }
    if (configKey) {
      buttonElement.classList.toggle('toggled');
      config[configKey] = buttonElement.classList.contains('toggled');
      updateConfig(config);
    }
  }
}

function preToggle(buttonElement) {
  buttonElement.classList.add('preToggled');
  const tryToggleTimer = window.setInterval(function () {
    if (buttonElement.classList.contains('toggled')) {
      buttonElement.classList.remove('preToggled');
      clearInterval(tryToggleTimer);
    } else
      buttonElement.click();
  }, 500);
}

function openModal(modalId) {
  document.getElementById('modalContainer').classList.remove('hidden');
  const activeModal = document.querySelector('.modal:not(.hidden)');
  if (activeModal && activeModal.id !== modalId)
    activeModal.classList.add('hidden');
  document.getElementById(modalId).classList.remove('hidden');
}

let locationCache;

{
  const closeModal = function () {
    document.getElementById('modalContainer').classList.add('hidden');
    const activeModal = document.querySelector('.modal:not(.hidden)');
    if (activeModal)
      activeModal.classList.add('hidden');
  };
  const modalCloseButtons = document.querySelectorAll('.modalClose');
  for (let button of modalCloseButtons)
    button.onclick = closeModal;
  document.querySelector('.modalOverlay').onclick = closeModal;
}

document.getElementById('enterNameForm').onsubmit = function () {
  setName(document.getElementById('nameInput').value);
};

document.getElementById('singlePlayerButton').onclick = function () {
  if (Module.INITIALIZED)
    Module._ToggleSinglePlayer();
};

document.getElementById('chatButton').onclick = function () {
  this.classList.toggle('toggled');
  document.getElementById('layout').classList.toggle('hideChat');
  onResize();
  config.disableChat = this.classList.contains('toggled');
  updateConfig(config);
};

document.getElementById('immersionModeButton').onclick = function () {
  this.classList.toggle('toggled');
  const toggled = this.classList.contains('toggled');
  if (toggled) {
    document.querySelector('.chatboxTab[data-tab-section="chat"]').click();
    document.getElementById('chatTabMap').click();
  }
  document.getElementById('layout').classList.toggle('immersionMode', toggled);
  onResize();
  config.immersionMode = toggled;
  updateConfig(config);
};

document.getElementById('globalMessageButton').onclick = function () {
  this.classList.toggle('toggled');
  const chatInput = document.getElementById('chatInput');
  const toggled = this.classList.contains('toggled');
  if (toggled)
    chatInput.dataset.global = true;
  else
    delete chatInput.dataset.global;
  chatInput.disabled = toggled && document.getElementById('chatInputContainer').classList.contains('globalCooldown');
  config.globalMessage = toggled;
  updateConfig(config);
};

if (hasUiThemes) {
  config.uiTheme = 'Default';

  document.getElementById('uiThemeButton').onclick = () => openModal('uiThemesModal');

  const uiThemes = document.querySelectorAll('.uiTheme');

  for (uiTheme of uiThemes)
    uiTheme.onclick = onSelectUiTheme;
}

config.fontStyle = 0;

document.querySelector('.fontStyle').onchange = function () {
  setFontStyle(parseInt(this.value));
};

document.getElementById('uploadButton').onclick = function () {
  let saveFile = document.getElementById('saveFile');
  if (saveFile)
    saveFile.remove();

  saveFile = document.createElement('input');
  saveFile.type = 'file';
  saveFile.id = 'saveFile';
  saveFile.style.display = 'none';
  saveFile.addEventListener('change', handleSaveFileUpload);
  saveFile.click();
};

document.getElementById('downloadButton').onclick = handleSaveFileDownload;

document.getElementById('clearChatButton').onclick = function () {
  const chatbox = document.getElementById('chatbox');
  const messagesElement = document.getElementById('messages');
  const globalFiltered = chatbox.classList.contains('global');
  if (globalFiltered || chatbox.classList.contains('map')) {
    const messages = messagesElement.querySelectorAll(`.messageContainer${globalFiltered ? '.global' : ':not(.global)'}`);
    for (let message of messages)
      message.remove();
  } else {
    messagesElement.innerHTML = '';

    const unreadChatTab = document.querySelector('.chatTab.unread');
    if (unreadChatTab)
      unreadChatTab.classList.remove('unread');
  }
};

document.getElementById('settingsButton').onclick = () => openModal('settingsModal');

document.getElementById('lang').onchange = function () {
  setLang(this.value);
};

document.getElementById('nametagButton').onclick = function () {
  if (Module.INITIALIZED)
    Module._ToggleNametags();
};

document.getElementById('playerSoundsButton').onclick = function () {
  if (Module.INITIALIZED)
    Module._TogglePlayerSounds();
};

document.getElementById('nexusButton').onclick = function () {
  window.location = '../';
};

if (gameId === '2kki') {
  document.getElementById('2kkiVersion').innerText = document.querySelector('meta[name="2kkiVersion"]').content || '?';
  // Yume 2kki Explorer doesn't support mobile
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches)
    document.getElementById('explorerControls').remove();
  locationCache = {};
  mapCache = {};
  config.locationCache = {};
  config.mapCache = {};
}

Array.from(document.querySelectorAll('.playerCountLabel')).forEach(pc => {
  pc.onclick = function () {
    const playerCountLabels = document.querySelectorAll('.playerCountLabel');
    for (let pcl of playerCountLabels)
      pcl.classList.toggle('hidden');
    onUpdateChatboxInfo();
  };
});

let activeChatboxTabSection = 'chat';

function onClickChatboxTab() {
  if (this.dataset.tabSection !== activeChatboxTabSection) {
    activeChatboxTabSection = this.dataset.tabSection;
    if (activeChatboxTabSection === 'chat')
      document.getElementById("unreadMessageCountContainer").classList.add('hidden');
    for (let tab of document.getElementsByClassName('chatboxTab'))
      tab.classList.toggle('active', tab === this);
    for (let tabSection of document.getElementsByClassName('chatboxTabSection'))
      tabSection.classList.toggle('hidden', tabSection.id !== activeChatboxTabSection);
  }
}

for (let tab of document.getElementsByClassName('chatboxTab'))
  tab.onclick = onClickChatboxTab;

function onClickChatTab() {
  const tabIndex = Array.prototype.indexOf.call(this.parentNode.children, this);
  if (tabIndex !== config.chatTabIndex) {
    const chatbox = document.getElementById('chatbox');
    const messages = document.getElementById('messages');
    const chatInput = document.getElementById('chatInput');
    for (let chatTab of document.getElementsByClassName('chatTab')) {
      const active = chatTab === this;
      chatTab.classList.toggle('active', active);
      if (active || !tabIndex)
        chatTab.classList.remove('unread');
    }
    const global = (!tabIndex && config.globalMessage) || tabIndex === 2;
    if (global)
      chatInput.dataset.global = true;
    else
      delete chatInput.dataset.global;
    chatInput.disabled = global && document.getElementById('chatInputContainer').classList.contains('globalCooldown');
    chatbox.classList.toggle('map', tabIndex === 1);
    chatbox.classList.toggle('global', tabIndex === 2);
    messages.scrollTop = messages.scrollHeight;
    config.chatTabIndex = tabIndex;
    updateConfig(config);
  }
}

for (let chatTab of document.getElementsByClassName('chatTab'))
  chatTab.onclick = onClickChatTab;

let ignoreSizeChanged = false;

function onResize() {
  const content = document.getElementById('content');
  const layout = document.getElementById('layout');

  const downscale = window.innerWidth < 704 || window.innerHeight < 577;
  const downscale2 = window.innerWidth < 544 || window.innerHeight < 457;

  content.classList.toggle('noSideBorders', window.innerWidth < 384);

  onUpdateChatboxInfo();

  if (window.innerWidth < window.innerHeight) {
    content.classList.toggle('downscale', downscale);
    content.classList.toggle('downscale2', downscale2);
    layout.classList.toggle('overflow', isOverflow(downscale2 ? 0.5 : downscale ? 0.75 : 1));
  } else {
    const overflow = isOverflow();
    if (overflow !== isOverflow(0.75)) {
      content.classList.toggle('downscale', downscale || overflow);
      content.classList.remove('downscale2');
      layout.classList.toggle('overflow', !overflow);
    } else if (overflow !== isOverflow(0.5)) {
      content.classList.toggle('downscale', downscale || overflow);
      content.classList.toggle('downscale2', downscale2 || overflow);
      layout.classList.toggle('overflow', !overflow);
    } else {
      content.classList.toggle('downscale', downscale);
      content.classList.toggle('downscale2', downscale2);
      layout.classList.toggle('overflow', overflow);
    }
  }

  updateCanvasFullscreenSize();
}

function onUpdateChatboxInfo() {
  const layout = document.getElementById('layout');

  const chatboxContainer = document.getElementById('chatboxContainer');
  const chatboxInfo = document.getElementById('chatboxInfo');
  const chatboxTabs = document.getElementsByClassName('chatboxTab');

  const backgroundSize = chatboxContainer.classList.contains('fullBg') ? window.getComputedStyle(chatboxContainer).backgroundSize : null;

  for (let tab of chatboxTabs) {
    tab.style.backgroundSize = backgroundSize;
    tab.style.backgroundPositionX = `${-8 + tab.parentElement.offsetLeft - tab.offsetLeft}px`;
    tab.style.backgroundPositionY = `${chatboxContainer.offsetTop - tab.parentElement.offsetTop}px`;
  }

  if (!layout.classList.contains('immersionMode') && window.getComputedStyle(layout).flexWrap === 'wrap') {
    const lastTab = chatboxTabs[chatboxTabs.length - 1];
    const offsetLeft = `${(lastTab.offsetLeft + lastTab.offsetWidth) - 24}px`;
    chatboxInfo.style.marginLeft = offsetLeft;
    chatboxInfo.style.marginBottom = '-32px';
    if (chatboxInfo.offsetHeight >= 72)
      chatboxInfo.setAttribute('style', '');
  } else
    chatboxInfo.setAttribute('style', '');
}

function isOverflow(scale) {
  return window.innerWidth < 984 && window.innerHeight <= 594 && (window.innerWidth <= 704 || document.getElementById('gameContainer').offsetWidth < (640 * (scale || 1)) + (document.getElementById('layout').classList.contains('overflow') ? 288 : 0));
}

function updateCanvasFullscreenSize() {
  const contentElement = document.getElementById('content');
  const layoutElement = document.getElementById('content');
  const canvasElement = document.getElementById('canvas');
  const canvasContainerElement = document.getElementById('canvasContainer');
  const chatboxContainerElement = document.getElementById('chatboxContainer');
  const messages = document.getElementById('messages');

  let canvasContainerHeight = null;
  let canvasContainerPaddingRight = null;
  let canvasContainerMarginTop = null;
  let chatboxContainerMarginTop = null;
  let chatboxHeight = null;
  let chatboxOverlap = false;
  let leftControlsMaxHeight = null;
  
  if (document.fullscreenElement) {
    const showChat = !layoutElement.classList.contains('hideChat');
    let scaleX = window.innerWidth / canvasElement.offsetWidth;
    let scaleY = window.innerHeight / canvasElement.offsetHeight;
    const scaleFraction = contentElement.classList.contains('downscale') ? 0.25 : 0.5;
    scaleX -= scaleX % scaleFraction;
    scaleY -= scaleY % scaleFraction;
    const scale = Math.max(Math.min(scaleX, scaleY), 0.5);
    canvasElement.style.transform = `scale(${scale})`;

    if (window.innerWidth > 1050 || window.innerHeight < 595) {
      const chatboxContainerWidth = chatboxContainerElement.offsetWidth - 24;
      chatboxContainerMarginTop = '24px';
      if (chatboxContainerWidth + 48 <= window.innerWidth - (canvasElement.offsetWidth * scale)) {
        if (showChat) {
          canvasContainerPaddingRight = `${chatboxContainerWidth}px`;
          leftControlsMaxHeight = `${canvasElement.offsetHeight * scale}px`;
        }
      } else
        chatboxOverlap = true;
    } else {
      const canvasScaledHeight = canvasElement.offsetHeight * scale;
      const unusedHeight = window.innerHeight - (canvasScaledHeight + 32);
      if (unusedHeight >= 376 && showChat) {
        canvasContainerMarginTop = `-${(window.innerHeight - canvasScaledHeight) / 2}px`
        chatboxContainerMarginTop = `${(window.innerHeight - unusedHeight) - 40}px`;
        chatboxHeight = `${unusedHeight}px`;
        leftControlsMaxHeight = `${canvasScaledHeight}px`;
      } else {
        chatboxContainerMarginTop = '24px';
        if (showChat)
          chatboxOverlap = true;
      }
    }
  } else {
    canvasElement.style.transform = null;
    canvasContainer.style.paddingRight = null;
    leftControlsMaxHeight = `${canvasElement.offsetHeight}px`;
  }

  canvasContainerElement.style.height = canvasContainerHeight;
  canvasContainerElement.style.paddingRight = canvasContainerPaddingRight;
  canvasContainerElement.style.marginTop = canvasContainerMarginTop;
  chatboxContainerElement.style.marginTop = chatboxContainerMarginTop;
  layoutElement.classList.toggle('chatboxOverlap', chatboxOverlap);
  document.getElementById('chatbox').style.height = chatboxHeight;
  document.getElementById('leftControls').style.maxHeight = leftControlsMaxHeight;

  messages.scrollTop = messages.scrollHeight;
}

window.onresize = function () { window.setTimeout(onResize, 0); };

document.addEventListener('fullscreenchange', updateCanvasFullscreenSize);

function toggleControls(show) {
  document.getElementById('controls').classList.toggle('fshidden', !show);
}

let fullscreenControlsTimer;

function setFullscreenControlsHideTimer() {
  if (fullscreenControlsTimer)
    clearInterval(fullscreenControlsTimer);
  fullscreenControlsTimer = setTimeout(function () {
    if (!document.querySelector("#controls button:hover"))
      toggleControls(false);
    fullscreenControlsTimer = null;
  }, 5000);
}

document.onmousemove = function () {
  if (document.fullscreenElement) {
    toggleControls(true);
    setFullscreenControlsHideTimer();
  }
};

window.onbeforeunload = function () {
  return localizedMessages.leavePage;
};

function setLang(lang, isInit) {
  globalConfig.lang = lang;
  if (isInit && gameId === '2kki')
    Module.EASYRPG_LANGUAGE = !gameDefaultLangs.hasOwnProperty(gameId) || gameDefaultLangs[gameId] !== lang ? lang : 'default';
  initLocalization(isInit);
  if (!isInit)
    updateConfig(globalConfig, true);
}

function setName(name, isInit) {
  globalConfig.name = name;
  if (!isInit)
    updateConfig(globalConfig, true);
}

function onSelectUiTheme(e) {
  setUiTheme(e.target.dataset.uiTheme);
}

function handleSaveFileUpload(evt) {
  const save = evt.target.files[0];

  if (!/^Save\d{2}\.lsd$/.test(save.name)) {
    alert(localizedMessages.io.upload.invalidSaveFile);
    document.getElementById('uploadButton').click();
    return;
  }

  const saveSlot = getSaveSlot();

  if (saveSlot == null)
    return;

  const request = indexedDB.open(`/easyrpg/${gameId}/Save`);

  request.onsuccess = function (_e) {

    const reader = new FileReader();
    let readerResult;

    reader.onload = function (file) {
      readerResult = file.currentTarget.result;
      const saveFile = { timestamp: new Date(), mode: 33206, contents: new Uint8Array(readerResult) };
  
      const db = request.result; 
      const transaction = db.transaction(['FILE_DATA'], 'readwrite');
      transaction.objectStore('FILE_DATA').put(saveFile, `/easyrpg/${gameId}/Save/Save${saveSlot}.lsd`);

      window.location = window.location;
    };

    reader.readAsArrayBuffer(save);
  };
}

function handleSaveFileDownload() {
  const request = indexedDB.open(`/easyrpg/${gameId}/Save`);

  request.onsuccess = function (_e) {
    const saveSlot = getSaveSlot(true);

    if (saveSlot == null)
      return;

    const db = request.result; 
    const transaction = db.transaction(['FILE_DATA'], 'readwrite');
    const objectStore = transaction.objectStore('FILE_DATA');
    const objectStoreRequest = objectStore.get(`/easyrpg/${gameId}/Save/Save${saveSlot}.lsd`);

    objectStoreRequest.onsuccess = function (_e) {
      const record = objectStoreRequest.result;

      if (!record) {
        alert(localizedMessages.io.download.emptySlot);
        return;
      }

      const blob = new Blob([record.contents], {type: 'text/json'});
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Save${saveSlot}.lsd`;
      link.click();
      link.remove();
    };
  };
}

function getSaveSlot(download) {
  let fileIndex = prompt(localizedMessages.io[download ? 'download' : 'upload'].slotInput, 1);
  let fileIndexInt;

  while (fileIndex != null && !/^\d+$/.test(fileIndex) || (fileIndexInt = parseInt(fileIndex)) < 1 || fileIndexInt > 15)
    fileIndex = prompt(localizedMessages.io.common.failedSlotInput);

  if (fileIndex == null)
    return null;

  return fileIndexInt < 10 ? `0${fileIndexInt}` : fileIndexInt.toString();
}

function initLocalization(isInitial) {
  document.getElementsByTagName('html')[0].lang = globalConfig.lang;
  fetch(`lang/${globalConfig.lang}.json`)
    .then(function (response) {
      return response.json();
    })
    .then(function (jsonResponse) {
      const version = jsonResponse.version[gameId];
      if (version) {
        const versionElement = document.querySelector('.version');
        const versionMeta = document.querySelector(`meta[name="${gameId}Version"]`);
        if (versionElement && versionMeta) {
          const substituteKeys = Object.keys(version.substitutes);
          let versionLabel = version.label.replace('{VERSION}', versionMeta.content || '?');
          for (let sk of substituteKeys)
            versionLabel = versionLabel.replace(sk, version.substitutes[sk]);
          versionElement.innerHTML = getMassagedLabel(versionLabel);
        }
      }

      massageLabels(jsonResponse.ui);

      localizedMessages = jsonResponse.messages;
      
      if (isInitial)
        onUpdateConnectionStatus(0);
      else {
        if (connStatus !== undefined)
          onUpdateConnectionStatus(connStatus);
        if (playerCount !== undefined)
          updatePlayerCount(playerCount);
      }

      if (isInitial)
        initLocations(globalConfig.lang);
      else if (localizedMapLocations)
        initLocalizedMapLocations(globalConfig.lang);

      const translationComplete = jsonResponse.translationComplete === '1';
      const translationInstruction = document.getElementById('translationInstruction');
      translationInstruction.classList.toggle('hidden', translationComplete);
      if (!translationComplete)
        document.getElementById('translationLink').href = `https://github.com/ynoproject/forest-orb/edit/master/lang/${globalConfig.lang}.json`;

      const resourcesJson = {};
      resourcesJson[globalConfig.lang] = { translation: jsonResponse.ui };
      i18next.init({
        lng: globalConfig.lang,
        resources: resourcesJson,
        preventValueFromContent: false
      }, function (err) {
        if (err)
          console.error(err);
        locI18next.init(i18next)('[data-i18n]');
      });
    });
}

function initLocations(lang) {
  fetch(`locations/${gameId}/config.json`)
    .then(response => {
        if (!response.ok)
          throw new Error('Location config file not found');
        return response.json();
    })
    .then(jsonResponse => {
        ignoredMapIds = jsonResponse.ignoredMapIds || [];
        locationUrlRoot = jsonResponse.urlRoot;
        localizedLocationUrlRoot = locationUrlRoot;
        mapLocations = jsonResponse.mapLocations || null;
        if (mapLocations && !Object.keys(mapLocations).length)
          mapLocations = null;
        if (mapLocations) {
          massageMapLocations(mapLocations, jsonResponse.locationUrlTitles || null);
          if (lang === 'en')
            localizedMapLocations = mapLocations;
          else
            initLocalizedMapLocations(lang);
        }
    })
    .catch(err => {
      ignoredMapIds = [];
      localizedMapLocations = null;
      console.error(err);
    });
}

function initLocalizedMapLocations(lang) {
  const fileName = lang === 'en' ? 'config' : lang;
  fetch(`locations/${gameId}/${fileName}.json`)
    .then(response => {
      if (!response.ok) {
        localizedMapLocations = mapLocations;
        return null; // Assume map location localizations for this language don't exist
      }
      return response.json();
  })
  .then(jsonResponse => {
      if (!jsonResponse)
        return;
      localizedLocationUrlRoot = jsonResponse.urlRoot;
      localizedMapLocations = {};
      const langMapLocations = jsonResponse.mapLocations;
      massageMapLocations(langMapLocations, jsonResponse.locationUrlTitles || null);
      Object.keys(mapLocations).forEach(function (mapId) {
        const mapLocation = langMapLocations[mapId];
        if (mapLocation)
          localizedMapLocations[mapId] = mapLocation;
        else
          localizedMapLocations[mapId] = mapLocations[mapId];
      });
  })
  .catch(_err => { }); // Assume map location localizations for this language don't exist
}

function getMapLocationsArray(mapLocations, mapId, prevMapId) {
  if (mapLocations.hasOwnProperty(mapId)) {
    const locations = mapLocations[mapId];
    if (locations.hasOwnProperty('title')) // Text location
      return [ locations ];
    if (Array.isArray(locations)) // Multiple locations
      return locations;
    if (locations.hasOwnProperty(prevMapId)) {// Previous map ID matches a key
      if (Array.isArray(locations[prevMapId]))
        return locations[prevMapId];
      return [ locations[prevMapId] ];
    }
    if (locations.hasOwnProperty('else')) { // Else case
      if (locations.else.hasOwnProperty('title'))
        return [ locations.else ];
      if (Array.isArray(locations.else))
        return locations.else;
    }
  }
}

function getLocalizedMapLocations(mapId, prevMapId, separator) {
  if (localizedMapLocations.hasOwnProperty(mapId)) {
    const localizedLocations = localizedMapLocations[mapId];
    const locations = mapLocations[mapId];
    if (localizedLocations.hasOwnProperty('title')) // Text location
      return getLocalizedLocation(localizedLocations, locations);
    if (Array.isArray(localizedLocations)) // Multiple locations
      return localizedLocations.map((l, i) => getLocalizedLocation(l, locations[i])).join(separator);
    if (localizedLocations.hasOwnProperty(prevMapId)) { // Previous map ID matches a key
      if (Array.isArray(localizedLocations[prevMapId]))
        return localizedLocations[prevMapId].map((l, i) => getLocalizedLocation(l, locations[prevMapId][i])).join(separator);
      return getLocalizedLocation(localizedLocations[prevMapId], locations[prevMapId]);
    }
    if (localizedLocations.hasOwnProperty('else')) { // Else case
      if (localizedLocations.else.hasOwnProperty('title'))
        return getLocalizedLocation(localizedLocations.else, locations.else);
      if (Array.isArray(localizedLocations.else))
        return localizedLocations.else.map((l, i) => getLocalizedLocation(l, locations.else[i])).join(separator);
    }
  }
  
  return localizedMessages.location.unknownLocation;
}

function getLocalizedMapLocationsHtml(mapId, prevMapId, separator) {
  if (localizedMapLocations.hasOwnProperty(mapId)) {
    const localizedLocations = localizedMapLocations[mapId];
    const locations = mapLocations[mapId];
    let locationsHtml;
    if (localizedLocations.hasOwnProperty('title')) // Text location
      locationsHtml = getLocalizedLocation(localizedLocations, locations, true);
    else if (Array.isArray(localizedLocations)) // Multiple locations
      locationsHtml = localizedLocations.map((l, i) => getLocalizedLocation(l, locations[i], true)).join(separator);
    else if (localizedLocations.hasOwnProperty(prevMapId)) { // Previous map ID matches a key
      if (Array.isArray(localizedLocations[prevMapId]))
        locationsHtml = localizedLocations[prevMapId].map((l, i) => getLocalizedLocation(l, locations[prevMapId][i], true)).join(separator);
      else
        locationsHtml = getLocalizedLocation(localizedLocations[prevMapId], locations[prevMapId], true);
    } else if (localizedLocations.hasOwnProperty('else')) {  // Else case
      if (localizedLocations.else.hasOwnProperty('title'))
        locationsHtml = getLocalizedLocation(localizedLocations.else, locations.else, true);
      else if (Array.isArray(localizedLocations.else))
        locationsHtml = localizedLocations.else.map((l, i) => getLocalizedLocation(l, locations.else[i], true)).join(separator);
    }

    if (locationsHtml)
      return locationsHtml;
  }
  
  return getInfoLabel(getMassagedLabel(localizedMessages.location.unknownLocation));
}

function massageMapLocations(mapLocations, locationUrlTitles) {
  if (Array.isArray(mapLocations)) {
    for (let l = 0; l < mapLocations.length; l++) {
      const mapLocation = mapLocations[l];
      if (typeof mapLocation === 'string') {
        mapLocations[l] = { title: mapLocation };
        if (locationUrlTitles?.hasOwnProperty(mapLocation))
          mapLocations[l].urlTitle = locationUrlTitles[mapLocation];
      }
    }
  } else {
    if (mapLocations.hasOwnProperty('title')) {
      if (locationUrlTitles?.hasOwnProperty(mapLocations.title))
        mapLocations.urlTitle = locationUrlTitles[mapLocations.title];
      return;
    }
    for (let mapId of Object.keys(mapLocations)) {
      const mapLocation = mapLocations[mapId];
      if (typeof mapLocation === 'string') {
        mapLocations[mapId] = { title: mapLocation };
        if (locationUrlTitles?.hasOwnProperty(mapLocation))
          mapLocations[mapId].urlTitle = locationUrlTitles[mapLocation];
      } else
        massageMapLocations(mapLocation);
    }
  }
}

function getLocalizedLocation(location, locationEn, asHtml) {
  let template = getMassagedLabel(localizedMessages.location.template);
  let ret;
  let locationValue;

  if (asHtml) {
    template = template.replace(/(?:})([^{]+)/g, '}<span class="infoLabel">$1</span>');
    if (localizedLocationUrlRoot && location.urlTitle !== null)
      locationValue = `<a href="${localizedLocationUrlRoot}${location.urlTitle || location.title}" target="_blank">${location.title}</a>`;
    else if (locationUrlRoot && localizedLocationUrlRoot !== null && locationEn.urlTitle !== null)
      locationValue = `<a href="${locationUrlRoot}${locationEn.urlTitle || locationEn.title}" target="_blank">${location.title}</a>`;
    else
      locationValue = getInfoLabel(location.title);
  } else
    locationValue = location.title;

  ret = template.replace('{LOCATION}', locationValue);
  
  if (template.indexOf('{LOCATION_EN}') > -1) {
    let locationValueEn;
    if (asHtml) {
      if (locationUrlRoot && locationEn.urlTitle !== null)
        locationValueEn = `<a href="${locationUrlRoot}${locationEn.urlTitle || locationEn.title}" target="_blank">${locationEn.title}</a>`;
      else
        locationValueEn = getInfoLabel(locationEn.title);
    } else
      locationValueEn = locationEn.title;
    
    ret = locationValue !== locationValueEn
      ? ret.replace('{LOCATION_EN}', locationValueEn)
      : locationValue; // Just use location value alone if values match
  }

  return ret;
}

function massageLabels(data) {
  if (langLabelMassageFunctions.hasOwnProperty(globalConfig.lang) && data) {
    Object.keys(data).forEach(function (key) {
      if (key === 'tooltips')
        return;
      const value = data[key];
      if (value) {
        switch (typeof value) {
          case 'object':
            massageLabels(value);
            break;
          case 'string':
            data[key] = getMassagedLabel(value, true);
            break;
        }
      }
    });
  }
}

function getMassagedLabel(label, isUI) {
  if (langLabelMassageFunctions.hasOwnProperty(globalConfig.lang) && label)
    return langLabelMassageFunctions[globalConfig.lang](label, isUI);
  return label;
}

function getInfoLabel(label) {
  return `<span class="infoLabel">${label}</span>`;
}

let loadedLang = false;
let loadedUiTheme = false;
let loadedFontStyle = false;

function loadOrInitConfig(configObj, global) {
  try {
    const configKey = global ? 'config' : `config_${gameId}`;
    if (!window.localStorage.hasOwnProperty(configKey))
      window.localStorage.setItem(configKey, JSON.stringify(configObj));
    else {
      const savedConfig = JSON.parse(window.localStorage.getItem(configKey));
      const savedConfigKeys = Object.keys(savedConfig);
      for (let k in savedConfigKeys) {
        const key = savedConfigKeys[k];
        if (configObj.hasOwnProperty(key)) {
          let value = savedConfig[key];
          if (global) {
            switch (key) {
              case 'lang':
                document.getElementById('lang').value = value;
                setLang(value, true);
                loadedLang = true;
                break;
              case 'name':
                document.getElementById('nameInput').value = value;
                setName(value, true);
                break;
            }
          } else {
            switch (key) {
              case 'singlePlayer':
                if (value)
                  preToggle(document.getElementById('singlePlayerButton'));
                break;
              case 'disableChat':
                if (value)
                  document.getElementById('chatButton').click();
                break;
              case 'disableNametags':
                if (value)
                  preToggle(document.getElementById('nametagButton'));
                break;
              case 'disablePlayerSounds':
                if (value)
                  preToggle(document.getElementById('playerSoundsButton'));
                break;
              case 'immersionMode':
                if (value)
                  document.getElementById('immersionModeButton').click();
                break;
              case 'chatTabIndex':
                if (value) {
                  const chatTab = document.querySelector(`.chatTab:nth-child(${value + 1})`);
                  if (chatTab)
                    chatTab.click();
                }
                break;
              case 'globalMessage':
                if (value)
                  document.getElementById('globalMessageButton').click();
                break;
              case 'uiTheme':
                if (hasUiThemes && gameUiThemes.indexOf(value) > -1) {
                  if (hasUiThemes)
                    document.querySelector('.uiTheme').value = value;
                  setUiTheme(value, true);
                  loadedUiTheme = true;
                }
                break;
              case 'fontStyle':
                if (hasUiThemes && gameUiThemes.indexOf(value) > -1) {
                  document.querySelector('.fontStyle').value = value;
                  setFontStyle(value, true);
                  loadedFontStyle = true;
                }
                break;
              case 'locationCache':
                locationCache = Object.assign({}, value);
                break;
              case 'mapCache':
                mapCache = Object.assign({}, value);
                break;
            }
          }
          configObj[key] = value;
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
}

function updateConfig(configObj, global) {
  try {
    window.localStorage[global ? 'config' : `config_${gameId}`] = JSON.stringify(configObj);
  } catch (error) {
  }
}

onResize();

loadOrInitConfig(globalConfig, true);
loadOrInitConfig(config);

fetchAndUpdatePlayerCount();
window.setInterval(fetchAndUpdatePlayerCount, 15000);

if (!loadedFontStyle)
  setFontStyle(0, true);
if (!loadedUiTheme)
  setUiTheme('auto', true);
if (!loadedLang) {
  const browserLang = navigator.language.indexOf('-') === -1 ? navigator.language : navigator.language.slice(0, navigator.language.indexOf('-'));
  setLang(Array.from(document.getElementById('lang').children).map(e => e.value).indexOf(browserLang) > -1 ? browserLang : 'en', true);
}