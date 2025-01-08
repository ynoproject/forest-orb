/**
 * @typedef {object} Coords
 * @property {number} x1
 * @property {number} x2
 * @property {number} y1
 * @property {number} y2
 */

/**
 * @typedef {object} MapTitle
 * @property {string} title 
 * @property {string} [urlTitle]
 * @property {Coords} [coords]
 * @property {boolean} [explorer]
 */

/** 
 * @typedef {string | MapTitle | (string | MapTitle)[] | Record<'else' | number | `0${number}`, string | MapTitle | (string | MapTitle)[]>} MapDescriptor
 * In the array form, the last element is customarily the fallback title.
 *
 * The third object form allows matching the correct world for map IDs shared between worlds:
 * a mapping from the previous map ID the player came from, to the matching map title.
 */

/**
 * @typedef {Record<string, Record<string, MapDescriptor>>} MapDescriptorRecord
 * game -> map-id
 */

let localizedVersion;
/** @type {import('./lang/en.json')['messages']?} */
let localizedMessages;

/** @type {Record<string, MapDescriptor>?} */
let localizedMapLocations;
/** @type {Record<string, MapDescriptor>?} */
let mapLocations;
let localizedLocationUrlRoot;
let locationUrlRoot;

/** @type {MapDescriptorRecord} */
let gameLocalizedMapLocations = {};

/** @type {MapDescriptorRecord} */
let gameMapLocations = {};
let gameLocalizedLocationUrlRoots = {};
let gameLocationUrlRoots = {};
let gameLocalizedLocationsMap = {};
let gameLocationsMap = {};

let yumeWikiSupported;

/** @type {WeakRef<any>} */
let gameMapHandle = new WeakRef({});

const modalTransitionDuration = 230;

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
  wikiLinkMode: 1,
  saveReminder: 60,
  chatTipIndex: -1,
  gameChat: true,
  gameChatGlobal: false,
  gameChatParty: true,
  tabToChat: true,
  mapChatHistoryLimit: 100,
  globalChatHistoryLimit: 100,
  partyChatHistoryLimit: 250,
  mobileControls: true,
  mobileControlsType: 'default',
  playMentionSound: true,
  blurScreenshotEmbeds: false,
  locationDisplay: false,
  hideRankings: false,
  hideSchedules: false,
  autoDownloadScreenshots: false,
  screenshotResolution: 1,
  preloads: false,
  questionablePreloads: false,
  rulesReviewed: false,
  badgeToolsData: null,
  pushNotificationToastDismissed: false,
};

let config = {
  privateMode: false,
  disableChat: false,
  mute: false,
  hideLocation: false,
  nametagMode: 1,
  disablePlayerSounds: false,
  immersionMode: false,
  chatTabIndex: 0,
  playersTabIndex: 0,
  globalMessage: false,
  hideGlobalMessageLocations: false,
  trackedLocationId: null
};

const locI18nextOptions = {
  optionsAttr: 'i18n-options',
  useOptionsAttr: true,
};

if (gameId === '2kki') {
  config.last2kkiVersion = document.querySelector('meta[name="2kkiVersion"]').content;
  config.explorer = false;
  config.enableExplorer = false;
}

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

if (hasTouchscreen && iOS()) {
  let crashFix = document.querySelector("#crashFix");
  crashFix.style.cssText += "display: block; opacity: 0%;";
  crashFix.style.width = window.getComputedStyle(document.querySelector("#canvas")).width;
  crashFix.style.height = window.getComputedStyle(document.querySelector("#canvas")).height;
}

function iOS() {
  return [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ].includes(navigator.platform)
  || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
}

