let localizedMessages;

let localizedMapLocations;
let mapLocations;
let localizedLocationUrlRoot;
let locationUrlRoot;

let gameLocalizedMapLocations = {};
let gameMapLocations = {};
let gameLocalizedLocationUrlRoots = {};
let gameLocationUrlRoots = {};
let gameLocalizedLocationsMap = {};
let gameLocationsMap = {};

let yumeWikiSupported;

const langLabelMassageFunctions = {
  'ja': (value, isUI) => {
    if (isUI && value.indexOf(' ') > -1)
      return value.split(/ +/g).map(v => `<span class="nowrap">${v}</span>`).join('');
    return value;
  }
};

let globalConfig = {
  lang: 'en',
  name: '',
  soundVolume: 100,
  musicVolume: 100,
  chatTipIndex: -1,
  tabToChat: true,
  mapChatHistoryLimit: 100,
  globalChatHistoryLimit: 100,
  partyChatHistoryLimit: 250,
  locationDisplay: false,
  hideRankings: false,
  screenshotFix: false,
  rulesReviewed: false,
  badgeToolsData: null
};

let config = {
  singlePlayer: false,
  disableChat: false,
  mute: false,
  nametagMode: 1,
  disablePlayerSounds: false,
  immersionMode: false,
  chatTabIndex: 0,
  playersTabIndex: 0,
  globalMessage: false,
  hideGlobalMessageLocations: false,
  hideOwnGlobalMessageLocation: false,
  lastEventLocations: null
};

const CACHE_TYPE = {
  location: 'location',
  map: 'map',
  locationColor: 'locationColor'
};

let cache = Object.fromEntries(Object.keys(CACHE_TYPE).map(ct => [ ct, {} ]));

let locationCache;
let mapCache;
let locationColorCache;

let ynomojiConfig = {};

let connStatus;

// EXTERNAL
function onUpdateConnectionStatus(status) {
  if (config.singlePlayer && (status !== 3 || connStatus === 3))
    return;

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
    setTimeout(function () {
      if (connStatus === status)
        updateStatusText();
    }, 500);
  else
    updateStatusText();

  connStatus = status;

  if (status === 1) {
    addOrUpdatePlayerListEntry(null, systemName, playerName, defaultUuid, false, true);
    if (eventPeriodCache)
      updateEvents();
    syncPrevLocation();
  } else {
    playerUuids = {};
    clearPlayerLists();
  }
}

// EXTERNAL
function onRoomSwitch() {
  syncPrevLocation();
  clearPlayerLists();
  addOrUpdatePlayerListEntry(null, systemName, playerName, defaultUuid, false, true);
  checkEventLocations();
}

function fetchAndUpdatePlayerInfo() {
  const cookieSessionId = getCookie(sessionIdKey);
  const isLogin = cookieSessionId && cookieSessionId !== loginToken;
  const isLogout = !cookieSessionId && loginToken && cookieSessionId !== loginToken;
  if (isLogin || isLogout) {
    loginToken = isLogin ? cookieSessionId : null;
    const ptr = Module.allocate(Module.intArrayFromString(isLogin ? loginToken : ''), Module.ALLOC_NORMAL);
    Module._SetSessionToken(ptr);
    Module._free(ptr);
  }
  apiFetch('info')
    .then(response => response.json())
    .then(jsonResponse => {
      if (jsonResponse.uuid) {
        if (jsonResponse.name)
          playerName = jsonResponse.name;
        syncPlayerData(jsonResponse.uuid, jsonResponse.rank, !!loginToken, jsonResponse.badge, jsonResponse.medals, -1);
        badgeSlotRows = jsonResponse.badgeSlotRows || 1;
        badgeSlotCols = jsonResponse.badgeSlotCols || 3;
        if (isLogin) {
          initSessionWs()
            .then(() => {
              trySetChatName(playerName);
              showAccountToastMessage('loggedIn', 'join', getPlayerName(playerData, true, false, true));
              updateBadges(() => {
                updateBadgeButton();
                // Initialize event period after initial badge cache population due to ExP rank badge dependency
                if (!eventPeriodCache)
                  updateEventPeriod();
              });
              if (eventPeriodCache)
                updateEvents();
              document.getElementById('content').classList.add('loggedIn');
            });
        } else {
          initSessionWs()
            .then(() => {
              trySetChatName('');
              if (isLogout) {
                showAccountToastMessage('loggedOut', 'leave');
                document.getElementById('content').classList.remove('loggedIn');
              }
            });
        }
        if (document.querySelector('#chatboxTabParties.active'))
          updatePartyList(true);
        else
          fetchAndUpdateJoinedPartyId();
      } else if (isLogin) {
        setCookie(sessionIdKey, '');
        fetchAndUpdatePlayerInfo();
      }
    })
    .catch(err => console.error(err));
}

function checkLogin() {
  if (loginToken && loginToken === getCookie(sessionIdKey)) {
    apiFetch('info')
      .then(response => response.json())
      .then(jsonResponse => {
        if (!jsonResponse.uuid) {
          setCookie(sessionIdKey, '');
          fetchAndUpdatePlayerInfo();
        }
      })
      .catch(err => console.error(err));
  }
}

let playerCount;

(function () {
  addSessionCommandHandler('pc', args => updatePlayerCount(parseInt(args[0])));
  addSessionCommandHandler('lcol');
})();

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
let tpX = -1;
let tpY = -1;
let ignoredMapIds = [];
let mapCheckTimer;

// EXTERNAL
function onLoadMap(mapName) {
  if (mapCheckTimer)
    clearTimeout(mapCheckTimer);
  mapCheckTimer = setTimeout(() => {
    mapCheckTimer = null;
    let mapIdMatch = /^Map(\d{4})\.lmu$/.exec(mapName);
    if (mapIdMatch) {
      const mapId = mapIdMatch[1];

      if (mapId === cachedMapId || ignoredMapIds.indexOf(mapId) > -1)
        return;

      markMapUpdateInChat();

      if (gameId === '2kki' && (!localizedMapLocations || !localizedMapLocations.hasOwnProperty(mapId)))
        onLoad2kkiMap(mapId);
      else
        checkUpdateLocation(mapId, true);
    }
  }, 0);
}

function checkUpdateLocation(mapId, mapChanged) {
  if (!mapChanged && (!localizedMapLocations || !localizedMapLocations.hasOwnProperty(mapId)))
    return;

  const is2kki = gameId === '2kki';

  if (localizedMapLocations) {
    if (!cachedMapId)
      document.getElementById('location').classList.remove('hidden');

    document.getElementById('locationText').innerHTML = getLocalizedMapLocationsHtml(gameId, mapId, cachedMapId, tpX, tpY, '<br>');
    onUpdateChatboxInfo();

    if (is2kki) {
      cachedPrev2kkiLocations = cached2kkiLocations;
      cached2kkiLocations = null;
    }
  }

  cachedPrevMapId = cachedMapId;
  cachedMapId = mapId;

  if (localizedMapLocations) {
    const locations = getMapLocationsArray(mapLocations, cachedMapId, cachedPrevMapId, tpX, tpY);
    if (!locations || !cachedLocations || JSON.stringify(locations) !== JSON.stringify(cachedLocations)) {
      if (!mapChanged)
        markMapUpdateInChat();
      addChatMapLocation(locations);

      if (is2kki) {
        const locationNames = locations ? locations.filter(l => !l.hasOwnProperty('explorer') || l.explorer).map(l => l.title) : [];
        set2kkiExplorerLinks(locationNames);
        if (locationNames.length)
          queryAndSet2kkiMaps(locationNames).catch(err => console.error(err));
        else {
          setMaps([], null);
          set2kkiExplorerLinks(null);
        }
      } else if (yumeWikiSupported) {
        const locationNames = locations.map(l => l.title);
        if (mapCache.hasOwnProperty(locationNames.join(',')))
          setMaps(mapCache[locationNames.join(',')], locationNames);
        else
          queryAndSetWikiMaps(locations);
      }
    }

    cachedLocations = locations;

    if (is2kki && playerData?.badge && badgeCache.find(b => b.badgeId === playerData.badge)?.overlayType & BadgeOverlayType.LOCATION)
      updateBadgeButton();
  }
}

