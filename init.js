const gameIds = ['yume', '2kki', 'flow', 'prayers', 'deepdreams', 'someday', 'amillusion', 'unevendream', 'braingirl'];
const gameIdMatch = new RegExp('(?:' + gameIds.join('|') + ')').exec(window.location);
const gameId = gameIdMatch ? gameIdMatch[0] : gameIds[1];
const localizedGameIds = [ 'yume', '2kki', 'flow', 'prayers', 'deepdreams', 'braingirl' ];
const gameDefaultLangs = {
  '2kki': 'ja',
  'flow': 'ja'
};
const hasTouchscreen = window.matchMedia('(hover: none), (pointer: coarse)').matches;
const tippyConfig = {
  arrow: false,
  animation: 'scale',
  allowHTML: true
};

const apiUrl = `../connect/${gameId}/api`;
const ynomojiUrlPrefix = 'images/ynomoji/';

Module = {
  INITIALIZED: false,
  EASYRPG_GAME: gameId,
  EASYRPG_WS_URL: 'wss://ynoproject.net/connect/' + gameId + '/'
};

function injectScripts() {
  let scripts = [ 'chat.js', 'playerlist.js', 'parties.js', 'system.js' ];
  if (gameId === '2kki')
    scripts.push('2kki.js');
  scripts = scripts.concat([ 'play.js', 'gamecanvas.js', 'index.js' ]);

  const injectScript = function (index) {
    const script = scripts[index];
    const loadFunc = index < scripts.length - 1
      ? () => injectScript(index + 1)
      : () => { // Assumes last script is index.js
        if (typeof ENV !== 'undefined')
          ENV.SDL_EMSCRIPTEN_KEYBOARD_ELEMENT = '#canvas';
  
          Module.postRun.push(() => {
            Module.INITIALIZED = true;
            document.getElementById('loadingOverlay').classList.add('loaded');
            fetchAndUpdatePlayerInfo();
          });
          if (typeof onResize !== 'undefined')
            Module.postRun.push(onResize);
      };

    const scriptTag = document.createElement('script');
    scriptTag.type = 'text/javascript';
    scriptTag.src = script;
    scriptTag.onload = loadFunc;

    document.body.appendChild(scriptTag);
  };

  injectScript(0);
}

function apiFetch(path) {
  return new Promise((resolve, reject) => {
    const sId = getCookie('sessionId');
    const headers = sId ? { 'X-Session': sId } : {};
    fetch(`${apiUrl}/${path}`, { headers: headers })
      .then(response => resolve(response))
      .catch(err => reject(err));
  });
}

function apiJsonPost(path, data) {
  return new Promise((resolve, reject) => {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    const sId = getCookie('sessionId');
    if (sId)
      headers['X-Session'] = sId;
    fetch(`${apiUrl}/${path}`, { method: 'POST', headers: headers, body: JSON.stringify(data) })
      .then(response => resolve(response))
      .catch(err => reject(err));
  });
}

function addTooltip(target, content, asTooltipContent, delayed, interactive, options) {
  if (!options)
    options = {};
  if (interactive)
    options.interactive = true;
  if (delayed)
    options.delay = [750, 0];
  options.content = asTooltipContent ? `<div class="tooltipContent">${content}</div>` : content;
  options.appendTo = document.getElementById('layout');
  target._tippy?.destroy();
  tippy(target, Object.assign(options, tippyConfig));
}

let loadedLang = false;
let loadedUiTheme = false;
let loadedFontStyle = false;

