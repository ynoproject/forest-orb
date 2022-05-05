const gameIds = ['yume', '2kki', 'flow', 'prayers', 'deepdreams', 'someday', 'amillusion', 'unevendream', 'braingirl'];
const gameIdMatch = new RegExp('(?:' + gameIds.join('|') + ')').exec(window.location);
const gameId = gameIdMatch ? gameIdMatch[0] : gameIds[1];
const localizedGameIds = [ 'yume', '2kki', 'flow', 'prayers', 'deepdreams', 'someday', 'amillusion', 'braingirl' ];
const gameDefaultLangs = {
  '2kki': 'ja',
  'flow': 'ja'
};
const dependencyFiles = {};
const dependencyMaps = {};
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
  let hasChanges = false;
  let hasClientChanges = false;

  const initialDependencies = [ 'play.css' ];

  const scriptTags = document.querySelectorAll('script');
  for (let tag of scriptTags) {
    if (tag.src.startsWith(window.location.origin))
      initialDependencies.push(tag.src);
  }

  const checkInitialDependencyModified = function (index) {
    checkDependencyModified(initialDependencies[index], null, xhr => {
      if (xhr.status === 200)
        hasChanges = true;
      if (index < initialDependencies.length - 1)
        checkInitialDependencyModified(index + 1);
      else
        injectScript(0);
    });
  };

  const injectScript = function (index) {
    const script = scripts[index];
    const loadFunc = index < scripts.length - 1
      ? () => injectScript(index + 1)
      : () => { // Assumes last script is index.js
        if (typeof ENV !== 'undefined')
          ENV.SDL_EMSCRIPTEN_KEYBOARD_ELEMENT = '#canvas';
        Module.postRun.push(() => {
          if (hasChanges)
            reloadForDependencyUpdates(hasClientChanges);
          else {
            Module.INITIALIZED = true;
            document.getElementById('loadingOverlay').classList.add('loaded');
            fetchAndUpdatePlayerInfo();
            setInterval(checkSession, 60000);
            window.onbeforeunload = function () {
              return localizedMessages.leavePage;
            };
          }
        });
        if (typeof onResize !== 'undefined')
          Module.postRun.push(onResize);
      };

    checkDependencyModified(script,
      xhr => {
        const scriptTag = document.createElement('script');
        scriptTag.type = 'text/javascript';
        scriptTag.text = xhr.responseText;

        document.body.appendChild(scriptTag);
      },
      xhr => {
        if (xhr.status === 200) {
          hasChanges = true;
          if (script === 'index.js')
            hasClientChanges = true;
        }
        loadFunc();
      }
    );
  };

  checkInitialDependencyModified(0);
}

function checkDependencyModified(filename, onLoaded, onChecked) {
  const xhr = new XMLHttpRequest();
  xhr.open('get', filename, true);
  xhr.onreadystatechange = () => {
    if (xhr.readyState == 4) {
      if (dependencyFiles.hasOwnProperty(filename)) {
        if (onChecked)
          onChecked(xhr)
      } else {
        if (onLoaded)
          onLoaded(xhr)

        dependencyFiles[filename] = xhr.getResponseHeader('Last-Modified');

        xhr.open('get', filename, true);
        xhr.setRequestHeader('If-Modified-Since', dependencyFiles[filename]);
        xhr.send(null);
      }
    }
  };
  xhr.send(null);
}

function reloadForDependencyUpdates(hasClientChanges) {
  if (hasClientChanges) {
    const req = { headers: { 'If-Modified-Since': dependencyFiles['index.js'] } };
    fetch('index.json', req)
      .finally(_ => {
        fetch('index.wasm', req).finally(_ => {
          window.location = window.location;
        });
      });
  } else
    window.location = window.location;
}

function checkDependenciesModified() {
  let hasChanges = false;
  const dependencyPaths = Object.keys(dependencyFiles);
  const checkDependency = function (index) {
    const dep = dependencyPaths[index];
    fetch(dep, { headers: { 'If-Modified-Since': dependencyFiles[dep] }})
    .then(response => {
      if (response.status === 200) {
        if (response.headers.has('Last-Modified'))
          dependencyFiles[dep] = response.headers.get('Last-Modified');
        hasChanges = true;
      }
    })
    .catch(err => {
      console.error(err);
    })
    .finally(() => {
      if (index < dependencyPaths.length - 1)
        checkDependency(index + 1);
      else if (hasChanges)
        showSystemToastMessage('siteUpdates', 'info');
    });
  };
  if (dependencyPaths.length)
    checkDependency(0);
}

function fetchNewest(path, important, req) {
  return new Promise((resolve, reject) => {
    let ret;
    if (!req)
      req = {};

    fetch(path, req)
      .then(response => {
        ret = response;
        if (response.headers.has('Last-Modified')) {
          const lastModified = response.headers.get('Last-Modified');
          if (!req.headers)
            req.headers = {};
          req.headers['If-Modified-Since'] = lastModified;
          if (important)
            dependencyFiles[path] = lastModified;
          fetch(path, req)
            .then(response => {
              if (response.status === 200)
                ret = response;
              resolve(ret);
            })
            .catch(err => reject(err));
        } else
          resolve(ret);
      })
      .catch(err => reject(err));;
  });
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
  return tippy(target, Object.assign(options, tippyConfig));
}

function addOrUpdateTooltip(target, content, asTooltipContent, delayed, interactive, options, instance) {
  if (!instance)
    return addTooltip(target, content, asTooltipContent, delayed, interactive, options);

  instance.setContent(asTooltipContent ? `<div class="tooltipContent">${content}</div>` : content);
  return instance;
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
                  case 'hideRankings':
                    if (value)
                      document.getElementById('toggleRankingsButton').click();
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

  setInterval(checkDependenciesModified, 300000);
})();