let locationDisplayTimer;
let locationDisplayQueue = [];

function updateLocationDisplay(locationHtml, colors) {
  if (!globalConfig.locationDisplay)
    return;

  const locationDisplayContainer = document.getElementById('locationDisplayContainer');
  const locationDisplayLabel = document.getElementById('locationDisplayLabel');
  const locationDisplayLabelOverlay = document.getElementById('locationDisplayLabelOverlay');
  const locationDisplayLabelContainerOverlay = document.getElementById('locationDisplayLabelContainerOverlay');

  if (locationDisplayLabel.innerHTML == locationHtml)
    return;
 
  if (locationDisplayContainer.classList.contains('visible')) {
    locationDisplayQueue.push({ labelHtml: locationHtml, colors: colors });
    hideLocationDisplay(true);
  } else {
    locationDisplayContainer.classList.remove('fast');

    if (colors) {
      locationDisplayLabelOverlay.style.color = colors[0];
      locationDisplayLabelContainerOverlay.style.backgroundColor = colors[1];
    }

    locationDisplayLabelOverlay.classList.toggle('hidden', !colors);
    locationDisplayLabelContainerOverlay.classList.toggle('hidden', !colors);

    locationDisplayLabel.innerHTML = locationHtml;
    locationDisplayLabelOverlay.innerHTML = locationHtml;
    locationDisplayContainer.classList.add('visible');

    locationDisplayTimer = setTimeout(() => {
      locationDisplayTimer = null;
      hideLocationDisplay();
    }, 5000);
  }
}

function hideLocationDisplay(fast) {
  if (fast)
    locationDisplayContainer.classList.add('fast');

  locationDisplayContainer.classList.remove('visible');

  if (locationDisplayTimer) {
    clearTimeout(locationDisplayTimer);
    locationDisplayTimer = null;
  }

  return window.setTimeout(() => {
    if (locationDisplayQueue.length) {
      const locationEntry = locationDisplayQueue.shift();
      updateLocationDisplay(locationEntry.labelHtml, locationEntry.colors);
    }
  }, fast ? 100 : 350);
}

{
  const cancelKeyCodes = [ 'Escape', 'x', 'c', 'v', 'b', 'n' ];

  document.addEventListener('keydown', e => {
    if (globalConfig.locationDisplay && (locationDisplayTimer || locationDisplayQueue.length) && cancelKeyCodes.includes(e.key)) {
      locationDisplayQueue.splice(0, locationDisplayQueue.length);
      hideLocationDisplay(true);
    }
  });
}

function syncPrevLocation() {
  const prevMapId = cachedPrevMapId || '0000';
  const prevLocationsStr = cachedPrev2kkiLocations?.length ? window.btoa(encodeURIComponent(cachedPrev2kkiLocations.map(l => l.title).join('|'))) : '';
  sendSessionCommand('ploc', [ prevMapId, prevLocationsStr ]);
}

// EXTERNAL
function onPlayerTeleported(mapId, x, y) {
  tpX = x;
  tpY = y;
  if (cachedMapId && parseInt(cachedMapId) === mapId)
    checkUpdateLocation(cachedMapId, false);
}

// EXTERNAL
function onReceiveInputFeedback(inputId) {
  if (inputId) {
    let buttonElement;
    let configKey;
    let isGlobal;
    switch (inputId) {
      case 1:
        buttonElement = document.getElementById('playerSoundsButton');
        configKey = 'disablePlayerSounds';
        break;
      case 2:
        buttonElement = document.getElementById('muteButton');
        configKey = 'mute';
        break;
    }
    if (configKey) {
      buttonElement.classList.toggle('toggled');
      const toggled = buttonElement.classList.contains('toggled');
      if (isGlobal)
        globalConfig[configKey] = toggled;
      else
        config[configKey] = toggled;
      updateConfig(isGlobal ? globalConfig : config, isGlobal);
      if (configKey === 'mute') {
        Module._SetSoundVolume(toggled ? 0 : globalConfig.soundVolume);
        Module._SetMusicVolume(toggled ? 0 : globalConfig.musicVolume);
      }
    }
  }
}

// EXTERNAL
function onNametagModeUpdated(mode) {
  config.nametagMode = mode;
  updateConfig(config);
}

function preToggle(buttonElement) {
  buttonElement.classList.add('preToggled');
  const tryToggleTimer = setInterval(function () {
    if (buttonElement.classList.contains('toggled')) {
      buttonElement.classList.remove('preToggled');
      clearInterval(tryToggleTimer);
    } else
      buttonElement.click();
  }, 500);
}

{
  function calcTextareaHeight(value) {
    const numberOfLineBreaks = (value.match(/\n/g) || []).length;
    const newHeight = numberOfLineBreaks * 20 + 38;
    return newHeight;
  }

  const autoExpandTextareas = document.querySelectorAll('textarea.autoExpand');
  for (let textarea of autoExpandTextareas)
    textarea.addEventListener('keyup', function () { this.style.height = `${calcTextareaHeight(textarea.value)}px`; });
}

/**
 * Opens a modal.
 * @param {string} modalId The modal's ID.
 * @param {string} theme The theme for the modal to use. Player-selected or in-game menu theme is used if none is specified.
 * @param {string} lastModalId The previously-opened modal, used when opening sub-modals.
 * @param {Object} modalData Data to be passed to the modal.
 */
function openModal(modalId, theme, lastModalId, modalData) {
  const modalContainer = document.getElementById('modalContainer');
  modalContainer.classList.remove('hidden');

  if (lastModalId) {
    if (modalContainer.dataset.lastModalId) {
      modalContainer.dataset.lastModalId = `${modalContainer.dataset.lastModalId},${lastModalId}`;
      modalContainer.dataset.lastModalTheme = `${modalContainer.dataset.lastModalTheme},${theme || ''}`;
    } else {
      modalContainer.dataset.lastModalId = lastModalId;
      modalContainer.dataset.lastModalTheme = theme || '';
    }
  } else if (modalContainer.dataset.lastModalId) {
    const lastModalIdSeparatorIndex = modalContainer.dataset.lastModalId.lastIndexOf(',');
    if (lastModalIdSeparatorIndex === -1) {
      delete modalContainer.dataset.lastModalId;
      delete modalContainer.dataset.lastModalTheme;
    } else {
      modalContainer.dataset.lastModalId = modalContainer.dataset.lastModalId.slice(0, lastModalIdSeparatorIndex);
      modalContainer.dataset.lastModalTheme = modalContainer.dataset.lastModalTheme.slice(0, modalContainer.dataset.lastModalTheme.lastIndexOf(','));
    }
  }
  const activeModal = document.querySelector('.modal:not(.hidden)');
  if (activeModal && activeModal.id !== modalId)
    activeModal.classList.add('hidden');

  setModalUiTheme(modalId, theme || (config.uiTheme === 'auto' ? systemName : config.uiTheme));

  const modal = document.getElementById(modalId);

  if (modalData) {
    for (let k of Object.keys(modalData))
      modal.dataset[k] = modalData[k];
  }
  modal.classList.remove('hidden');
}

function closeModal() {
  const modalContainer = document.getElementById('modalContainer');
  if (!modalContainer.dataset.lastModalId)
    modalContainer.classList.add('hidden');
  const activeModal = document.querySelector('.modal:not(.hidden)');
  if (activeModal)
    activeModal.classList.add('hidden');
  if (modalContainer.dataset.lastModalId) {
    const lastModalIdSeparatorIndex = modalContainer.dataset.lastModalId.lastIndexOf(',');
    if (lastModalIdSeparatorIndex === -1)
      openModal(modalContainer.dataset.lastModalId, modalContainer.dataset.lastModalTheme);
    else {
      const lastModalThemeSeparatorIndex = modalContainer.dataset.lastModalTheme.lastIndexOf(',');
      openModal(modalContainer.dataset.lastModalId.slice(lastModalIdSeparatorIndex + 1), modalContainer.dataset.lastModalTheme.slice(lastModalThemeSeparatorIndex + 1));
    }
  }
}