function loadOrInitConfig(configObj, global, configName) {
  if (!configName)
    configName = 'config';
  try {
    const configKey = global ? configName : `${configName}_${gameId}`;
    if (!window.localStorage.hasOwnProperty(configKey))
      window.localStorage.setItem(configKey, JSON.stringify(configObj));
    else {
      let savedConfig = JSON.parse(window.localStorage.getItem(configKey));
      if (configName === 'notificationConfig')
        savedConfig = Object.assign(notificationConfig, savedConfig);
      const savedConfigKeys = Object.keys(savedConfig);
      for (let k in savedConfigKeys) {
        const key = savedConfigKeys[k];
        if (configObj.hasOwnProperty(key)) {
          let value = savedConfig[key];
          switch (configName) {
            case 'config':
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
                  case 'tabToChat':
                    if (!value)
                      document.getElementById('tabToChatButton').click();
                    break;
                  case 'disableFloodProtection':
                    if (value)
                      preToggle(document.getElementById('floodProtectionButton'));
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
                      if (chatTab && value !== 2)
                        setChatTab(chatTab);
                    }
                    break;
                  case 'playersTabIndex':
                    if (value) {
                      const playersTab = document.querySelector(`.playersTab:nth-child(${value + 1})`);
                      if (playersTab && value !== 1)
                        setPlayersTab(playersTab);
                    }
                    break;
                  case 'globalMessage':
                    if (value)
                      document.getElementById('globalMessageButton').click();
                    break;
                  case 'hideOwnGlobalMessageLocation':
                    if (value)
                      preToggle(document.getElementById('ownGlobalMessageLocationButton'));
                    break;
                  case 'uiTheme':
                    if (gameUiThemes.indexOf(value) > -1) {
                      document.querySelector('.uiTheme').value = value;
                      setUiTheme(value, true);
                      loadedUiTheme = true;
                    }
                    break;
                  case 'fontStyle':
                    if (gameUiThemes.indexOf(value) > -1) {
                      document.querySelector('.fontStyle').value = value;
                      setFontStyle(value, true);
                      loadedFontStyle = true;
                    }
                    break;
                }
              }
              break;
            case 'notificationConfig':
              switch (key) {
                case 'all':
                  if (!value)
                    document.getElementById('notificationsButton').click();
                  break;
                case 'screenPosition':
                  if (value && value !== 'bottomLeft')
                    setNotificationScreenPosition(value);
                  break;
                default:
                  if (notificationTypes.hasOwnProperty(key) && typeof value === 'object') {
                    for (let nkey of Object.keys(value)) {
                      const nvalue = value[nkey];
                      if (nkey === 'all') {
                        if (!nvalue)
                          document.getElementById(`notificationsButton_${key}`).click();
                      } else if (notificationTypes[key].indexOf(nkey) > -1) {
                        if (!nvalue)
                          document.getElementById(`notificationsButton_${key}_${nkey}`).click();
                      } else
                        continue;
                    }
                  } else
                    continue;
                  break;
              }
              break;
            case 'saveSyncConfig':
              switch (key) {
                case 'enabled':
                  if (value)
                    setSaveSyncEnabled(true, true);
                  break;
                case 'slotId':
                  document.getElementById('saveSyncSlotId').value = value;
                  break;
              }
              break;
          }
          configObj[key] = value;
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
}

function updateConfig(configObj, global, configName) {
  if (!configName)
    configName = 'config';
  try {
    window.localStorage[global ? configName : `${configName}_${gameId}`] = JSON.stringify(configObj);
  } catch (error) {
    console.error(error);
  }
}

function setCookie(cName, cValue) {
  document.cookie = `${cName}=${cValue};SameSite=Strict;path=/`;
}

function getCookie(cName) {
  const name = `${cName}=`;
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ')
      c = c.substring(1);
    if (c.indexOf(name) === 0)
      return c.substring(name.length, c.length);
  }
  return "";
}

(function() {
  initNotificationsConfigAndControls();
  loadOrInitConfig(notificationConfig, true, 'notificationConfig');

  initSaveSyncControls();
  loadOrInitConfig(saveSyncConfig, false, 'saveSyncConfig');

  if (!getCookie('sessionId') || !saveSyncConfig.enabled || !saveSyncConfig.slotId)
    injectScripts();
  else
    trySyncSave().then(_ => injectScripts());
})();