// EXTERNAL
function onUpdateConnectionStatus(status) {
  if (status === 1 && config.privateMode)
    status = 3;

  const updateStatusText = function () {
    const connStatusIcon = document.getElementById('connStatusIcon');
    const connStatusText = document.getElementById('connStatusText');
    connStatusIcon.classList.toggle('connecting', status === 2);
    connStatusIcon.classList.toggle('connected', status === 1);
    connStatusIcon.classList.toggle('privateMode', status === 3);
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

  if (status === 1 || status === 3) {
    addOrUpdatePlayerListEntry(null, playerData, false, true);
    updatePlayerFriends();
    updateJoinedParty();
    if (eventPeriodCache)
      updateEvents();
    syncPrevLocation();
  } else {
    playerUuids = {};
    clearPlayerList();
  }
}

// EXTERNAL
function onRoomSwitch() {
  syncPrevLocation();
  clearPlayerList();
  addOrUpdatePlayerListEntry(null, playerData, false, true);
  syncLocationChange();
  checkEventLocations();
  updatePlayerFriends();
  updateJoinedParty();
}

function fetchAndUpdatePlayerInfo() {
  const cookieSessionId = getCookie(sessionIdKey);
  const isLogin = cookieSessionId && cookieSessionId !== loginToken;
  const isLogout = !cookieSessionId && loginToken && cookieSessionId !== loginToken;
  if (isLogin || isLogout) {
    loginToken = isLogin ? cookieSessionId : null;
    if (!inWebview)
      easyrpgPlayer.api.setSessionToken(isLogin ? loginToken : '');
    playerTooltipCache.clear();
  }
  navigator.serviceWorker?.getRegistration('/').then(registration => {
    if (!registration)
      console.warn('updating player info but no service workers found');
    registration?.active?.postMessage({
      sessionId: cookieSessionId,
      game: gameId,
    });
  });
  apiFetch('info')
    .then(response => response.json())
    .then(jsonResponse => {
      if (jsonResponse.uuid) {
        if (jsonResponse.name)
          playerName = jsonResponse.name;
        syncPlayerData(jsonResponse.uuid, jsonResponse.rank, !!loginToken, jsonResponse.badge, jsonResponse.medals, -1);
        badgeSlotRows = jsonResponse.badgeSlotRows || 1;
        badgeSlotCols = jsonResponse.badgeSlotCols || 3;
        screenshotLimit = jsonResponse.screenshotLimit || 10;
        visitedLocationIds = jsonResponse.locationIds || [];
        updateBlocklist(false);
        const updateParty = () => {
          if (document.querySelector('#chatboxTabParties.active'))
            updatePartyList();
          else
            fetchAndUpdateJoinedPartyId();
        };
        if (isLogin) {
          initSessionWs()
            .then(() => {
              trySetChatName(playerName);
              updatePlayerFriends();
              updateParty();
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
              onResize();
            });
        } else {
          initSessionWs()
            .then(() => {
              trySetChatName('');
              updatePlayerFriends();
              updateParty();
              if (isLogout) {
                showAccountToastMessage('loggedOut', 'leave');
                document.getElementById('content').classList.remove('loggedIn');
                onResize();
              }
            });
        }
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
let modalUiTheme;

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
  gameLogo.classList.remove('transparent');
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
  preloadFilesFromMapId(mapId);
  if (!mapChanged && (!localizedMapLocations || !localizedMapLocations.hasOwnProperty(mapId)))
    return;

  const is2kki = gameId === '2kki';

  if (localizedMapLocations) {
    if (!cachedMapId)
      document.getElementById('location').classList.remove('hidden');

    const localizedLocationHtml = getLocalizedMapLocationsHtml(gameId, mapId, cachedMapId, tpX, tpY, '<br>');
    fastdom.mutate(() => document.getElementById('locationText').innerHTML = localizedLocationHtml).then(() => {
      fastdom.measure(() => {
        const width = `${document.querySelector('#locationText > *').offsetWidth}px`;
        fastdom.mutate(() => document.getElementById('nextLocationContainer').style.setProperty('--location-width', width));
      })
    });
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
    const locationsUpdated = !locations !== !cachedLocations || JSON.stringify(locations) !== JSON.stringify(cachedLocations);
    if (locationsUpdated) {
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

    if (locationsUpdated) {
      if (!mapChanged) {
        syncLocationChange();
        checkEventLocations();
      }

      if (yumeWikiSupported && playerData?.badge && badgeCache.find(b => b.badgeId === playerData.badge)?.overlayType & BadgeOverlayType.LOCATION)
        updateBadgeButton();
    }
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
  const cancelKeyCodes = [ 'escape', 'x', 'c', 'v', 'b', 'n', 'numpad0', 'backspace' ];

  document.addEventListener('keyup', e => {
    const keyLc = e.key?.toLowerCase();
    if (globalConfig.locationDisplay && (locationDisplayTimer || locationDisplayQueue.length) && cancelKeyCodes.includes(keyLc)) {
      locationDisplayQueue.splice(0, locationDisplayQueue.length);
      hideLocationDisplay(true);
    }

    if (keyLc === 'enter' && e.altKey) {
      document.getElementById('controls-fullscreen')?.click();
    }
  });
}

function syncPrevLocation() {
  const prevMapId = cachedPrevMapId || '0000';
  const prevLocationsStr = cachedPrev2kkiLocations?.length ? window.btoa(encodeURIComponent(cachedPrev2kkiLocations.map(l => l.title).join('|'))) : '';
  sendSessionCommand('ploc', [ prevMapId, prevLocationsStr ]);
}

function syncLocationChange() {
  const locationNames = cachedLocations ? cachedLocations.map(l => get2kkiWikiLocationName(l)) : [];

  sendSessionCommand('l', locationNames);
  if (window.webviewSetLocation)
    window.webviewSetLocation(locationNames.join(' | '));
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
        easyrpgPlayer.api.setSoundVolume(toggled ? 0 : globalConfig.soundVolume);
        easyrpgPlayer.api.setMusicVolume(toggled ? 0 : globalConfig.musicVolume);
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
 * @param {string} [theme] The theme for the modal to use. Player-selected or in-game menu theme is used if none is specified.
 * @param {string} [lastModalId] The previously-opened modal, used when opening sub-modals.
 * @param {Object} [modalData] Data to be passed to the modal.
 */
function openModal(modalId, theme, lastModalId, modalData) {
  const modalContainer = document.getElementById('modalContainer');
  modalContainer.classList.remove('fadeOut', 'hidden');
  modalContainer.classList.add('fadeIn');
  // if (modalId !== 'wikiModal')
  //   modalContainer.style.opacity = '';

  if (lastModalId) {
    if (modalContainer.dataset.lastModalId) {
      modalContainer.dataset.lastModalId = `${modalContainer.dataset.lastModalId},${lastModalId}`;
      modalContainer.dataset.lastModalTheme = `${modalContainer.dataset.lastModalTheme},${modalUiTheme || ''}`;
    } else {
      modalContainer.dataset.lastModalId = lastModalId;
      modalContainer.dataset.lastModalTheme = modalUiTheme || '';
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
  const activeModal = document.querySelector('#modalContainer .modal:not(.hidden)');
  if (activeModal && activeModal.id !== modalId) {
    const activeModalContent = activeModal.querySelector('.modalContent');
    const contentScrollTop = activeModalContent?.scrollTop;
    document.getElementById('modalFadeOutContainer').appendChild(activeModal);
    if (contentScrollTop) {
      activeModalContent.scrollTop = contentScrollTop;
      activeModalContent.dataset.scrollTop = contentScrollTop;
    }
    activeModal.classList.add('fadeOut');
    setTimeout(() => {
      activeModal.classList.add('hidden');
      activeModal.classList.remove('fadeOut');
      modalContainer.prepend(activeModal);
    }, modalTransitionDuration);
  }

  setModalUiTheme(modalId, theme || (config.uiTheme === 'auto' ? systemName : config.uiTheme));

  const modal = document.getElementById(modalId);

  if (modalData) {
    for (let k of Object.keys(modalData))
      modal.dataset[k] = modalData[k];
  }
  modal.classList.add('fadeIn');
  modal.classList.remove('hidden');

  const modalContent = modal.querySelector('.modalContent');
  if (modalContent.dataset.scrollTop) {
    modalContent.scrollTop = Math.min(modalContent.dataset.scrollTop, modalContent.scrollHeight);
    delete modalContent.dataset.scrollTop;
  }

  setTimeout(() => {
    modalContainer.classList.remove('fadeIn');
    modal.classList.remove('fadeIn');
  }, modalTransitionDuration);
}

function closeModal() {
  const modalFadeOutContainer = document.getElementById('modalFadeOutContainer');
  if (modalFadeOutContainer.childElementCount)
    return;
  const modalContainer = document.getElementById('modalContainer');
  const activeModal = document.querySelector('.modal:not(.hidden)');
  const modalContent = activeModal?.querySelector('.modalContent');
  if (modalContent) modalContent.dataset.lastScrollTop = modalContent.scrollTop;
  if (!modalContainer.dataset.lastModalId) {
    modalContainer.classList.add('fadeOut', 'hidden');
    // if (activeModal?.id === 'wikiModal')
    //   document.getElementById('wikiFrame').src = '';
    setTimeout(() => modalContainer.classList.remove('fadeOut'), modalTransitionDuration);
  }
  if (activeModal) {
    modalFadeOutContainer.appendChild(activeModal);
    activeModal.classList.add('fadeOut');
    setTimeout(() => {
      activeModal.classList.add('hidden');
      activeModal.classList.remove('fadeOut');
      modalContainer.prepend(activeModal);
    }, modalTransitionDuration);
  }

  setModalUiTheme('confirmModal', config.uiTheme === 'auto' ? systemName : config.uiTheme);

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
  const modalCloseButtons = document.querySelectorAll('#modalContainer .modalClose');
  for (let button of modalCloseButtons)
    button.onclick = closeModal;
  document.querySelector('#modalContainer .modalOverlay').onclick = closeModal;
}

function showConfirmModal(message, okCallback, cancelCallback) {
  const modalContainer = document.getElementById('confirmModalContainer');

  const modal = document.getElementById('confirmModal');
  
  if (!modal.classList.contains('hidden')) {
    setTimeout(() => showConfirmModal(message, okCallback, cancelCallback), modalTransitionDuration);
    return;
  }

  modalContainer.classList.remove('fadeOut', 'hidden');
  modalContainer.classList.add('fadeIn');

  modal.querySelector('.confirmMessage').innerHTML = getMassagedLabel(message, true);

  modal.querySelector('.confirmOkButton').onclick = () => closeConfirmModal(okCallback);
  modal.querySelector('.confirmCancelButton').onclick = () => closeConfirmModal(cancelCallback);

  modal.classList.add('fadeIn');
  modal.classList.remove('hidden');

  modal.querySelector('.modalClose').onclick = () => closeConfirmModal(cancelCallback);
  modalContainer.querySelector('.modalOverlay').onclick = () => closeConfirmModal(cancelCallback);

  setTimeout(() => {
    modalContainer.classList.remove('fadeIn');
    modal.classList.remove('fadeIn');
  }, modalTransitionDuration);
}

function closeConfirmModal(callback) {
  const modalContainer = document.getElementById('confirmModalContainer');
  const modal = document.getElementById('confirmModal');

  modalContainer.classList.add('fadeOut');
  modal.classList.add('fadeOut');

  setTimeout(() => {
    modal.classList.add('hidden');
    modal.classList.remove('fadeOut');
    modalContainer.classList.add('hidden');
    modalContainer.classList.remove('fadeOut');
  }, modalTransitionDuration);

  if (callback)
    callback();
}

document.getElementById('enterNameForm').onsubmit = function () {
  setName(document.getElementById('nameInput').value);
};

{
  function oninputYnomoji() {
    const ynomojiPattern = /:([a-z0-9_\-]+(?::|$)|$)/gi;
    const ynomojiContainer = document.getElementById('ynomojiContainer');
    const detachedYnomoji = ynomojiContainer.parentElement.removeChild(ynomojiContainer);
    switch (this.id) {
      case 'chatInput':
        const enterNameContainer = document.getElementById('enterNameContainer');
        enterNameContainer.parentElement.insertBefore(detachedYnomoji, enterNameContainer);
        break;
      case 'editScheduleDescription':
        this.parentElement.appendChild(detachedYnomoji);
        break;
    }
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
          if (this.value === currentInputValue)
            ynomojiContainer.classList.remove('hidden');
        }, 1000);
      }
    } else
      ynomojiContainer.classList.add('hidden');
  };

  function onfocusYnomoji() {
    this.oninput();
    ynomojiElement = this;
  }

  for (const inputElement of ['chatInput', 'editScheduleDescription']) {
    const element = document.getElementById(inputElement);
    element.oninput = oninputYnomoji;
    element.onfocus = onfocusYnomoji;
  }
  document.getElementById('chatboxContainer').onmouseleave = document.getElementById('scheduleEditModal').onmouseleave = function () { document.getElementById('ynomojiContainer').classList.add('hidden'); };
}

document.getElementById('privateModeButton').onclick = function () {
  if (!sessionWs)
    return;

  this.classList.toggle('toggled');
  document.getElementById('layout').classList.toggle('privateMode', this.classList.contains('toggled'));
  config.privateMode = this.classList.contains('toggled');
  updateConfig(config);

  sendSessionCommand('pr', [ config.privateMode ? 1 : 0 ]);

  if (connStatus == 1 || connStatus == 3)
    onUpdateConnectionStatus(config.privateMode ? 3 : 1);

  easyrpgPlayer.api.sessionReady();
};

let reconnectCooldownTimer;

document.getElementById('reconnectButton').ondblclick = function () {
  if (reconnectCooldownTimer || connStatus != 2)
    return;

  this.classList.add('active', 'disabled');

  const reconnectButton = this;
  let reconnected;

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
}

document.getElementById('reconnectButton').onclick = function () {
  if (reconnectCooldownTimer || connStatus == 2)
    return;

  this.classList.add('active', 'disabled');

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

document.getElementById('toggleNextLocationButton').onclick = function () {
  document.getElementById('nextLocationContainer').classList.toggle('hideContents');
};

document.getElementById('chatButton').onclick = function () {
  this.classList.toggle('toggled');
  document.getElementById('layout').classList.toggle('hideChat');
  onResize();
  config.disableChat = this.classList.contains('toggled');
  updateConfig(config);
};

if (gameId === '2kki') {
  document.getElementById('explorerButton').onclick = function () {
    this.classList.toggle('toggled');
    document.getElementById('layout').classList.toggle('explorer');
    onResize();
    config.explorer = this.classList.contains('toggled');
    updateConfig(config);
  };
}

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

document.getElementById('settingsButton').onclick = () => openModal('settingsModal');

document.getElementById('muteButton').onclick = function () {
  if (easyrpgPlayer.initialized)
    easyrpgPlayer.api.toggleMute();
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
  if (easyrpgPlayer.initialized)
    easyrpgPlayer.api.setNametagMode(this.value);
};

document.getElementById('wikiLinkMode').onchange = function () {
  globalConfig.wikiLinkMode = parseInt(this.value);
  updateConfig(globalConfig, true);
};

document.getElementById('saveReminder').onchange = function () {
  setSaveReminder(parseInt(this.value));
};

document.getElementById('playerSoundsButton').onclick = () => {
  if (easyrpgPlayer.initialized)
    easyrpgPlayer.api.togglePlayerSounds();
};

document.getElementById('hideLocationButton').onclick = function () {
  if (!sessionWs)
    return;

  this.classList.toggle('toggled');
  config.hideLocation = this.classList.contains('toggled');
  updateConfig(config);

  sendSessionCommand('hl', [ config.hideLocation ? 1 : 0 ]);
};

if (gameId === '2kki') {
  document.getElementById('enableExplorerButton').onclick = function () {
    this.classList.toggle('toggled');
    const toggled = this.classList.contains('toggled');
    [ document.getElementById('explorerButton'), document.getElementById('explorerContainer') ].forEach(el => {
      if (!el)
        return;
      el.style.display = toggled ? null : 'none';
    });
    if (!toggled && config.explorer)
      document.getElementById('explorerButton').click();
    onResize();
    config.enableExplorer = toggled;
    updateConfig(config);
  };
  
  document.getElementById('toggleQuestionablePreloadsButton').onclick = function () {
    this.classList.toggle('toggled');
    globalConfig.questionablePreloads = this.classList.contains('toggled');
    updateConfig(globalConfig, true);
  };
}

document.getElementById('immersionModeButton').onclick = function () {
  this.classList.toggle('toggled');
  const toggled = this.classList.contains('toggled');
  if (toggled) {
    document.querySelector('.chatboxTab[data-tab-section="chat"]').click();
    document.getElementById('chatTabMap').click();
  }
  document.getElementById('layout').classList.toggle('immersionMode', toggled);
  if (toggled && config.explorer)
    document.getElementById('explorerButton').click();
  else
    onResize();
  config.immersionMode = toggled;
  updateConfig(config);
};

document.getElementById('mobileControlsButton').onclick = function () {
  this.classList.toggle('toggled');
  const toggled = !this.classList.contains('toggled');
  globalConfig.mobileControls = toggled;
  for (const elem of document.querySelectorAll('#dpad, #apad'))
    elem.classList.toggle('hidden', !toggled);
  updateConfig(globalConfig, true);
};

document.getElementById('mobileControl').oninput = function() {
  setMobileControlType(this.value);
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

document.getElementById('toggleSchedulesButton').onclick = function () {
  const toggled = this.classList.toggle('toggled');
  document.getElementById('schedulesButton').classList.toggle('hidden', toggled);
  globalConfig.hideSchedules = toggled;
  updateConfig(globalConfig, true);
};

document.getElementById('togglePreloadsButton').onclick = function () {
  this.classList.toggle('toggled');
  const toggled = this.classList.contains('toggled');
  for (let row of document.getElementsByClassName('preloadRow'))
    row.classList.toggle('hidden', !toggled);
  globalConfig.preloads = toggled;
  updateConfig(globalConfig, true);
};

document.getElementById('gameChatButton').onclick = function () {
  this.classList.toggle('toggled');
  const toggled = this.classList.contains('toggled');
  globalConfig.gameChat = toggled;
  document.getElementById('gameChatContainer').classList.toggle('hidden', !toggled);
  const gameChatRows = document.getElementsByClassName('gameChatRow');
  for (let row of gameChatRows)
    row.classList.toggle('hidden', !toggled);
  updateConfig(globalConfig, true);
};

document.getElementById('gameChatGlobalButton').onclick = function () {
  this.classList.toggle('toggled');
  const toggled = this.classList.contains('toggled');
  globalConfig.gameChatGlobal = toggled;
  if (!toggled && gameChatModeIndex === 1)
    cycleGameChatMode();
  updateGameChatMessageVisibility();
  updateConfig(globalConfig, true);
};

document.getElementById('gameChatPartyButton').onclick = function () {
  this.classList.toggle('toggled');
  const toggled = this.classList.contains('toggled');
  globalConfig.gameChatParty = toggled;
  if (!toggled && gameChatModeIndex === 2)
    cycleGameChatMode();
  updateGameChatMessageVisibility();
  updateConfig(globalConfig, true);
};

document.getElementById('tabToChatButton').onclick = function () {
  this.classList.toggle('toggled');
  globalConfig.tabToChat = !this.classList.contains('toggled');
  updateConfig(globalConfig, true);
};

document.getElementById('playMentionSoundButton').onclick = function () {
  this.classList.toggle('toggled');
  globalConfig.playMentionSound = !this.classList.contains('toggled');
  updateConfig(globalConfig, true);
};

document.getElementById('blurScreenshotEmbedsButton').onclick = function () {
  globalConfig.blurScreenshotEmbeds = this.classList.toggle('toggled');
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

document.getElementById('blocklistButton').onclick = function () {
    updateBlocklist(true);
    openModal('blocklistModal', null, 'settingsModal');
};

initAccountControls();
initSaveSyncControls();
initLocationControls();
initBadgeControls();
initSaveDataControls();
initPartyControls();
initScreenshotControls();
initEventControls();
initRankingControls();
initReportControls();

document.getElementById('nexusButton').onclick = () => window.location = '../';

if (gameId === '2kki') {
  document.getElementById('2kkiVersion').innerText = document.querySelector('meta[name="2kkiVersion"]').content || '?';
  // Yume 2kki Explorer doesn't support mobile
  if (hasTouchscreen)
    document.getElementById('explorerControls').remove();

  document.getElementById('explorerUndiscoveredLocationsLink').onclick = () => {
    const modal = document.getElementById('explorerUndiscoveredLocationsModal');
    const undiscoveredLocations = document.getElementById('explorerUndiscoveredLocations');
    undiscoveredLocations.innerHTML = '';
    openModal(modal.id);
    addLoader(modal);
    apiFetch('explorerlocations')
      .then(response => {
        if (!response.ok)
          throw new Error(response.statusText);
        return response.json();
      }).then(jsonResponse => {
        removeLoader(modal);
        const hasUndiscoveredLocations = Array.isArray(jsonResponse) && jsonResponse.length;
        undiscoveredLocations.classList.toggle('hidden', !hasUndiscoveredLocations);
        document.getElementById('explorerUndiscoveredLocationsEmptyLabel').classList.toggle('hidden', hasUndiscoveredLocations);
        if (!hasUndiscoveredLocations)
          return;

        // TODO: Localization
        const sortedLocations = jsonResponse
          .map(l => { return { title: l }; })
          .sort((a, b) => a.title.localeCompare(b.title, { sensitivity: 'base' }));

        undiscoveredLocations.innerHTML = `<li>${getLocalized2kkiLocationsHtml(sortedLocations, '</li><li>')}</li>`;
      }).catch(() => {
        removeLoader(modal);
        closeModal(modal);
      });
  };
}

Array.from(document.querySelectorAll('.playerCountLabel')).forEach(pc => {
  pc.onclick = function () {
    if (config.privateMode)
      return;
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
    else if (activeChatboxTabSection === 'players')
      document.getElementById("incomingFriendRequestCountContainer").classList.add('hidden');
    else if (activeChatboxTabSection === 'parties') {
      updatePartyList();
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
    messages.classList.toggle('fullBg', tabIndex === 3 && gameFullBgUiThemes.indexOf(joinedPartyUiTheme) > -1);
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

    document.getElementById('chatbox').classList.toggle('friendsPlayers', tabIndex === 1);
    document.getElementById('chatbox').classList.toggle('partyPlayers', tabIndex === 2);
    document.getElementById('partyPlayerList').classList.toggle('fullBg', tabIndex === 2 && gameFullBgUiThemes.indexOf(joinedPartyUiTheme) > -1);

    if (saveConfig) {
      config.playersTabIndex = tabIndex;
      updateConfig(config);
    }

    if (tabIndex === 2 && joinedPartyId)
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

  if (gameId === '2kki' && content.classList.contains('loggedIn') && layout.classList.contains('explorer')) {
    const explorerContainer = document.getElementById('explorerContainer');
    const explorerParent = window.innerWidth >= 1051 && window.innerHeight >= 1000 && !document.fullscreenElement
      ? document.getElementById('mainContainer')
      : document.getElementById('chatboxContainer');
    if (explorerContainer.parentElement !== explorerParent)
      explorerParent.appendChild(explorerContainer);
    const explorerFrame = document.getElementById('explorerFrame');
    const explorerUndiscoveredLocationsLink = document.getElementById('explorerUndiscoveredLocationsLink');
    explorerUndiscoveredLocationsLink.style.left = `${explorerFrame.offsetLeft}px`;
  }

  updateCanvasFullscreenSize();
}

function updateCanvasOverlays() {
  const contentElement = document.getElementById('content');
  const canvasElement = document.getElementById('canvas');
  const gameChatContainer = document.getElementById('gameChatContainer');
  const locationDisplayContainer = document.getElementById('locationDisplayContainer');

  if (document.fullscreenElement) {
    const canvasRect = canvas.getBoundingClientRect();
    gameChatContainer.style.top = locationDisplayContainer.style.top = `${canvasRect.y}px`;
    gameChatContainer.style.left = locationDisplayContainer.style.left = `${canvasRect.x}px`;
  } else {
    gameChatContainer.style.top = locationDisplayContainer.style.top = `${canvasElement.offsetTop - contentElement.scrollTop}px`;
    gameChatContainer.style.left = locationDisplayContainer.style.left = `${canvasElement.offsetLeft}px`;
  }

  let mapChatWidth = canvasElement.offsetWidth;
  let mapChatHeight = canvasElement.offsetHeight / 2;

  if (!document.fullscreenElement && contentElement.classList.contains('downscale')) {
    if (contentElement.classList.contains('downscale2')) {
      mapChatWidth *= 2;
      mapChatHeight *= 2;
    } else {
      mapChatWidth *= 1 / 0.75;
      mapChatHeight *= 1 / 0.75;
    }
  }

  locationDisplayContainer.style.maxWidth = `${canvasElement.offsetWidth}px`;
  gameChatContainer.style.width = `${mapChatWidth}px`;
  gameChatContainer.style.height = `${mapChatHeight}px`;
  gameChatContainer.style.marginTop = `calc(${canvasElement.offsetHeight / 2}px * var(--canvas-scale))`;
}

function updateYnomojiContainerPos(isScrollUpdate, chatInput) {
  if (!chatInput) chatInput = document.getElementById('chatInput');
  const expandDown = chatInput.dataset.ynomoji === 'expandDown';
  const chatboxContainer = document.getElementById('chatboxContainer');
  const ynomojiContainer = document.getElementById('ynomojiContainer');
  const isFullscreen = document.fullscreenElement;
  const isWrapped =  window.getComputedStyle(document.getElementById('layout')).flexWrap === 'wrap';
  const isDownscale2 = document.getElementById('content').classList.contains('downscale2');
  const isFullscreenSide = isFullscreen && (window.innerWidth > 1050 || window.innerHeight < 595);
  if (expandDown) {
    ynomojiContainer.style.removeProperty('bottom');
    ynomojiContainer.style.top = `${chatInput.offsetTop + chatInput.offsetHeight + 2}px`;
    // TODO hasTouchscreen && ((isWrapped && isDownscale2) || isFullscreenSide), only used for editScheduleDescription
  } else {
    ynomojiContainer.style.removeProperty('top');
    ynomojiContainer.style.bottom = hasTouchscreen && ((isWrapped && isDownscale2) || isFullscreenSide)
      ? `calc((100% - ${chatInput.offsetTop}px) + max(${isFullscreen ? 6 : 1}rem + 2 * var(--controls-size) - (100% - ${chatInput.offsetTop}px - ${isFullscreen && !isFullscreenSide ? `(${chatboxContainer.style.marginTop} - 24px)` : '0px'}) - var(--content-scroll), 0px))`
      : `calc(100% - ${chatInput.offsetTop}px)`;
  }
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
  const messages = document.getElementById('messages');
  const partyPlayerList = document.getElementById('partyPlayerList');

  fastdom.measure(() => {
    const backgroundSize = chatboxContainer.classList.contains('fullBg') ? getComputedStyle(chatboxContainer).backgroundSize : null;
    const backgroundPositionY = `${chatboxContainer.offsetTop - partyPlayerList.getBoundingClientRect().top}px`;
    const hasFlexWrap = getComputedStyle(layout).flexWrap === 'wrap';
    const lastTab = chatboxTabs[chatboxTabs.length - 1];
    const lastTabOffset = lastTab.offsetLeft + lastTab.offsetRight;

    fastdom.mutate(() => {
      for (let tab of chatboxTabs) {
        tab.style.backgroundSize = backgroundSize;
        fastdom.measure(() => {
          const posx = `${-8 + tab.parentElement.offsetLeft - tab.getBoundingClientRect().left}px`;
          const posy = `${chatboxContainer.offsetTop - tab.parentElement.getBoundingClientRect().top}px`;
          fastdom.mutate(() => {
            tab.style.backgroundPositionX = posx;
            tab.style.backgroundPositionY = posy;
          });
        });
      }

      messages.style.backgroundPositionY = partyPlayerList.style.backgroundPositionY = backgroundPositionY;
      if (!layout.classList.contains('immersionMode') && !document.fullscreenElement && hasFlexWrap) {
        const offsetLeft = `${lastTabOffset - 24}px`;
        chatboxInfo.style.marginInlineStart = offsetLeft;
        chatboxInfo.style.marginBottom = '-32px';
        fastdom.measure(() => {
          if (chatboxInfo.offsetHeight >= 72)
            fastdom.mutate(() => chatboxInfo.setAttribute('style', ''));
        })
      } else
        chatboxInfo.setAttribute('style', '');
    });
  });
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
    const showExplorer = gameId === '2kki' && contentElement.classList.contains('loggedIn') && layoutElement.classList.contains('explorer');
    let scaleX = window.innerWidth / canvasElement.offsetWidth;
    let scaleY = window.innerHeight / canvasElement.offsetHeight;
    // not all clients have good scaling abilities, so choose something that will be amenable to good quality.
    const scaleFraction = contentElement.classList.contains('downscale') ? 0.25 : 0.5;
    scaleX -= scaleX % scaleFraction;
    scaleY -= scaleY % scaleFraction;
    const scale = Math.max(Math.min(scaleX, scaleY), 0.5);
    canvasElement.style.transform = `scale(${scale})`;
    document.documentElement.style.setProperty('--canvas-scale', scale);

    if (window.innerWidth > 1050 || window.innerHeight < 595) {
      const chatboxContainerWidth = chatboxContainerElement.offsetWidth - 24;
      chatboxContainerMarginTop = '24px';
      const freeWidth = window.innerWidth - (canvasElement.offsetWidth * scale) - chatboxContainerWidth
      if (freeWidth >= 16) {
        if (showChat) {
          // if we haven't much width left, use all we have so that the chatbox is not so close
          const flushedWidth = freeWidth <= 48 ? freeWidth : 0;
          canvasContainerPaddingRight = `${chatboxContainerWidth + flushedWidth}px`;
          leftControlsMaxHeight = `${canvasElement.offsetHeight * scale}px`;
        }
      } else
        chatboxOverlap = true;
    } else {
      const canvasScaledHeight = canvasElement.offsetHeight * scale;
      const unusedHeight = window.innerHeight - (canvasScaledHeight + 32);
      let chatboxActualHeight = unusedHeight;
      if (showExplorer)
        chatboxActualHeight -= (document.getElementById('explorerFrame').offsetHeight + 12);
      if (unusedHeight >= 376 && showChat) {
        canvasContainerMarginTop = `-${(window.innerHeight - canvasScaledHeight) / 2}px`
        chatboxContainerMarginTop = `${(window.innerHeight - unusedHeight) - 40}px`;
        chatboxHeight = `${chatboxActualHeight}px`;
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
    leftControlsMaxHeight = `${canvasElement.offsetHeight}px`;
  }

  canvasContainerElement.style.paddingInlineEnd = canvasContainerPaddingRight;
  canvasContainerElement.style.marginTop = canvasContainerMarginTop;
  chatboxContainerElement.style.marginTop = chatboxContainerMarginTop;
  layoutElement.classList.toggle('chatboxOverlap', chatboxOverlap);
  document.getElementById('chatbox').style.height = chatboxHeight;
  document.getElementById('leftControls').style.maxHeight = leftControlsMaxHeight;

  messages.scrollTop = messages.scrollHeight;

  updateYnomojiContainerPos();
  updateCanvasOverlays();
}

window.onresize = function () { setTimeout(onResize, 0); };

document.addEventListener('fullscreenchange', updateCanvasFullscreenSize);

document.getElementById('content').addEventListener('scroll', function () {
  document.documentElement.style.setProperty('--content-scroll', `${this.scrollTop}px`);
  if (hasTouchscreen)
    updateYnomojiContainerPos(true);
  updateCanvasOverlays();
});

function toggleControls(show) {
  document.getElementById('canvas').classList.toggle('fsnocursor', !show);
  document.getElementById('controls').classList.toggle('fshidden', !show);
}

let fullscreenControlsTimer;

function setFullscreenControlsHideTimer() {
  if (fullscreenControlsTimer)
    clearTimeout(fullscreenControlsTimer);
  fullscreenControlsTimer = setTimeout(function () {
    if (!document.querySelector("#controls button:hover") || hasTouchscreen)
      toggleControls(false);
    fullscreenControlsTimer = null;
  }, 5000);
}

document.onmousemove = function (ev) {
  if (document.fullscreenElement && !ev.dataTransfer) {
    toggleControls(true);
    setFullscreenControlsHideTimer();
  }
};

async function withTimeout(duration, prom) {
  let handle;
  const timeout = new Promise(resolve => handle = setTimeout(() => resolve('__timeout__'), duration));
  const res = await Promise.race([timeout, prom]);
  if (res === '__timeout__') {
    console.warn(`timed out after ${duration} ms`, prom);
  }
  clearTimeout(handle);
  return res;
}

const rtlLangs = ['ar'];
function setLang(lang, isInit) {
  if (rtlLangs.includes(lang))
    document.documentElement.setAttribute('dir', 'rtl');
  else
    document.documentElement.removeAttribute('dir');
  globalConfig.lang = lang;
  initBlocker = initBlocker.then(() => withTimeout(800, 
    fetchNewest(`../data/${gameId}/Language/${lang}/meta.ini`).then(response => { // Prevent a crash when the --language argument is used and the game doesn't have a Language folder
      if (response.ok && response.status < 400 && isInit && gameIds.indexOf(gameId) > -1) {
        easyrpgPlayer.language = (gameDefaultLangs.hasOwnProperty(gameId) ? gameDefaultLangs[gameId] !== lang : lang !== 'en') ? lang : 'default';
      }
    })
  ));
  initLocalization(isInit);
  if (!isInit)
    updateConfig(globalConfig, true);
}

let saveReminderHandle;
function resetSaveReminder() {
  if (saveReminderHandle) clearTimeout(saveReminderHandle);
  saveReminderHandle = null;
  if (!globalConfig.saveReminder) return;
  saveReminderHandle = setTimeout(() => {
    showSaveSyncToastMessage('saveReminder', 'save', 1)
    resetSaveReminder();
  }, globalConfig.saveReminder * 60000);
}

function setSaveReminder(saveReminder, isInit) {
  globalConfig.saveReminder = saveReminder;
  if (!isInit)
    updateConfig(globalConfig, true);
  resetSaveReminder();
}

function setName(name, isInit) {
  globalConfig.name = name;
  if (!isInit)
    updateConfig(globalConfig, true);
}

function setSoundVolume(value, isInit) {
  if (isNaN(value))
    return;
  if (easyrpgPlayer.initialized && !config.mute)
    easyrpgPlayer.api.setSoundVolume(value);
  globalConfig.soundVolume = value;
  if (!isInit)
    updateConfig(globalConfig, true);
}

function setMusicVolume(value, isInit) {
  if (isNaN(value))
    return;
  if (easyrpgPlayer.initialized && !config.mute)
    easyrpgPlayer.api.setMusicVolume(value);
  globalConfig.musicVolume = value;
  if (!isInit)
    updateConfig(globalConfig, true);
}

function setMobileControlType(value, isInit) {
  if (!hasTouchscreen) return;
  globalConfig.mobileControlsType = value;
  if (!isInit)
    updateConfig(globalConfig, true);

  updateMobileControlType();
}

let availableControlType = 'default';
function updateMobileControlType() {
  if (!hasTouchscreen) return;
  const isHorizontal = !((screen.orientation.angle - 90) % 180);

  const dpad = document.getElementById('dpad');
  const joystick = document.getElementById('joystick');

  availableControlType = isHorizontal ? globalConfig.mobileControlsType : 'default';
  const hasJoystick = availableControlType === 'joystick' || availableControlType === 'dpad';
  dpad.classList.toggle('hasJoystick', hasJoystick);
  joystick.classList.toggle('hidden', !hasJoystick);

  for (const control of joystick.querySelectorAll('[data-style]')) {
    control.classList.toggle('hidden', control.dataset.style !== availableControlType);
  }
}

if (hasTouchscreen)
  screen.orientation.addEventListener('change', updateMobileControlType);

function onSelectUiTheme(e) {
  const modalContainer = document.getElementById('modalContainer');
  if (modalContainer.dataset.lastModalId?.endsWith('createPartyModal'))
    setPartyTheme(e.target.dataset.uiTheme);
  else if (modalContainer.dataset.lastModalId?.endsWith('scheduleEditModal'))
    setScheduleTheme(e.target.dataset.uiTheme);
  else
    setUiTheme(e.target.dataset.uiTheme);
  setModalUiTheme(null, e.target.dataset.uiTheme === 'auto' ? systemName : e.target.dataset.uiTheme, true);
}

function initLocalization(isInitial) {
  document.getElementsByTagName('html')[0].lang = globalConfig.lang;
  fetchNewest(`lang/${globalConfig.lang}.json`)
    .then(response => response.json())
    .then(function (jsonResponse) {
      localizedVersion = jsonResponse.version[gameId];
      if (localizedVersion) {
        const versionElement = document.querySelector('.version');
        const versionMeta = document.querySelector(`meta[name="${gameId}Version"]`);
        if (versionElement && versionMeta)
          versionElement.innerHTML = getMassagedLabel(localizedVersion.label.replace('{VERSION}', getLocalizedVersion(versionMeta.content)));
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

      const gameSelects = Array.from(document.querySelectorAll('.gameSelect'));
      gameSelects.forEach(select => {
        Object.keys(localizedMessages.games).forEach(game => {
          const matchingOption = select.querySelector(`option[value='${game}']`);
          if (matchingOption)
            matchingOption.innerText = localizedMessages.games[game];
        });
      });

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
              if (!response.ok && response.status === 404 && gameId !== 'tsushin') { // Don't display that the game is not localized for Yume Tsushin since it uses a conlang
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
        locI18next.init(i18next, locI18nextOptions)('[data-i18n]');
        const tooltipElements = document.querySelectorAll('[title]');
        for (let el of tooltipElements) {
          addTooltip(el, el.title, true, !el.classList.contains('helpLink'));
          el.removeAttribute('title');
        }
      });
    });
}

function getLocalizedVersion(versionText) {
  let versionLabel = versionText || '?';
  if (gameId !== '2kki')
    return versionLabel;
  const substituteKeys = Object.keys(localizedVersion.substitutes);
  for (let sk of substituteKeys)
    versionLabel = versionLabel.replace(sk, localizedVersion.substitutes[sk]);
  return versionLabel;
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
  const fileName = lang === 'en' ? 'config' : lang;
  return fetchNewest(`locations/${game}/${fileName}.json`)
    .then(response => {
      return response.ok ? response.json() : Promise.reject();
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
      gameLocalizedLocationUrlRoots[game] = gameLocationUrlRoots[game];
      gameLocalizedMapLocations[game] = gameMapLocations[game];
      if (game === gameId) {
        localizedLocationUrlRoot = locationUrlRoot;
        localizedMapLocations = mapLocations;
      }
      initLocalizedLocations(game);
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
  
  for (let mapId in gameMapLocations[game]) {
    const locations = gameMapLocations[game][mapId];
    if (!locations)
        continue;
    if (locations.hasTitle()) // Text location
      trySetLocalizedLocation(locations, gameLocalizedMapLocations[game][mapId]);
    else if (Array.isArray(locations)) // Multiple locations
      locations.forEach((location, i) => trySetLocalizedLocation(location, gameLocalizedMapLocations[game][mapId][i]));
    else {
      for (let key of Object.keys(locations)) {
        const locationsInner = gameMapLocations[game][mapId][key];
        if (!locationsInner)
            continue;
        if (locationsInner.hasTitle())
          trySetLocalizedLocation(locationsInner, gameLocalizedMapLocations[game][mapId][key]);
        else
          locationsInner.forEach((location, i) => trySetLocalizedLocation(location, gameLocalizedMapLocations[game][mapId][key][i]));
      }
    }
  }
}

/**
 * @param {Record<string, MapDescriptor>} mapLocations
 * @return {MapTitle[]}
 */
function getMapLocationsArray(mapLocations, mapId, prevMapId, x, y) {
  if (mapId in mapLocations) {
    const locations = mapLocations[mapId];
    if (locations.hasTitle()) // Text location
      return [ locations ];
    if (Array.isArray(locations)) // Multiple locations
      return getMapLocationsFromArray(locations, x, y);
    if (prevMapId in locations) {// Previous map ID matches a key
      if (Array.isArray(locations[prevMapId]))
        return getMapLocationsFromArray(locations[prevMapId], x, y);
      return [ locations[prevMapId] ];
    }
    if ('else' in locations) { // Else case
      if (locations.else.hasTitle())
        return [ locations.else ];
      return getMapLocationsFromArray(locations.else, x, y);
    }
  }
}

/**
 * @param {MapTitle[]} locations
 * @return {MapTitle[]}
 */
function getMapLocationsFromArray(locations, x, y) {
  if (Array.isArray(locations) && locations[0].hasOwnProperty('coords') && x !== null && y !== null) {
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
  const localizedLocations = gameLocalizedMapLocations[game]?.[mapId];
  if (localizedLocations) {
    // locations have the same type as localizedLocations
    const locations = gameMapLocations[game][mapId];
    if (localizedLocations.hasTitle()) // Text location
      return getLocalizedLocation(game, localizedLocations, locations, false, forDisplay);
    if (Array.isArray(localizedLocations)) // Multiple locations
      return getMapLocationsFromArray(localizedLocations, x, y).map((l, i) => getLocalizedLocation(game, l, getMapLocationsFromArray(locations, x, y)[i], false, forDisplay)).join(separator);
    if (prevMapId in localizedLocations) { // Previous map ID matches a key
      if (Array.isArray(localizedLocations[prevMapId]))
        return getMapLocationsFromArray(localizedLocations[prevMapId], x, y).map((l, i) => getLocalizedLocation(game, l, getMapLocationsFromArray(locations[prevMapId], x, y)[i], false, forDisplay)).join(separator);
      return getLocalizedLocation(game, localizedLocations[prevMapId], locations[prevMapId]);
    }
    if ('else' in localizedLocations) { // Else case
      if (localizedLocations.else.hasTitle())
        return getLocalizedLocation(game, localizedLocations.else, locations.else, false, forDisplay);
      return getMapLocationsFromArray(localizedLocations.else, x, y).map((l, i) => getLocalizedLocation(game, l, getMapLocationsFromArray(locations.else, x, y)[i], false, forDisplay)).join(separator);
    }
  }
  
  return localizedMessages.location.unknownLocation;
}

/**
 * @param {number | `0${number}`} prevMapId 
 */
function getLocalizedMapLocationsHtml(game, mapId, prevMapId, x, y, separator) {
  if (gameLocalizedMapLocations[game]?.hasOwnProperty(mapId)) {
    const localizedLocations = gameLocalizedMapLocations[game][mapId];
    const locations = gameMapLocations[game][mapId];
    let locationsHtml;
    if (localizedLocations.hasTitle()) // Text location
      locationsHtml = getLocalizedLocation(game, localizedLocations, locations, true);
    else if (Array.isArray(localizedLocations)) // Multiple locations
      locationsHtml = getMapLocationsFromArray(localizedLocations, x, y).map((l, i) => getLocalizedLocation(game, l, getMapLocationsFromArray(locations, x, y)[i], true)).join(separator);
    else if (prevMapId in localizedLocations) { // Previous map ID matches a key
      if (Array.isArray(localizedLocations[prevMapId]))
        locationsHtml = getMapLocationsFromArray(localizedLocations[prevMapId], x, y).map((l, i) => getLocalizedLocation(game, l, getMapLocationsFromArray(locations[prevMapId], x, y)[i], true)).join(separator);
      else
        locationsHtml = getLocalizedLocation(game, localizedLocations[prevMapId], locations[prevMapId], true);
    } else if ('else' in localizedLocations) {  // Else case
      if (localizedLocations.else.hasTitle())
        locationsHtml = getLocalizedLocation(game, localizedLocations.else, locations.else, true);
      else
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
    if (mapLocations.hasTitle()) {
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

/**
 * @param {MapTitle} location 
 * @param {MapTitle} locationEn 
 */
function getLocalizedLocation(game, location, locationEn, asHtml, forDisplay) {
  let template = getMassagedLabel(localizedMessages[forDisplay ? 'locationDisplay' : 'location'].template);
  let ret;
  let locationValue;

  if (asHtml) {
    template = template.replace(/}([^{]+)/g, '}<span class="infoLabel">$1</span>');
    if (gameLocalizedLocationUrlRoots[game] && location.urlTitle !== null)
      locationValue = `<a href="${gameLocalizedLocationUrlRoots[game]}${location.urlTitle || location.title}" target="_blank" class="wikiLink">${location.title}</a>`;
    else if (gameLocationUrlRoots[game] && gameLocalizedLocationUrlRoots[game] !== null && locationEn.urlTitle !== null)
      locationValue = `<a href="${gameLocationUrlRoots[game]}${locationEn.urlTitle || locationEn.title}" target="_blank" class="wikiLink">${location.title}</a>`;
    else
      locationValue = getInfoLabel(location.title);
  } else
    locationValue = location.title;

  ret = template.replace('{LOCATION}', locationValue);
  
  if (template.indexOf('{LOCATION_EN}') > -1) {
    let locationValueEn;
    if (asHtml) {
      if (gameLocationUrlRoots[game] && locationEn.urlTitle !== null)
        locationValueEn = `<a href="${gameLocationUrlRoots[game]}${locationEn.urlTitle || locationEn.title}" target="_blank" class="wikiLink">${locationEn.title}</a>`;
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
    label = label.replaceAll('\n', '<br>');
  if (langLabelMassageFunctions.hasOwnProperty(globalConfig.lang) && label)
    return langLabelMassageFunctions[globalConfig.lang](label, isUI);
  return label;
}

function getInfoLabel(label) {
  return `<span class="infoLabel">${label}</span>`;
}

function queryAndSetWikiMaps(locations) {
  const maps = [];
  const massagedLocationNames = locations.map(l => {
    let locationName = l.urlTitle || l.title;
    const colonIndex = locationName.indexOf(':');
    if (colonIndex > -1)
      locationName = locationName.slice(0, colonIndex);
    return locationName;
  });
  Promise.all(massagedLocationNames.map(l => wikiApiFetch('maps', `location=${l}`).then(response => {
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
    gameMapHandle = new WeakRef(mapControls.firstElementChild);
    // if (!document.getElementById('wikiModal').classList.contains('hidden'))
    //   mapControls.firstElementChild.onclick();
  } else {
    gameMapHandle = new WeakRef({});
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
  ret.classList.add('mapButton', 'unselectable', 'iconButton');
  addTooltip(ret, label, true);
  // this is abusing the onclick event, but basically if we call it directly we can differentiate
  // an actual click vs. a synthetic event.
  ret.onclick = (ev) => {
    gameMapHandle = new WeakRef(ret);
    const canvas = document.getElementById('canvas');
    // canvas.addEventListener('keydown', () => {
    //   document.getElementById('modalContainer').style.opacity = '0.42';
    // }, { once: true });
    // if (ev)
    //   document.getElementById('modalContainer').style.opacity = '';
    openWikiLink(url, false, true);
    canvas.focus();
  };
  ret.innerHTML = '<svg viewbox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="m0 0l4 2 4-2 4 2v10l-4-2-4 2-4-2v-10m4 2v10m4-12v10"></path></svg>';
  return ret;
}

document.getElementById('canvas').addEventListener('keydown', function(ev) {
  if (ev.key === 'f') {
    ev.preventDefault();
    if (document.getElementById('wikiModal').classList.contains('hidden'))
      gameMapHandle.deref()?.click?.();
    else
      closeModal();
  }
});

function getOrQueryLocationColors(locationName) {
  return new Promise((resolve, _reject) => {
    if (Array.isArray(locationName) && locationName.length && locationName[0].hasTitle())
      locationName = locationName[0].title;
    else if (locationName?.hasTitle())
      locationName = locationName.title;
    else if (!locationName) {
      resolve(['#FFFFFF', '#FFFFFF']);
      return;
    }
    const colonIndex = locationName.indexOf(':');
    if (colonIndex > -1)
      locationName = locationName.slice(0, colonIndex);
    if (locationColorCache.hasOwnProperty(locationName)) {
      resolve(locationColorCache[locationName]);
      return;
    }

    if (gameId === '2kki') {
      const url = `${apiUrl}/2kki?action=getLocationColors&locationName=${locationName}`;
      send2kkiApiRequest(url, response => {
        let errCode = null;

        if (response && !response.err_code)
          cacheLocationColors(locationName, response.fgColor, response.bgColor);
        else
          errCode = response?.err_code;
          
        if (errCode)
          console.error({ error: response.error, errCode: errCode });

        resolve([response?.fgColor, response?.bgColor]);
      });
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

let ynomojiElement;

function insertYnomoji(ynomojiId) {
  const chatInput = ynomojiElement;
  if (!chatInput) return;
  const ynomojiMatch = /:([a-z0-9_\-]+)?$/i.exec(chatInput.value.slice(0, chatInput.selectionEnd));
  if (ynomojiMatch)
    chatInput.value = `${chatInput.value.slice(0, ynomojiMatch.index)}:${ynomojiId}:${chatInput.value.slice(chatInput.selectionEnd)}`;
  else
    chatInput.value += `:${ynomojiId}:`;
  chatInput.oninput();
}

function createInputElement(type, id, placeholder, onUpdate, checked = false, ...classes) {
  const input = document.createElement('input');
  input.type = type;
  input.id = id;
  if (classes.length)
    input.className = classes.join(' ');
  input.placeholder = placeholder;
  input.checked = checked;
  input.addEventListener('change', () => handleFilterInputs(onUpdate));
  return input;
}

function createCheckbox(id, labelText, onUpdate, checked = false, ...classes) {
  const label = document.createElement('label');
  const input = createInputElement('checkbox', id, null, onUpdate, checked, ...classes);
  label.appendChild(input);
  label.appendChild(document.createTextNode(labelText));
  return label;
}

function handleFilterInputs(modalInitFunc) {
  setTimeout(modalInitFunc, 250);
}

function addFilterInputs(modalPrefix, modalInitFunc, ...checkboxes) {
  const modal = document.getElementById(`${modalPrefix}Modal`);

  if (modal.querySelector('.filterInput'))
    return;

  const container = document.getElementById(`${modalPrefix}Controls`);

  const filterInput = createInputElement('text', `${modalPrefix}FilterInput`, 'Filter...', modalInitFunc, undefined, 'filterInput');
  filterInput.style = "margin-left: 10px";
  container.appendChild(filterInput);

  const checkboxContainer = document.createElement('div');
  checkboxContainer.classList.add('filterInputCheckboxContainer');

  for (let c = 0; c < checkboxes.length; c++) {
    const checkboxInfo = checkboxes[c];

    if (c)
      checkboxContainer.appendChild(document.createElement('br'));
    checkboxContainer.appendChild(createCheckbox(checkboxInfo.id, ` ${checkboxInfo.label}`, modalInitFunc, true, `filterInputCheck${c + 1}`));
  }

  if (checkboxContainer.children.length)
    container.appendChild(checkboxContainer);
}

function openWikiLink(url, useDefault, asImage = false) {
  if (globalConfig.wikiLinkMode === 2 || (document.fullscreenElement && globalConfig.wikiLinkMode === 1)) {
    openWikiModal(url, asImage);
    return true;
  }
  
  if (!useDefault) {
    const handle = window.open(url, '_blank', 'noreferrer');
    if (handle)
      handle.focus();
  }

  return false;
}

function openWikiModal(url, asImg) {
  /** @type {HTMLIFrameElement} */
  const wikiFrame = document.getElementById('wikiFrame');
  const wikiModal = document.getElementById('wikiModal');
  // if (wikiFrame.dataset.src !== url) {
  //   wikiFrame.dataset.src = url;
  //   if (asImg && URL.canParse(url)) {
  //     wikiFrame.srcdoc = `<body style="margin:0"><img src="${url}" onclick="window.open(this.src,'_blank','noreferrer')" style="max-width:100vw;max-height:100vh;cursor:zoom-in"/></body>`;
  //   } else {
  //     wikiFrame.removeAttribute('srcdoc');
  //     addLoader(wikiModal);
  //     wikiFrame.addEventListener('load', () => removeLoader(wikiModal), { once: true });
  //   }
  //   wikiFrame.src = url;
  // }
  if (wikiFrame.src !== url) {
    wikiFrame.src = url;
    if (!asImg) {
      addLoader(wikiModal);
      wikiFrame.addEventListener('load', () => removeLoader(wikiModal), { once: true });
    }
  }
  if (wikiModal.classList.contains('hidden')) { 
    const activeModal = document.querySelector('#modalContainer .modal:not(.hidden)');
    openModal('wikiModal', undefined, activeModal?.id);
  }
}

function checkShowVersionUpdate() {
  return new Promise(resolve => {
    if (gameId !== '2kki')
      return resolve();

    checkShow2kkiVersionUpdate().then(() => resolve());
  });
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

/** @param {HTMLElement?} el */
function clearCache(cacheType, el) {
  if (el) el.setAttribute('disabled', '');
  cache[cacheType] = {};
  updateCache(cacheType);
  switch (cacheType) {
    case CACHE_TYPE.location: locationCache = {}; break;
    case CACHE_TYPE.locationColor: locationColorCache = {}; break;
    case CACHE_TYPE.map: mapCache = {}; break;
  }
}

function openCacheSettingsModal(prevModal) {
  for (const button of document.getElementById('cacheSettingsModal').querySelectorAll('button'))
    button.removeAttribute('disabled');
  openModal('cacheSettingsModal', null, prevModal);
}

onResize();

loadOrInitConfig(globalConfig, true);
loadOrInitConfig(config);
loadOrInitCache();

document.addEventListener('click', e => {    
  const target = e.target.closest('a');
  if (target && target.classList.contains('wikiLink') && openWikiLink(target.href, true)) { 
    // document.getElementById('modalContainer').style.opacity = '';
    e.preventDefault();
  }
});

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

if (!globalConfig.rulesReviewed) {
	openModal('rulesModal');
	globalConfig.rulesReviewed = true;
	updateConfig(globalConfig, true);
}