{
  const modalCloseButtons = document.querySelectorAll('.modalClose');
  for (let button of modalCloseButtons)
    button.onclick = closeModal;
  document.querySelector('.modalOverlay').onclick = closeModal;
}

document.getElementById('enterNameForm').onsubmit = function () {
  setName(document.getElementById('nameInput').value);
};

{
  const chatInput = document.getElementById('chatInput');
  chatInput.oninput = function () {
    const ynomojiPattern = /:([a-z0-9_\-]+(?::|$)|$)/gi;
    const ynomojiContainer = document.getElementById('ynomojiContainer');
    let currentMatch;
    let match;
    while (currentMatch = ynomojiPattern.exec(this.value.slice(0, this.selectionEnd)))
      match = currentMatch;
    if (match && !match[1].endsWith(':')) {
      const ynomojis = document.getElementsByClassName('ynomojiButton');
      const lcMatch = match[1].toLowerCase();
      let hasMatch = false;
      for (let ynomoji of ynomojis) {
        const ynomojiId = ynomoji.dataset.ynomojiId;
        const matchStrings = [ ynomojiId ];
        const matchPattern = /[A-Z0-9]+/g;
        let matchResult;
        while ((matchResult = matchPattern.exec(ynomojiId)) !== null) {
          if (matchResult.index > 0)
            matchStrings.push(ynomojiId.slice(matchResult.index));
        }
        let visible = false;
        for (let matchString of matchStrings) {
          if (matchString.toLowerCase().startsWith(lcMatch)) {
            visible = true;
            break;
          }
        }
        ynomoji.classList.toggle('hidden', !visible);
        hasMatch |= visible;
      }
      if (lcMatch)
        ynomojiContainer.classList.toggle('hidden', !hasMatch);
      else {
        const currentInputValue = this.value;
        setTimeout(() => {
          if (chatInput.value === currentInputValue)
            ynomojiContainer.classList.remove('hidden');
        }, 1000);
      }
    } else
      ynomojiContainer.classList.add('hidden');
  };

  chatInput.onfocus = function () { this.oninput(); };
  document.getElementById('chatboxContainer').onmouseleave = function () { document.getElementById('ynomojiContainer').classList.add('hidden'); };
}

document.getElementById('singlePlayerButton').onclick = function () {
  this.classList.toggle('toggled');
  document.getElementById('layout').classList.toggle('singlePlayer', this.classList.contains('toggled'));
  config.singlePlayer = this.classList.contains('toggled');
  updateConfig(config);

  if (config.singlePlayer) {
    closeSessionWs();
    onUpdateConnectionStatus(3);
  } else
    initSessionWs();
};

let reconnectCooldownTimer;

document.getElementById('reconnectButton').onclick = function () {
  if (reconnectCooldownTimer || connStatus >= 2)
    return;

  this.classList.add('active');
  this.classList.add('disabled');

  const reconnectButton = this;
  let reconnected;

  closeSessionWs();
  initSessionWs().then(() => {
    reconnected = true;
    reconnectButton.classList.remove('active');
    if (!reconnectCooldownTimer)
      reconnectButton.classList.remove('disabled');
  });

  reconnectCooldownTimer = setTimeout(() => {
    reconnectCooldownTimer = null;
    if (!reconnectButton.classList.contains('active'))
      reconnectButton.classList.remove('disabled');
  }, 5000);
};

document.getElementById('chatButton').onclick = function () {
  this.classList.toggle('toggled');
  document.getElementById('layout').classList.toggle('hideChat');
  onResize();
  config.disableChat = this.classList.contains('toggled');
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

document.getElementById('globalMessageLocationsButton').onclick = function () {
  this.classList.toggle('toggled');
  const toggled = this.classList.contains('toggled');
  document.getElementById('messages').classList.toggle('hideLocations', toggled);
  config.hideGlobalMessageLocations = toggled;
  updateConfig(config);
};

document.getElementById('ownGlobalMessageLocationButton').onclick = function () {
  this.classList.toggle('toggled');
  config.hideOwnGlobalMessageLocation = this.classList.contains('toggled');
  updateConfig(config);
};

document.getElementById('messageTimestampsButton').onclick = function () {
  this.classList.toggle('toggled');
  const toggled = this.classList.contains('toggled');
  document.getElementById('messages').classList.toggle('hideTimestamps', toggled);
  config.hideMessageTimestamps = toggled;
  updateConfig(config);
};

{
  config.uiTheme = 'Default';

  document.getElementById('uiThemeButton').onclick = () => openModal('uiThemesModal');

  const uiThemes = document.querySelectorAll('#uiThemesModal .uiTheme');

  for (uiTheme of uiThemes)
    uiTheme.onclick = onSelectUiTheme;
}

config.fontStyle = 0;

document.querySelector('.fontStyle').onchange = function () {
  setFontStyle(parseInt(this.value));
};

document.getElementById('clearChatButton').onclick = function () {
  const chatbox = document.getElementById('chatbox');
  const messagesElement = document.getElementById('messages');
  const mapFiltered = chatbox.classList.contains('mapChat');
  const globalFiltered = chatbox.classList.contains('globalChat');
  const partyFiltered = chatbox.classList.contains('partyChat');
  const idGlobalMessages = messagesElement.querySelectorAll('.messageContainer.global[data-msg-id]');
  const idPartyMessages = messagesElement.querySelectorAll('.messageContainer.party[data-msg-id]');
  const lastGlobalMessageId = !mapFiltered && !partyFiltered && idGlobalMessages.length ? idGlobalMessages[idGlobalMessages.length - 1].dataset.msgId : null;
  const lastPartyMessageId = !mapFiltered && !globalFiltered && idPartyMessages.length ? idPartyMessages[idPartyMessages.length - 1].dataset.msgId : null;
  if (mapFiltered || globalFiltered || partyFiltered) {
    const messages = messagesElement.querySelectorAll(`.messageContainer${globalFiltered ? '.global' : partyFiltered ? '.party' : ':not(.global):not(.party)'}`);
    for (let message of messages)
      message.remove();
  } else {
    messagesElement.innerHTML = '';

    const unreadChatTab = document.querySelector('.chatTab.unread');
    if (unreadChatTab)
      unreadChatTab.classList.remove('unread');
  }

  if (lastGlobalMessageId || lastPartyMessageId) {
    // Sync last message ID so subsequent reconnects don't repopulate cleared chat history
    apiFetch(`clearchathistory?lastGlobalMsgId=${lastGlobalMessageId || ''}&lastPartyMsgId=${lastPartyMessageId || ''}`)
      .then(response => {
        if (!response.ok)
          console.error(response.statusText);
        return response.text();
      })
      .catch(err => console.error(err));
  }
};

document.getElementById('screenshotButton').onclick = function () {
  const url = canvas.toDataURL();
  const a = document.createElement('a');
  const currentDate = new Date();
  const [month, day, year, hour, minute, second] = [currentDate.getMonth(), currentDate.getDate(), currentDate.getFullYear(), currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds()]
  a.href = url;
  a.download = `ynoproject_${ynoGameId}_screenshot_${year}-${month + 1}-${day}-${hour}-${minute}-${second}`;
  a.click();
};

document.getElementById('settingsButton').onclick = () => openModal('settingsModal');

document.getElementById('muteButton').onclick = function () {
  if (Module.INITIALIZED)
    Module._ToggleMute();
};

document.getElementById('soundVolume').oninput = function () {
  setSoundVolume(parseInt(this.value), true);
};

document.getElementById('soundVolume').onchange = function () {
  setSoundVolume(parseInt(this.value));
};

document.getElementById('musicVolume').oninput = function () {
  setMusicVolume(parseInt(this.value), true);
};

document.getElementById('musicVolume').onchange = function () {
  setMusicVolume(parseInt(this.value));
};

document.getElementById('lang').onchange = function () {
  setLang(this.value);
};

document.getElementById('nametagMode').onchange = function () {
  if (Module.INITIALIZED)
    Module._SetNametagMode(this.value);
};

document.getElementById('playerSoundsButton').onclick = () => {
  if (Module.INITIALIZED)
    Module._TogglePlayerSounds();
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

document.getElementById('locationDisplayButton').onclick = function () {
  this.classList.toggle('toggled');
  globalConfig.locationDisplay = this.classList.contains('toggled');
  updateConfig(globalConfig, true);
};

document.getElementById('toggleRankingsButton').onclick = function () {
  this.classList.toggle('toggled');
  const toggled = this.classList.contains('toggled');
  document.getElementById('rankingsButton').classList.toggle('hidden', toggled);
  globalConfig.hideRankings = toggled;
  updateConfig(globalConfig, true);
};

document.getElementById('screenshotFixButton').onclick = function () {
  this.classList.toggle('toggled');
  globalConfig.screenshotFix = this.classList.contains('toggled');
  updateConfig(globalConfig, true);
};

document.getElementById('tabToChatButton').onclick = function () {
  this.classList.toggle('toggled');
  globalConfig.tabToChat = !this.classList.contains('toggled');
  updateConfig(globalConfig, true);
};

document.getElementById('mapChatHistoryLimit').onchange = function () {
  globalConfig.mapChatHistoryLimit = this.value;
  updateConfig(globalConfig, true);
};

document.getElementById('globalChatHistoryLimit').onchange = function () {
  globalConfig.globalChatHistoryLimit = this.value;
  updateConfig(globalConfig, true);
};

document.getElementById('partyChatHistoryLimit').onchange = function () {
  globalConfig.partyChatHistoryLimit = this.value;
  updateConfig(globalConfig, true);
};

initAccountControls();
initBadgeControls();
initSaveDataControls();
initPartyControls();
initEventControls();
initRankingControls();

document.getElementById('nexusButton').onclick = () => window.location = '../';

if (gameId === '2kki') {
  document.getElementById('2kkiVersion').innerText = document.querySelector('meta[name="2kkiVersion"]').content || '?';
  // Yume 2kki Explorer doesn't support mobile
  if (hasTouchscreen)
    document.getElementById('explorerControls').remove();
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
    else if (activeChatboxTabSection === 'parties') {
      updatePartyList();
      if (updatePartyListTimer)
        clearInterval(updatePartyListTimer);
      updatePartyListTimer = setInterval(() => {
        if (skipPartyListUpdate)
          skipPartyListUpdate = false;
        else if (document.getElementById('chatboxTabParties').classList.contains('active'))
          updatePartyList();
        else {
          clearInterval(updatePartyListTimer);
          updatePartyListTimer = null;
        }
      }, 10000);
    }
    for (let tab of document.getElementsByClassName('chatboxTab'))
      tab.classList.toggle('active', tab === this);
    for (let tabSection of document.getElementsByClassName('chatboxTabSection'))
      tabSection.classList.toggle('hidden', tabSection.id !== activeChatboxTabSection);
  }
}

for (let tab of document.getElementsByClassName('chatboxTab'))
  tab.onclick = onClickChatboxTab;

function setChatTab(tab, saveConfig) {
  const chatTabs = document.getElementById('chatTabs');
  const tabIndex = Array.prototype.indexOf.call(chatTabs.children, tab);
  const activeTabIndex = Array.prototype.indexOf.call(chatTabs.children, chatTabs.querySelector('.active'));
  if (tabIndex !== activeTabIndex) {
    const chatbox = document.getElementById('chatbox');
    const messages = document.getElementById('messages');
    const chatInput = document.getElementById('chatInput');
    for (let chatTab of document.getElementsByClassName('chatTab')) {
      const active = chatTab === tab;
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
    chatbox.classList.toggle('allChat', !tabIndex);
    chatbox.classList.toggle('mapChat', tabIndex === 1);
    chatbox.classList.toggle('globalChat', tabIndex === 2);
    chatbox.classList.toggle('partyChat', tabIndex === 3);
    messages.scrollTop = messages.scrollHeight;

    if (saveConfig) {
      config.chatTabIndex = tabIndex;
      updateConfig(config);
    }
  }
}

for (let chatTab of document.getElementsByClassName('chatTab'))
  chatTab.onclick = function () { setChatTab(this, true); };

function setPlayersTab(tab, saveConfig) {
  const playersTabs = document.getElementById('playersTabs');
  const tabIndex = Array.prototype.indexOf.call(playersTabs.children, tab);
  const activeTabIndex = Array.prototype.indexOf.call(playersTabs.children, playersTabs.querySelector('.active'));
  if (tabIndex !== activeTabIndex) {
    for (let playersTab of document.getElementsByClassName('playersTab')) {
      const active = playersTab === tab;
      playersTab.classList.toggle('active', active);
      if (active || !tabIndex)
        playersTab.classList.remove('unread');
    }

    document.getElementById('chatbox').classList.toggle('partyPlayers', tabIndex === 1);

    if (saveConfig) {
      config.playersTabIndex = tabIndex;
      updateConfig(config);
    }

    if (tabIndex === 1 && joinedPartyId)
      updateJoinedParty();
  }
}

for (let tab of document.getElementsByClassName('playersTab'))
  tab.onclick = function () { setPlayersTab(this, true); };

let ignoreSizeChanged = false;

function onResize() {
  const content = document.getElementById('content');
  const layout = document.getElementById('layout');

  const downscale = window.innerWidth < 704 || window.innerHeight < 577;
  const downscale2 = window.innerWidth < 544 || window.innerHeight < 457;

  content.classList.toggle('noSideBorders', window.innerWidth < 384);

  onUpdateChatboxInfo();

  document.documentElement.style.setProperty('--content-height', `${document.getElementById('bottom').offsetTop}px`);

  if (window.innerWidth < window.innerHeight) {
    content.classList.toggle('downscale', downscale);
    content.classList.toggle('downscale2', downscale2);
    layout.classList.toggle('overflow', isOverflow(downscale2 ? 0.5 : downscale ? 0.75 : 1));
  } else {
    layout.classList.add('overflow');
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

function updateLocationDisplayContainerPos() {
  const contentElement = document.getElementById('content');
  const canvasElement = document.getElementById('canvas');
  const locationDisplayContainer = document.getElementById('locationDisplayContainer');

  if (document.fullscreenElement) {
    const canvasRect = canvas.getBoundingClientRect();
    locationDisplayContainer.style.top = `${canvasRect.y}px`;
    locationDisplayContainer.style.left = `${canvasRect.x}px`;
  } else {
    locationDisplayContainer.style.top = `${canvasElement.offsetTop - contentElement.scrollTop}px`;
    locationDisplayContainer.style.left = `${canvasElement.offsetLeft}px`;
  }

  locationDisplayContainer.style.maxWidth = `${canvasElement.offsetWidth}px`;
  locationDisplayContainer.style.transform = canvasElement.style.transform ? canvasElement.style.transform : null;
}

function updateYnomojiContainerPos(isScrollUpdate) {
  const chatInput = document.getElementById('chatInput');
  const chatboxContainer = document.getElementById('chatboxContainer');
  const ynomojiContainer = document.getElementById('ynomojiContainer');
  const isFullscreen = document.fullscreenElement;
  const isWrapped =  window.getComputedStyle(document.getElementById('layout')).flexWrap === 'wrap';
  const isDownscale2 = document.getElementById('content').classList.contains('downscale2');
  const isFullscreenSide = isFullscreen && (window.innerWidth > 1050 || window.innerHeight < 595);
  ynomojiContainer.style.bottom = hasTouchscreen && ((isWrapped && isDownscale2) || isFullscreenSide)
    ? `calc((100% - ${chatInput.offsetTop}px) + max(${isFullscreen ? 6 : 1}rem + 2 * var(--controls-size) - (100% - ${chatInput.offsetTop}px - ${isFullscreen && !isFullscreenSide ? `(${chatboxContainer.style.marginTop} - 24px)` : '0px'}) - var(--content-scroll), 0px))`
    : `calc(100% - ${chatInput.offsetTop}px)`;
  ynomojiContainer.style.maxHeight = hasTouchscreen && ((isWrapped && isDownscale2) || isFullscreenSide)
    ? `calc(${document.getElementById('messages').offsetHeight - 16}px - max(${isFullscreen ? 6 : 1}rem + 2 * var(--controls-size) - (100% - ${chatInput.offsetTop}px - ${isFullscreen && !isFullscreenSide ? `(${chatboxContainer.style.marginTop} - 24px)` : '0px'}) - var(--content-scroll), 0px))`
    : `${document.getElementById('messages').offsetHeight - 16}px`;
  if (!isScrollUpdate) {
    ynomojiContainer.style.width = hasTouchscreen && isWrapped && !isDownscale2
      ? `calc(${chatInput.offsetWidth - 24} - 4 * var(--controls-size))`
      : `${chatInput.offsetWidth - 24}px`;
    ynomojiContainer.style.margin = hasTouchscreen && isWrapped && !isDownscale2
      ? `0 calc(2 * var(--controls-size) + ${document.getElementById('layout').offsetLeft * 2 + 4}px) 9px calc(2 * var(--controls-size) - ${document.getElementById('layout').offsetLeft * 2 - 4}px)`
      : '';
  }
}

function onUpdateChatboxInfo() {
  const layout = document.getElementById('layout');

  const chatboxContainer = document.getElementById('chatboxContainer');
  const chatboxInfo = document.getElementById('chatboxInfo');
  const chatboxTabs = document.getElementsByClassName('chatboxTab');

  const backgroundSize = chatboxContainer.classList.contains('fullBg') ? window.getComputedStyle(chatboxContainer).backgroundSize : null;

  for (let tab of chatboxTabs) {
    tab.style.backgroundSize = backgroundSize;
    tab.style.backgroundPositionX = `${-8 + tab.parentElement.offsetLeft - tab.getBoundingClientRect().left}px`;
    tab.style.backgroundPositionY = `${chatboxContainer.offsetTop - tab.parentElement.getBoundingClientRect().top}px`;
  }

  const messages = document.getElementById('messages');
  const partyPlayerList = document.getElementById('partyPlayerList');
  messages.style.backgroundPositionY = partyPlayerList.style.backgroundPositionY = `${chatboxContainer.offsetTop - partyPlayerList.getBoundingClientRect().top}px`;

  if (!layout.classList.contains('immersionMode') && !document.fullscreenElement && window.getComputedStyle(layout).flexWrap === 'wrap') {
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
  const layoutElement = document.getElementById('layout');
  const canvasElement = document.getElementById('canvas');
  const canvasContainerElement = document.getElementById('canvasContainer');
  const chatboxContainerElement = document.getElementById('chatboxContainer');
  const messages = document.getElementById('messages');

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
    document.documentElement.style.setProperty('--canvas-scale', scale);

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
    document.documentElement.style.setProperty('--canvas-scale', 1);
    canvasContainer.style.paddingRight = null;
    leftControlsMaxHeight = `${canvasElement.offsetHeight}px`;
  }

  canvasContainerElement.style.paddingRight = canvasContainerPaddingRight;
  canvasContainerElement.style.marginTop = canvasContainerMarginTop;
  chatboxContainerElement.style.marginTop = chatboxContainerMarginTop;
  layoutElement.classList.toggle('chatboxOverlap', chatboxOverlap);
  document.getElementById('chatbox').style.height = chatboxHeight;
  document.getElementById('leftControls').style.maxHeight = leftControlsMaxHeight;

  messages.scrollTop = messages.scrollHeight;

  updateYnomojiContainerPos();
  updateLocationDisplayContainerPos();
}

window.onresize = function () { setTimeout(onResize, 0); };

document.addEventListener('fullscreenchange', updateCanvasFullscreenSize);

document.getElementById('content').addEventListener('scroll', function () {
  document.documentElement.style.setProperty('--content-scroll', `${this.scrollTop}px`);
  if (hasTouchscreen)
    updateYnomojiContainerPos(true);
  updateLocationDisplayContainerPos();
});

function toggleControls(show) {
  document.getElementById('controls').classList.toggle('fshidden', !show);
}

let fullscreenControlsTimer;

function setFullscreenControlsHideTimer() {
  if (fullscreenControlsTimer)
    clearTimeout(fullscreenControlsTimer);
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

function setLang(lang, isInit) {
  globalConfig.lang = lang;
  if (isInit && gameIds.indexOf(gameId) > -1)
    Module.EASYRPG_LANGUAGE = (gameDefaultLangs.hasOwnProperty(gameId) ? gameDefaultLangs[gameId] !== lang : lang !== 'en') ? lang : 'default';
  initLocalization(isInit);
  if (!isInit)
    updateConfig(globalConfig, true);
}

function setName(name, isInit) {
  globalConfig.name = name;
  if (!isInit)
    updateConfig(globalConfig, true);
}

function setSoundVolume(value, isInit) {
  if (isNaN(value))
    return;
  if (Module.INITIALIZED && !config.mute)
    Module._SetSoundVolume(value);
  globalConfig.soundVolume = value;
  if (!isInit)
    updateConfig(globalConfig, true);
}

function setMusicVolume(value, isInit) {
  if (isNaN(value))
    return;
  if (Module.INITIALIZED && !config.mute)
    Module._SetMusicVolume(value);
  globalConfig.musicVolume = value;
  if (!isInit)
    updateConfig(globalConfig, true);
}

function onSelectUiTheme(e) {
  const modalContainer = document.getElementById('modalContainer');
  if (!modalContainer.dataset.lastModalId?.endsWith('createPartyModal'))
    setUiTheme(e.target.dataset.uiTheme);
  else
    setPartyTheme(e.target.dataset.uiTheme);
  setModalUiTheme(null, e.target.dataset.uiTheme === 'auto' ? systemName : e.target.dataset.uiTheme, true);
}

function initLocalization(isInitial) {
  document.getElementsByTagName('html')[0].lang = globalConfig.lang;
  fetchNewest(`lang/${globalConfig.lang}.json`)
    .then(response => response.json())
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
      
      if (isInitial) {
        onUpdateConnectionStatus(0);
        badgeGameIds = Object.keys(localizedMessages.games);
      } else {
        if (connStatus !== undefined)
          onUpdateConnectionStatus(connStatus);
        if (playerCount !== undefined)
          updatePlayerCount(playerCount);
      }

      const initLocationsCallback = () => {
        fetchAndPopulateRankingCategories();
          if (eventPeriodCache)
            updateEvents();
      };

      if (isInitial)
        fetchAndInitLocations(globalConfig.lang, gameId).then(initLocationsCallback);
      else if (localizedMapLocations)
        fetchAndInitLocalizedMapLocations(globalConfig.lang, gameId).then(initLocationsCallback);

      updateChatMessageTimestamps();

      const translationComplete = jsonResponse.translationComplete === '1';
      const translationInstruction = document.getElementById('translationInstruction');
      translationInstruction.classList.toggle('hidden', translationComplete);
      if (!translationComplete)
        document.getElementById('translationLink').href = `https://github.com/ynoproject/forest-orb/edit/master/lang/${globalConfig.lang}.json`;

      if (isInitial) {
        const languages = document.getElementById('lang').children;
        for (let langOpt of languages) {
          const lang = langOpt.value;
          if (gameDefaultLangs.hasOwnProperty(gameId) ? gameDefaultLangs[gameId] !== lang : lang !== 'en')
            fetchNewest(`../data/${gameId}/Language/${lang}/meta.ini`).then(response => {
              if (!response.ok && response.status === 404) {
                langOpt.innerText += '*';
                langOpt.dataset.noGameLoc = true;
                if (lang === globalConfig.lang)
                  document.getElementById('noGameLocInstruction').classList.remove('hidden');
              }
            });
        }
      } else {
        const noGameLocInstruction = document.getElementById('noGameLocInstruction');
        noGameLocInstruction.classList.toggle('hidden', !document.querySelector(`#lang option[value='${globalConfig.lang}']`).dataset.noGameLoc);
      }

      updateLocalizedBadgeGroups();
      updateLocalizedBadges();
      if (typeof badgeTools !== 'undefined') {
        badgeTools.localizedMessages = {
          games: localizedMessages.games
        };
      }

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
        const tooltipElements = document.querySelectorAll('[title]');
        for (let el of tooltipElements) {
          addTooltip(el, el.title, true, !el.classList.contains('helpLink'));
          el.removeAttribute('title');
        }
      });
    });
}

function fetchAndInitLocations(lang, game) {
  return new Promise(resolve => {
    fetchNewest(`locations/${game}/config.json`)
      .then(response => {
          if (!response.ok)
            throw new Error(response.statusText);
          return response.json();
      })
      .then(jsonResponse => {
          gameLocationUrlRoots[game] = jsonResponse.urlRoot;
          gameLocalizedLocationUrlRoots[game] = gameLocationUrlRoots[game];
          gameMapLocations[game] = jsonResponse.mapLocations || null;
          if (gameMapLocations[game] && !Object.keys(gameMapLocations[game]).length)
            gameMapLocations[game] = null;
          if (gameMapLocations[game]) {
            massageMapLocations(gameMapLocations[game], jsonResponse.locationUrlTitles || null);
            if (lang === 'en') {
              gameLocalizedMapLocations[game] = gameMapLocations[game];
              initLocalizedLocations(game);
            } else
              fetchAndInitLocalizedMapLocations(lang, game).then(resolve);
          }
          if (game === gameId) {
            ignoredMapIds = jsonResponse.ignoredMapIds || [];
            locationUrlRoot = gameLocationUrlRoots[game];
            localizedLocationUrlRoot = gameLocalizedLocationUrlRoots[game];
            mapLocations = gameMapLocations[game];
            localizedMapLocations = gameLocalizedMapLocations[game];
            yumeWikiSupported = locationUrlRoot === `https://yume.wiki/${ynoGameId}/`;
          }
          if (!gameMapLocations[game] || lang === 'en')
            resolve();
      })
      .catch(err => {
        gameLocalizedMapLocations[game] = null;
        if (game === gameId) {
          ignoredMapIds = [];
          localizedMapLocations = null;
        }
        console.error(err);
        resolve();
      });
  });
}

function fetchAndInitLocalizedMapLocations(lang, game) {
<<<<<<< HEAD
  return new Promise(resolve => {
    const fileName = lang === 'en' ? 'config' : lang;
    fetchNewest(`locations/${game}/${fileName}.json`)
      .then(response => {
        if (!response.ok) {
          gameLocalizedMapLocations[game] = gameMapLocations[game];
          if (game === gameId) {
            localizedMapLocations = mapLocations;
            initLocalizedLocations(game);
            resolve();
          } else
            initLocalizedLocations(game);
          return null; // Assume map location localizations for this language don't exist
        }
        return response.json();
=======
  const fileName = lang === 'en' ? 'config' : lang;
  return fetchNewest(`locations/${game}/${fileName}.json`)
    .then(response => {
      return response.ok ? response.json() : Promise.reject();
>>>>>>> be6cbea (Always set localized locations to default when fetch fails)
    })
    .then(jsonResponse => {
      gameLocalizedLocationUrlRoots[game] = jsonResponse.urlRoot;
      gameLocalizedMapLocations[game] = {};
      const langMapLocations = jsonResponse.mapLocations;
      massageMapLocations(langMapLocations, jsonResponse.locationUrlTitles || null);
      Object.keys(gameMapLocations[game]).forEach(function (mapId) {
        const mapLocation = langMapLocations[mapId];
        const defaultMapLocation = gameMapLocations[game][mapId];
        if (mapLocation) {
          gameLocalizedMapLocations[game][mapId] = mapLocation;
          if (Array.isArray(defaultMapLocation) && Array.isArray(mapLocation) && defaultMapLocation.length === mapLocation.length) {
            for (let l in defaultMapLocation) {
              if (defaultMapLocation[l].hasOwnProperty('coords'))
                mapLocation[l].coords = defaultMapLocation[l].coords;
            }
          }
        } else
          gameLocalizedMapLocations[game][mapId] = defaultMapLocation;
      });
      if (game === gameId) {
        localizedLocationUrlRoot = gameLocalizedLocationUrlRoots[game];
        localizedMapLocations = gameLocalizedMapLocations[game];
      }
      initLocalizedLocations(game);
    })
    .catch(_err => { // Assume map location localizations for this language don't exist
      gameLocalizedMapLocations[game] = gameMapLocations[game];
      if (game === gameId) {
        localizedMapLocations = mapLocations;
        initLocalizedLocations(game);
      }
    });
}

function initLocalizedLocations(game) {
  if (!gameMapLocations[game] || !gameLocalizedMapLocations[game])
    return;

  gameLocalizedLocationsMap[game] = {};
  gameLocationsMap[game] = {};

  const trySetLocalizedLocation = (mapLocation, localizedMapLocation) => {
    if (mapLocation.title.indexOf(':') > -1)
      return;
    gameLocalizedLocationsMap[game][mapLocation.title] = localizedMapLocation;
    gameLocationsMap[game][mapLocation.title] = mapLocation;
  };
  
  for (let mapId of Object.keys(gameMapLocations[game])) {
    const locations = gameMapLocations[game][mapId];
    if (!locations)
        continue;
    if (locations.hasOwnProperty('title')) // Text location
      trySetLocalizedLocation(locations, gameLocalizedMapLocations[game][mapId]);
    else if (Array.isArray(locations)) // Multiple locations
      locations.forEach((location, i) => trySetLocalizedLocation(location, gameLocalizedMapLocations[game][mapId][i]));
    else {
      for (let key of Object.keys(locations)) {
        const locationsInner = gameMapLocations[game][mapId][key];
        if (!locationsInner)
            continue;
        if (locationsInner.hasOwnProperty('title'))
          trySetLocalizedLocation(locationsInner, gameLocalizedMapLocations[game][mapId][key]);
        else
          locationsInner.forEach((location, i) => trySetLocalizedLocation(location, gameLocalizedMapLocations[game][mapId][key][i]));
      }
    }
  }
}

function getMapLocationsArray(mapLocations, mapId, prevMapId, x, y) {
  if (mapLocations.hasOwnProperty(mapId)) {
    const locations = mapLocations[mapId];
    if (locations.hasOwnProperty('title')) // Text location
      return [ locations ];
    if (Array.isArray(locations)) // Multiple locations
      return getMapLocationsFromArray(locations, x, y);
    if (locations.hasOwnProperty(prevMapId)) {// Previous map ID matches a key
      if (Array.isArray(locations[prevMapId]))
        return getMapLocationsFromArray(locations[prevMapId], x, y);
      return [ locations[prevMapId] ];
    }
    if (locations.hasOwnProperty('else')) { // Else case
      if (locations.else.hasOwnProperty('title'))
        return [ locations.else ];
      if (Array.isArray(locations.else))
        return getMapLocationsFromArray(locations.else, x, y);
    }
  }
}

function getMapLocationsFromArray(locations, x, y) {
  if (locations.length && locations[0].hasOwnProperty('coords') && x !== null && y !== null) {
    const coordLocation = locations.find(l => l.hasOwnProperty('coords') && ((l.coords.x1 === -1 && l.coords.x2 === -1) || (l.coords.x1 <= x && l.coords.x2 >= x)) && ((l.coords.y1 === -1 && l.coords.y2 === -1) || (l.coords.y1 <= y && l.coords.y2 >= y)));
    if (coordLocation)
      return [ coordLocation ];
    const noCoordLocations = locations.filter(l => !l.hasOwnProperty('coords'));
    if (noCoordLocations.length)
      return noCoordLocations;
  }
  return locations;
}

function getLocalizedMapLocations(game, mapId, prevMapId, x, y, separator, forDisplay) {
  if (gameLocalizedMapLocations[game]?.hasOwnProperty(mapId)) {
    const localizedLocations = gameLocalizedMapLocations[game][mapId];
    const locations = gameMapLocations[game][mapId];
    if (localizedLocations.hasOwnProperty('title')) // Text location
      return getLocalizedLocation(game, localizedLocations, locations, false, forDisplay);
    if (Array.isArray(localizedLocations)) // Multiple locations
      return getMapLocationsFromArray(localizedLocations, x, y).map((l, i) => getLocalizedLocation(game, l, getMapLocationsFromArray(locations, x, y)[i], false, forDisplay)).join(separator);
    if (localizedLocations.hasOwnProperty(prevMapId)) { // Previous map ID matches a key
      if (Array.isArray(localizedLocations[prevMapId]))
        return getMapLocationsFromArray(localizedLocations[prevMapId], x, y).map((l, i) => getLocalizedLocation(game, l, getMapLocationsFromArray(locations[prevMapId], x, y)[i], false, forDisplay)).join(separator);
      return getLocalizedLocation(game, localizedLocations[prevMapId], locations[prevMapId]);
    }
    if (localizedLocations.hasOwnProperty('else')) { // Else case
      if (localizedLocations.else.hasOwnProperty('title'))
        return getLocalizedLocation(game, localizedLocations.else, locations.else, false, forDisplay);
      if (Array.isArray(localizedLocations.else))
        return getMapLocationsFromArray(localizedLocations.else, x, y).map((l, i) => getLocalizedLocation(game, l, getMapLocationsFromArray(locations.else, x, y)[i], false, forDisplay)).join(separator);
    }
  }
  
  return localizedMessages.location.unknownLocation;
}

function getLocalizedMapLocationsHtml(game, mapId, prevMapId, x, y, separator) {
  if (gameLocalizedMapLocations[game]?.hasOwnProperty(mapId)) {
    const localizedLocations = gameLocalizedMapLocations[game][mapId];
    const locations = gameMapLocations[game][mapId];
    let locationsHtml;
    if (localizedLocations.hasOwnProperty('title')) // Text location
      locationsHtml = getLocalizedLocation(game, localizedLocations, locations, true);
    else if (Array.isArray(localizedLocations)) // Multiple locations
      locationsHtml = getMapLocationsFromArray(localizedLocations, x, y).map((l, i) => getLocalizedLocation(game, l, getMapLocationsFromArray(locations, x, y)[i], true)).join(separator);
    else if (localizedLocations.hasOwnProperty(prevMapId)) { // Previous map ID matches a key
      if (Array.isArray(localizedLocations[prevMapId]))
        locationsHtml = getMapLocationsFromArray(localizedLocations[prevMapId], x, y).map((l, i) => getLocalizedLocation(game, l, getMapLocationsFromArray(locations[prevMapId], x, y)[i], true)).join(separator);
      else
        locationsHtml = getLocalizedLocation(game, localizedLocations[prevMapId], locations[prevMapId], true);
    } else if (localizedLocations.hasOwnProperty('else')) {  // Else case
      if (localizedLocations.else.hasOwnProperty('title'))
        locationsHtml = getLocalizedLocation(game, localizedLocations.else, locations.else, true);
      else if (Array.isArray(localizedLocations.else))
        locationsHtml = getMapLocationsFromArray(localizedLocations.else, x, y).map((l, i) => getLocalizedLocation(game, l, getMapLocationsFromArray(locations.else, x, y)[i], true)).join(separator);
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

function getLocalizedLocation(game, location, locationEn, asHtml, forDisplay) {
  let template = getMassagedLabel(localizedMessages[forDisplay ? 'locationDisplay' : 'location'].template);
  let ret;
  let locationValue;

  if (asHtml) {
    template = template.replace(/}([^{]+)/g, '}<span class="infoLabel">$1</span>');
    if (gameLocalizedLocationUrlRoots[game] && location.urlTitle !== null)
      locationValue = `<a href="${gameLocalizedLocationUrlRoots[game]}${location.urlTitle || location.title}" target="_blank">${location.title}</a>`;
    else if (gameLocationUrlRoots[game] && gameLocalizedLocationUrlRoots[game] !== null && locationEn.urlTitle !== null)
      locationValue = `<a href="${gameLocationUrlRoots[game]}${locationEn.urlTitle || locationEn.title}" target="_blank">${location.title}</a>`;
    else
      locationValue = getInfoLabel(location.title);
  } else
    locationValue = location.title;

  ret = template.replace('{LOCATION}', locationValue);
  
  if (template.indexOf('{LOCATION_EN}') > -1) {
    let locationValueEn;
    if (asHtml) {
      if (gameLocationUrlRoots[game] && locationEn.urlTitle !== null)
        locationValueEn = `<a href="${gameLocationUrlRoots[game]}${locationEn.urlTitle || locationEn.title}" target="_blank">${locationEn.title}</a>`;
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
  if (label)
    label = label.replace(/\n/g, '<br>');
  if (langLabelMassageFunctions.hasOwnProperty(globalConfig.lang) && label)
    return langLabelMassageFunctions[globalConfig.lang](label, isUI);
  return label;
}

function getInfoLabel(label) {
  return `<span class="infoLabel">${label}</span>`;
}

function queryAndSetWikiMaps(locations) {
  const maps = [];
  Promise.all(locations.map(l => wikiApiFetch('maps', `location=${l.urlTitle || l.title}`).then(response => {
    if (Array.isArray(response)) {
      for (let map of response)
        maps.push({ url: map.path, label: map.caption });
    }
  }))).then(() => setMaps(maps, locations.map(l => l.title), true, true));

  setMaps([], null, true);
}

function setMaps(maps, locationNames, cacheMaps, saveMaps) {
  const mapControls = document.getElementById('mapControls');
  mapControls.innerHTML = '';
  if (maps && maps.length) {
    for (let map of maps)
      mapControls.appendChild(getMapButton(map.url, map.label));
  }
  if (cacheMaps && locationNames) {
    mapCache[locationNames.join(',')] = maps;
    if (saveMaps) {
      setCacheValue(CACHE_TYPE.map, locationNames.join(','), maps);
      updateCache(CACHE_TYPE.map);
    }
  }
}

function getMapButton(url, label) {
  const ret = document.createElement('button');
  ret.classList.add('mapButton');
  ret.classList.add('unselectable');
  ret.classList.add('iconButton');
  addTooltip(ret, label, true);
  ret.onclick = () => {
    const handle = window.open(url, '_blank', 'noreferrer');
    if (handle)
        handle.focus();
  };
  ret.innerHTML = '<svg viewbox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="m0 0l4 2 4-2 4 2v10l-4-2-4 2-4-2v-10m4 2v10m4-12v10"></path></svg>';
  return ret;
}

function getOrQueryLocationColors(locationName) {
  return new Promise((resolve, _reject) => {
    if (Array.isArray(locationName) && locationName.length && locationName[0].hasOwnProperty('title'))
      locationName = locationName[0].title;
    else if (locationName.hasOwnProperty('title'))
      locationName = locationName.title;
    const colonIndex = locationName.indexOf(':');
    if (colonIndex > -1)
      locationName = locationName.slice(0, colonIndex);
    if (locationColorCache.hasOwnProperty(locationName)) {
      resolve(locationColorCache[locationName]);
      return;
    }

    if (gameId === '2kki') {
      const url = `${apiUrl}/2kki?action=getLocationColors&locationName=${locationName}`;
      const callback = response => {
        let errCode = null;

        if (response && !response.err_code)
          cacheLocationColors(locationName, response.fgColor, response.bgColor);
        else
          errCode = response?.err_code;
          
        if (errCode)
          console.error({ error: response.error, errCode: errCode });

        resolve([response?.fgColor, response?.bgColor]);
      };
      send2kkiApiRequest(url, callback);
    } else {
      sendSessionCommand('lcol', [ locationName ], params => {
        if (params.length === 2) {
          cacheLocationColors(locationName, params[0], params[1]);
          resolve([params[0], params[1]]);
          return;
        }
        resolve(['#FFFFFF', '#FFFFFF']);
      });
    }
  });
}

function cacheLocationColors(locationName, fgColor, bgColor) {
  if (locationName) {
    const colorsArr = [ fgColor, bgColor ];
    locationColorCache[locationName] = colorsArr;
    if (fgColor && bgColor) {
      setCacheValue(CACHE_TYPE.locationColor, locationName, colorsArr);
      updateCache(CACHE_TYPE.locationColor)
    }
  }
}

function handleBadgeOverlayLocationColorOverride(badgeOverlay, badgeOverlay2, locations, playerName, mapId, prevMapId, prevLocationsStr, x, y) {
  const setOverlayColors = (fgColor, bgColor) => {
    badgeOverlay.style.background = fgColor;
    if (badgeOverlay2)
      badgeOverlay2.style.background = bgColor;
  };
  const queryColorsFunc = locations => {
    if (!locations)
      return;
    getOrQueryLocationColors(locations)
      .then(colors => {
        if (Array.isArray(colors) && colors.length === 2)
          setOverlayColors(colors[0], colors[1]);
      });
  };
  if (locations)
    queryColorsFunc(locations);
  else if (gameId === '2kki') {
    const queryLocationsFunc = (mapId, prevMapId, prevLocations) => {
      if (!mapLocations || !mapLocations.hasOwnProperty(mapId) || (!mapLocations[mapId].hasOwnProperty('explorer') || mapLocations[mapId].explorer))
        getOrQuery2kkiLocations(mapId, prevMapId, prevLocations, queryColorsFunc);
    };
    const getPrevLocationsFunc = (prevLocationsStr, prevMapId) => prevLocationsStr && (prevMapId || '0000') !== '0000' ? decodeURIComponent(window.atob(prevLocationsStr)).split("|").map(l => { return { title: l }; }) : null;

    let foundPlayer;
    if (playerName) {
      const playerEntry = Object.entries(globalPlayerData).find(p => p[1].account && p[1].name === playerName);
      if (playerEntry) {
        if (Object.values(playerUuids).indexOf(playerEntry[0]) > -1) {
          queryColorsFunc(cachedLocations);
          foundPlayer = true;
        } else if (joinedPartyCache) {
          const member = joinedPartyCache.members.find(m => m.account && m.name === playerName);
          if (member) {
            queryLocationsFunc(member.mapId, member.prevMapId, getPrevLocationsFunc(member.prevLocations, member.prevMapId));
            foundPlayer = true;
          }
        }
      }
    }

    if (!foundPlayer && mapId && mapId !== '0000')
      queryLocationsFunc(mapId, prevMapId, getPrevLocationsFunc(prevLocationsStr, prevMapId));
  } else if (mapLocations && mapLocations.hasOwnProperty(mapId || cachedMapId))
      queryColorsFunc(getMapLocationsArray(mapLocations, mapId || cachedMapId, prevMapId || cachedPrevMapId, x || tpX, y || tpY));
}

function fetchAndPopulateYnomojiConfig() {
  fetchNewest('ynomoji.json')
    .then(response => response.json())
    .then(jsonResponse => {
      ynomojiConfig = jsonResponse;
      const ynomojiContainer = document.getElementById('ynomojiContainer');
      Object.keys(ynomojiConfig).forEach(ynomojiId => {
        const ynomojiButton = document.createElement('a');
        ynomojiButton.href = 'javascript:void(0)';
        ynomojiButton.dataset.ynomojiId = ynomojiId;
        ynomojiButton.classList.add('ynomojiButton');
        
        const ynomoji = document.createElement('img');
        ynomoji.src = `${ynomojiUrlPrefix}${ynomojiConfig[ynomojiId]}`;
        addTooltip(ynomoji, `:${ynomojiId}:`, true);
        ynomoji.classList.add('ynomoji');
        ynomoji.onclick = () => insertYnomoji(ynomojiId);

        ynomojiButton.appendChild(ynomoji);
        ynomojiContainer.appendChild(ynomojiButton);
      });
    });
}

function insertYnomoji(ynomojiId) {
  const chatInput = document.getElementById('chatInput');
  const ynomojiMatch = /:([a-z0-9_\-]+)?$/i.exec(chatInput.value.slice(0, chatInput.selectionEnd));
  if (ynomojiMatch)
    chatInput.value = `${chatInput.value.slice(0, ynomojiMatch.index)}:${ynomojiId}:${chatInput.value.slice(chatInput.selectionEnd)}`;
  else
    chatInput.value += `:${ynomojiId}:`;
  chatInput.oninput();
}

function loadOrInitCache() {
  const request = indexedDB.open(gameId);

  request.onupgradeneeded = event => {
    const db = event.target.result;
    db.createObjectStore('CACHE', {});

    locationCache = {};
    mapCache = {};
    locationColorCache = {};
  };

  request.onsuccess = function (_e) {
    const db = request.result;
    const transaction = db.transaction(['CACHE'], 'readwrite');
    const cacheKeys = Object.keys(cache);
    for (let k of cacheKeys) {
      const valueReq = transaction.objectStore('CACHE').get(k.toUpperCase());
      valueReq.onsuccess = valueReqRes => {
        const value = valueReqRes.target.result;
        const currentTime = new Date().getTime();
        const localValue = value
          ? Object.fromEntries(Object.keys(value).filter(k => value[k].hasOwnProperty('time') && (currentTime - value[k].time) / (1000 * 3600 * 24) < 7).map(k => [ k, value[k].value ]))
          : {};
        if (k === CACHE_TYPE.location)
          locationCache = localValue;
        else if (k === CACHE_TYPE.map)
          mapCache = localValue;
        else if (k === CACHE_TYPE.locationColor)
          locationColorCache = localValue;
        if (value)
          cache[k] = value;
      };
    }
  };
}

function updateCache(cacheType) {
  if (cache.hasOwnProperty(cacheType)) {
    const request = indexedDB.open(gameId);

    request.onsuccess = function (_e) {
      const db = request.result;
      const transaction = db.transaction(['CACHE'], 'readwrite');
      transaction.objectStore('CACHE').put(cache[cacheType], cacheType.toUpperCase());
    };
  }
}

function setCacheValue(cacheType, key, value) {
  if (!cache.hasOwnProperty(cacheType))
    return;

  cache[cacheType][key] = { time: new Date().getTime(), value: value };
}

onResize();

loadOrInitConfig(globalConfig, true);
loadOrInitConfig(config);
loadOrInitCache();

initDefaultSprites();
updateBadges();
if (typeof initBadgeTools === 'function')
  initBadgeTools();
fetchAndPopulateYnomojiConfig();

if (!loadedUiTheme)
  setUiTheme('auto', true);
if (!loadedFontStyle)
  setFontStyle(0, true);
if (!loadedLang) {
  const browserLang = navigator.language.indexOf('-') === -1 ? navigator.language : navigator.language.slice(0, navigator.language.indexOf('-'));
  setLang(Array.from(document.getElementById('lang').children).map(e => e.value).indexOf(browserLang) > -1 ? browserLang : 'en', true);
}