const gameIds = [ '2kki', 'amillusion', 'braingirl', 'unconscious', 'deepdreams', 'flow', 'genie', 'if', 'mikan', 'muma', 'nostalgic', 'oversomnia', 'oneshot', 'prayers', 'sheawaits', 'someday', 'tsushin', 'ultraviolet', 'unaccomplished', 'unevendream', 'yume' ];
const gameIdMatch = new RegExp('(?:' + gameIds.join('|') + ')').exec(window.location);
const gameId = gameIdMatch ? gameIdMatch[0] : gameIds[0];
const ynoGameId = gameIdMatch || !new RegExp('dev').exec(window.location) ? gameId : 'dev';
const gameDefaultLangs = {
  '2kki': 'ja',
  'flow': 'ja',
  'if': 'ja',
  'mikan': 'ja',
  'ultraviolet': 'ja',
  'nostalgic': 'ja'
};
const gameDefaultSprite = {
  '2kki': 'syujinkou1',
  'amillusion': { sprite: 'parapluie ', idx: 1 },
  'braingirl': 'mikan2',
  'unconscious': 'protag_main_01',
  'deepdreams': 'main',
  'flow': 'sabituki',
  'if': 'syujinkou',
  'genie': 'syujinkou1',
  'mikan': 'syuzinkou_01',
  'muma': 'muma1',
  'nostalgic': 'syujinkou',
  'oneshot': { sprite: 'niko1', idx: 4 },
  'oversomnia': 'player-01',
  'prayers': 'Flourette',
  'sheawaits': 'sprite-noelia',
  'someday': 'itsuki1',
  'tsushin': 'actor',
  'ultraviolet': 'ch-主人公1',
  'unaccomplished': 'YM_1',
  'unevendream': 'kubo',
  'yume': '0000000078'
}[gameId];
const dependencyFiles = {};
const dependencyMaps = {};
const hasTouchscreen = window.matchMedia('(hover: none), (pointer: coarse)').matches;
const tippyConfig = {
  arrow: false,
  animation: 'scale',
  allowHTML: true,
  touch: /** @type {['hold', number]} */(['hold', 400]),
};

const inWebview = '__webview__' in window;
if (inWebview)
  document.documentElement.setAttribute('webview', '');

Object.defineProperty(Object.prototype, 'hasTitle', {
  enumerable: false,
  value() {
    return typeof this === 'string' || 'title' in this;
  }
})

Object.defineProperty(String.prototype, 'title', {
  get() { return this; },
})

let easyrpgPlayer = {
  initialized: false,
  game: ynoGameId,
  saveFs: undefined,
  wsUrl: 'wss://connect.ynoproject.net/' + ynoGameId + '/'
};
let easyrpgPlayerLoadFuncs = [];

const sessionIdKey = 'ynoproject_sessionId';
const serverUrl = `https://connect.ynoproject.net/${ynoGameId}`;
const apiUrl = `${serverUrl}/api`;
const adminApiUrl = `${serverUrl}/admin`;
const ynomojiUrlPrefix = 'images/ynomoji/';

let initBlocker = Promise.resolve();

async function injectScripts() {
  const supportsSimd = await wasmFeatureDetect.simd();

  let scripts = [ 'chat.js', 'playerlist.js', 'friends.js', 'parties.js', 'system.js', 'preloads.js', 'locations.js', 'schedules.js', 'report.js', 'notifications.js', '2kki.js', 'play.js', 'gamecanvas.js' ];
  if (!inWebview)
    scripts.push(`ynoengine${supportsSimd ? '-simd' : ''}.js`);

  dependencyFiles['play.css'] = null;

  const scriptTags = document.querySelectorAll('script');
  for (let tag of scriptTags) {
    if (tag.src.startsWith(window.location.origin))
      dependencyFiles[tag.src] = null;
  }
  for (let script of scripts)
    dependencyFiles[script] = null;
  dependencyFiles[`${window.location.origin}/data/${ynoGameId}/index.json`] = null;
  dependencyFiles[`ynoengine${supportsSimd ? '-simd' : ''}.wasm`] = null;

  const injectScript = function (index) {
    const script = scripts[index];
    const loadFunc = index < scripts.length - 1
      ? () => injectScript(index + 1)
      : async () => { // Assumes last script is index.js
        if (typeof ENV !== 'undefined')
          ENV.SDL_EMSCRIPTEN_KEYBOARD_ELEMENT = '#canvas';
        
        if (gameId === '2kki') {
          gameVersion = document.querySelector('meta[name="2kkiVersion"]')?.content?.replace(' Patch ', 'p');
        }

        if (inWebview && !getCookie(sessionIdKey)) { 
          setCookie(sessionIdKey, await webviewSessionToken());
        }
  
        easyrpgPlayerLoadFuncs.push(() => {
          if (!inWebview) {
            easyrpgPlayer.initialized = true;
            easyrpgPlayer.api.setNametagMode(config.nametagMode);
            easyrpgPlayer.api.setSoundVolume(globalConfig.soundVolume);
            easyrpgPlayer.api.setMusicVolume(globalConfig.musicVolume);
          }
          const loadingOverlay = document.getElementById('loadingOverlay');
          removeLoader(loadingOverlay);
          checkShowVersionUpdate().then(() => loadingOverlay.classList.add('loaded'));
          fetchAndUpdatePlayerInfo();
          setInterval(checkLogin, 60000);
          setTimeout(() => {
            checkDependenciesModified();
            setInterval(checkDependenciesModified, 300000);
          }, 10000);
          window.onbeforeunload = function () {
            if (!inWebview)
              return localizedMessages.leavePage;
          };
        });
        if (typeof onResize !== 'undefined')
          easyrpgPlayerLoadFuncs.push(onResize);

        await initBlocker;

        if (inWebview)
          for (let loadFunc of easyrpgPlayerLoadFuncs)
            loadFunc();
        else
        createEasyRpgPlayer(easyrpgPlayer)
          .then(function(Module) {
            // Module is ready
            easyrpgPlayer = Module;
            easyrpgPlayer.initApi();

            for (let loadFunc of easyrpgPlayerLoadFuncs)
              loadFunc();
          
            canvas.focus();
          });
      };

    const scriptTag = document.createElement('script');
    scriptTag.type = 'text/javascript';
    scriptTag.src = script;
    scriptTag.onload = loadFunc;

    document.body.appendChild(scriptTag);
  };

  injectScript(0);
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

function checkDependenciesModified() {
  let hasChanges = false;
  const dependencyPaths = Object.keys(dependencyFiles);
  const checkDependency = function (index) {
    const dep = dependencyPaths[index];
    const hasLastModified = !!dependencyFiles[dep];
    const req = hasLastModified ? { headers: { 'If-Modified-Since': dependencyFiles[dep] }} : {};

    fetch(dep, req)
      .then(response => {
        if (!hasLastModified || (response.status === 200 && response.headers.has('Last-Modified')))
          dependencyFiles[dep] = response.headers.get('Last-Modified');
        if (hasLastModified && response.status === 200)
          hasChanges = true;
      })
      .catch(err => {
        console.error(err);
      })
      .finally(() => {
        if (!hasLastModified && dependencyFiles[dep])
          checkDependency(index);
        else if (index < dependencyPaths.length - 1)
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
      .catch(err => reject(err));
  });
}

function apiFetch(path, isAdmin) {
  const sId = getCookie(sessionIdKey);
  const headers = sId ? { 'Authorization': sId } : {};
  return fetch(`${isAdmin ? adminApiUrl : apiUrl}/${path}`, { headers: headers });
}

function apiPost(path, data, contentType) {
  if (!contentType)
    contentType = 'application/json';
  const headers = {
    'Accept': contentType,
    'Content-Type': contentType
  };
  const sId = getCookie(sessionIdKey);
  if (sId)
    headers['Authorization'] = sId;
  return fetch(`${apiUrl}/${path}`, { method: 'POST', headers: headers, body: data });
}

function apiJsonPost(path, data) {
  return apiPost(path, JSON.stringify(data));
}

function wikiApiFetch(action, query) {
  return new Promise((resolve, reject) => {
    if (!yumeWikiSupported)
      reject('Game not supported by yume.wiki');
    fetch(`https://wrapper.yume.wiki/${action}?game=${ynoGameId}&${query}`)
      .then(response => {
        if (!response.ok)
          throw new Error(response.statusText);
        return response.json();
      })
      .then(response => resolve(response))
      .catch(err => reject(err));
  });
}

const extractCanvas = document.createElement('canvas');

async function getSpriteImg(img, spriteData, sprite, idx, frameIdx, width, height, xOffset, hasYOffset, isBrave) {
  return new Promise(resolve => {
    extractCanvas.width = 24;
    extractCanvas.height = 32;
    const context = extractCanvas.getContext('2d', { willReadFrequently: true });
    const startX = (idx % 4) * 72 + 24 * frameIdx;
    const startY = (idx >> 2) * 128 + 64;
    context.drawImage(img, startX, startY, 24, 32, 0, 0, 24, 32);
    const imageData = context.getImageData(0, 0, 24, 32);
    const data = imageData.data;
    const transPixel = data.slice(0, 3);
    let yOffset = hasYOffset ? -1 : 0;
    const checkPixelTransparent = isBrave ? transparencyChecker.brave : transparencyChecker.default;
    for (let i = 0; i < data.length; i += 4) {
      if (checkPixelTransparent(data, i, transPixel))
        data[i + 3] = 0;
      else if (yOffset === -1)
        yOffset = Math.max(Math.min(i >> 7, 15), 3);
    }
    if (yOffset === -1)
      yOffset = 0;
    extractCanvas.width = width;
    extractCanvas.height = height;
    context.putImageData(imageData, xOffset * -1, yOffset * -1, xOffset, 0, 24, 32);
    extractCanvas.toBlob(blob => {
      const blobImg = document.createElement('img');
      const url = URL.createObjectURL(blob);
    
      blobImg.onload = () => URL.revokeObjectURL(url);
    
      if (Array.isArray(spriteData[sprite][idx]))
        spriteData[sprite][idx][frameIdx] = url;
      else
        spriteData[sprite][idx] = url;
      resolve(url);
    });
  });
}

let transparencyChecker = {
  default: (data, o, transPixel) => data[o] === transPixel[0] && data[o + 1] === transPixel[1] && data[o + 2] === transPixel[2],
  brave: (data, o, transPixel) => (data[o] === transPixel[0] || data[o] - 1 === transPixel[0]) && (data[o + 1] === transPixel[1] || data[o + 1] - 1 === transPixel[1]) && (data[o + 2] === transPixel[2] || data[o + 2] - 1 === transPixel[2]),
}

/**
 * @param {Element} target 
 */
function addTooltip(target, content, asTooltipContent, delayed, interactive, options) {
  if (!options)
    options = {};
  if (interactive)
    options.interactive = true;
  if (delayed)
    options.delay = [750, 0];
  if (!asTooltipContent)
    options.content = content;
  else if (content instanceof Node) {
    const tooltipContent = document.createElement('div');
    tooltipContent.classList.add('tooltipContent');
    tooltipContent.appendChild(content);
    options.content = tooltipContent;
  } else
    options.content = `<div class="tooltipContent">${content}</div>`;
  options.appendTo = document.getElementById('layout');
  target._tippy?.destroy();
  return tippy(target, Object.assign(options, tippyConfig));
}

/** @type {Map<string, import('tippy.js').Instance>} */
const playerTooltipCache = new Map;

/**
 * @param {HTMLElement} target 
 * @param {*} [msgProps]
 */
function addPlayerContextMenu(target, player, uuid, messageType, msgProps) {
  if (!player || uuid === playerData?.uuid || uuid === defaultUuid) {
    target.addEventListener('contextmenu', event => event.preventDefault());
    return;
  }

  if (player && !player.hasOwnProperty('uuid'))
    player = Object.assign({ uuid }, player);

  target.addEventListener('contextmenu', function(event) {
    event.preventDefault();

    const cacheKey = `${uuid};${messageType}`;

    let playerTooltip = playerTooltipCache.get(cacheKey);
    if (!playerTooltip) {
      playerTooltip = createPlayerTooltip(this, player, uuid, messageType, msgProps);
      playerTooltipCache.set(cacheKey, playerTooltip);
    } else {
      const reportAction = playerTooltip.popper.querySelector('.reportPlayerAction');
      if (reportAction) {
        reportAction.onclick = function () {
          playerTooltip.hide();
          openReportForm({ ...(msgProps || {}), uuid });
        };
      }
    }

    const isFriend = !!playerFriendsCache.find(pf => pf.uuid === uuid);

    const addFriendAction = playerTooltip.popper.querySelector('.addPlayerFriendAction');
    const removeFriendAction = playerTooltip.popper.querySelector('.removePlayerFriendAction');

    if (addFriendAction)
      addFriendAction.classList.toggle('hidden', isFriend);
    if (removeFriendAction)
      removeFriendAction.classList.toggle('hidden', !isFriend);

    const isBlocked = blockedPlayerUuids.indexOf(uuid) > -1;

    const blockAction = playerTooltip.popper.querySelector('.blockPlayerAction');
    const unblockAction = playerTooltip.popper.querySelector('.unblockPlayerAction');

    if (blockAction)
      blockAction.classList.toggle('hidden', isBlocked);
    if (unblockAction)
      unblockAction.classList.toggle('hidden', !isBlocked);

    const targetPlayer = globalPlayerData[uuid] || player;
    const isMod = playerData?.rank > targetPlayer?.rank;
    playerTooltip.popper.querySelector('.banPlayerAction')?.classList.toggle('hidden', !isMod);
    playerTooltip.popper.querySelector('.mutePlayerAction')?.classList.toggle('hidden', !isMod);
    playerTooltip.popper.querySelector('.unmutePlayerAction')?.classList.toggle('hidden', !isMod);

    const targetHasAccount = !!targetPlayer?.account;
    playerTooltip.popper.querySelector('.grantBadgeAction')?.classList.toggle('hidden', !(isMod && targetHasAccount));
    playerTooltip.popper.querySelector('.revokeBadgeAction')?.classList.toggle('hidden', !(isMod && targetHasAccount));
  
    playerTooltip.setProps({
      getReferenceClientRect: () => ({
        width: 0,
        height: 0,
        top: event.clientY,
        bottom: event.clientY,
        left: event.clientX,
        right: event.clientX,
      }),
    });
  
    playerTooltip.show();
  });
}

/**
 * @param {Element} target
 * @param {*} [msgProps]
 */
function createPlayerTooltip(target, player, uuid, messageType, msgProps) {
  const isMod = playerData?.rank > player?.rank;
  const isBlockable = playerData?.rank >= player?.rank;
  const playerName = getPlayerName(player, true, false, true);

  let tooltipHtml = '';

  if (messageType)
    tooltipHtml += `<a href="javascript:void(0);" class="pingPlayerAction playerAction">${getMassagedLabel(localizedMessages.context.ping.label, true).replace('{PLAYER}', playerName)}</a>`;

  if (loginToken && player.account) {
    if (tooltipHtml)
      tooltipHtml += '<br>';
    tooltipHtml += `<a href="javascript:void(0);" class="addPlayerFriendAction playerAction">${getMassagedLabel(localizedMessages.context.addFriend.label, true).replace('{PLAYER}', playerName)}</a>
                    <a href="javascript:void(0);" class="removePlayerFriendAction playerAction">${getMassagedLabel(localizedMessages.context.removeFriend.label, true).replace('{PLAYER}', playerName)}</a>`;
  }

  if (isBlockable) {
    if (tooltipHtml)
      tooltipHtml += '<br>';
    tooltipHtml += `<a href="javascript:void(0);" class="blockPlayerAction playerAction">${getMassagedLabel(localizedMessages.context.block.label, true).replace('{PLAYER}', playerName)}</a>
                    <a href="javascript:void(0);" class="unblockPlayerAction playerAction">${getMassagedLabel(localizedMessages.context.unblock.label, true).replace('{PLAYER}', playerName)}</a>`;
  }

  if (loginToken) {
    if (tooltipHtml)
      tooltipHtml += '<br>';
    tooltipHtml += `<a href="javascript:void(0);" class="reportPlayerAction playerAction">${getMassagedLabel(localizedMessages.context.report.label).replace('{PLAYER}', playerName)}</a>`;
  }
  
  if (isMod) {
    if (tooltipHtml)
      tooltipHtml += '<br>'
    tooltipHtml += `<a href="javascript:void(0);" class="banPlayerAction playerAction">${getMassagedLabel(localizedMessages.context.admin.ban.label, true).replace('{PLAYER}', playerName)}</a><br>
      <a href="javascript:void(0);" class="mutePlayerAction playerAction">${getMassagedLabel(localizedMessages.context.admin.mute.label, true).replace('{PLAYER}', playerName)}</a><br>
      <a href="javascript:void(0);" class="unmutePlayerAction playerAction">${getMassagedLabel(localizedMessages.context.admin.unmute.label, true).replace('{PLAYER}', playerName)}</a>`;
    if (player.account)
      tooltipHtml += `<br>
        <a href="javascript:void(0);" class="grantBadgeAction adminBadgeAction playerAction">${getMassagedLabel(localizedMessages.context.admin.grantBadge.label, true)}</a><br>
        <a href="javascript:void(0);" class="revokeBadgeAction adminBadgeAction playerAction">${getMassagedLabel(localizedMessages.context.admin.revokeBadge.label, true)}</a>`;
  }

  const playerTooltip = addTooltip(target, tooltipHtml, true, false, true, { trigger: 'manual' });

  if (messageType) {
    playerTooltip.popper.querySelector('.pingPlayerAction').onclick = function () {
      const chatbox = document.getElementById('chatbox');
      const chatInput = document.getElementById('chatInput');
      const globalMessageButton = document.getElementById('globalMessageButton');

      switch (messageType) {
        case MESSAGE_TYPE.MAP:
          if (chatbox.classList.contains('globalChat') || chatbox.classList.contains('partyChat'))
            document.getElementById('chatTabAll').click();
          if (chatInput.dataset.global)
            globalMessageButton.click();
          break;
        case MESSAGE_TYPE.GLOBAL:
          if (chatbox.classList.contains('globalMap') || chatbox.classList.contains('partyChat'))
            document.getElementById('chatTabAll').click();
          if (!chatInput.dataset.global)
            globalMessageButton.click();
          break;
        case MESSAGE_TYPE.PARTY:
          if (!chatbox.classList.contains('partyChat'))
            document.getElementById('chatTabParty').click();
          break;
      }

      chatInput.value += `@${getPlayerName(player)} `;
      setTimeout(() => chatInput.focus(), 0);
    };
  }

  if (loginToken && player.account) {
    playerTooltip.popper.querySelector('.addPlayerFriendAction').onclick = function () {
      let cachedPlayerFriend = playerFriendsCache.find(pf => pf.uuid === uuid);
      if (cachedPlayerFriend && (cachedPlayerFriend.accepted || !cachedPlayerFriend.incoming))
        return;
      apiFetch(`addplayerfriend?uuid=${uuid}`)
        .then(response => {
          if (!response.ok)
            throw new Error(response.statusText);
          return response.text();
        })
        .then(_ => {
          const isRequest = !playerFriendsCache.find(pf => pf.uuid === uuid);
          if (isRequest) {
            playerFriendsCache.push(player);
            showFriendsToastMessage('add', 'friendAdd', player);
          } else
            showFriendsToastMessage('accept', 'approve', player);
          updatePlayerFriends();
        })
        .catch(err => console.error(err));
    };
    playerTooltip.popper.querySelector('.removePlayerFriendAction').onclick = function () {
      let cachedPlayerFriend = playerFriendsCache.find(pf => pf.uuid === uuid)
      if (!cachedPlayerFriend)
        return;
      apiFetch(`removeplayerfriend?uuid=${uuid}`)
        .then(response => {
          if (!response.ok)
            throw new Error(response.statusText);
          return response.text();
        })
        .then(_ => {
          cachedPlayerFriend = playerFriendsCache.find(pf => pf.uuid === uuid);
          if (cachedPlayerFriend) {
            if (cachedPlayerFriend.accepted)
              showFriendsToastMessage('remove', 'friendRemove', cachedPlayerFriend);
            else
              showFriendsToastMessage(cachedPlayerFriend.incoming ? 'reject' : 'cancel', 'deny', cachedPlayerFriend);
            playerFriendsCache.splice(playerFriendsCache.indexOf(cachedPlayerFriend), 1);
          }
          updatePlayerFriends();
        })
        .catch(err => console.error(err));
    };
    playerTooltip.popper.querySelector('.reportPlayerAction').onclick = function () {
      openReportForm({ ...(msgProps || {}), uuid });
    };
  }

  if (isBlockable) {
    playerTooltip.popper.querySelector('.blockPlayerAction').onclick = function () {
      if (blockedPlayerUuids.indexOf(uuid) > -1)
        return;

      showConfirmModal(localizedMessages.context.block.confirm.replace('{PLAYER}', playerName), () => {
        apiFetch(`blockplayer?uuid=${uuid}`)
          .then(response => {
            if (!response.ok)
              throw new Error(response.statusText);
            return response.text();
          })
          .then(_ => {
            blockedPlayerUuids.push(uuid);
            showPlayerToastMessage('blockPlayer', playerName, 'ban', true, systemName);
            updateBlocklist(!document.getElementById('blocklistModal').classList.contains('hidden'));
          })
          .catch(err => console.error(err));
      });
    };
    playerTooltip.popper.querySelector('.unblockPlayerAction').onclick = function() {
      if (blockedPlayerUuids.indexOf(uuid) === -1)
        return;

      showConfirmModal(localizedMessages.context.unblock.confirm.replace('{PLAYER}', playerName), () => {
        // optimistically remove this player from the blocklist, so that we can receive the connect event properly.
        const blockedPlayerUuidIndex = blockedPlayerUuids.indexOf(uuid);
        if (blockedPlayerUuidIndex > -1)
          blockedPlayerUuids.splice(blockedPlayerUuidIndex, 1);
        apiFetch(`unblockplayer?uuid=${uuid}`)
          .then(response => {
            if(!response.ok)
              throw new Error(response.statusText);
            return response.text();
          })
          .then(_ => {
            showPlayerToastMessage('unblockPlayer', playerName, 'info', true, systemName);
            updateBlocklist(!document.getElementById('blocklistModal').classList.contains('hidden'));
          })
          .catch(err => {
            // failed to unblock player, so they remain in blocklist.
            blockedPlayerUuids.push(uuid);
            console.error(err);
          });
        });
    };
  }

  if (isMod) {
    playerTooltip.popper.querySelector('.banPlayerAction').onclick = function () {
      showConfirmModal(localizedMessages.context.admin.ban.confirm.replace('{PLAYER}', playerName), () => {
        apiFetch(`ban?uuid=${uuid}`, true)
          .then(response => {
            if (!response.ok)
              throw new Error(response.statusText);
            return response.text();
          })
          .then(_ => showToastMessage(getMassagedLabel(localizedMessages.context.admin.ban.success, true).replace('{PLAYER}', playerName), 'ban', true, systemName))
          .catch(err => console.error(err));
        });
    };

    playerTooltip.popper.querySelector('.mutePlayerAction').onclick = function() {
      showConfirmModal(localizedMessages.context.admin.mute.confirm.replace('{PLAYER}', playerName), () => {
        apiFetch(`mute?uuid=${uuid}`, true)
          .then(response => {
            if (!response.ok)
              throw new Error(response.statusText);
            return response.text();
          })
          .then(_ => showToastMessage(getMassagedLabel(localizedMessages.context.admin.mute.success, true).replace('{PLAYER}', playerName), 'info', true, systemName))
          .catch(err => console.error(err));
        });
    };

    playerTooltip.popper.querySelector('.unmutePlayerAction').onclick = function() {
      showConfirmModal(localizedMessages.context.admin.unmute.confirm.replace('{PLAYER}', playerName), () => {
        apiFetch(`unmute?uuid=${uuid}`, true)
          .then(response => {
            if (!response.ok)
              throw new Error(response.statusText);
            return response.text();
          })
          .then(_ => showToastMessage(getMassagedLabel(localizedMessages.context.admin.unmute.success, true).replace('{PLAYER}', playerName), 'info', true, systemName))
          .catch(err => console.error(err));
        });
    };

    const badgeActions = playerTooltip.popper.querySelectorAll('.adminBadgeAction');
    for (let badgeAction of badgeActions) {
      badgeAction.onclick = function () {
        const isGrant = this.classList.contains('grantBadgeAction');
        const localizedContextRoot = localizedMessages.context.admin[isGrant ? 'grantBadge' : 'revokeBadge'];
        const badgeId = prompt(localizedContextRoot.prompt.replace('{PLAYER}', getPlayerName(player)));
        if (badgeId) {
          const badgeGame = Object.keys(localizedBadges).find(game => {
            return badgeId in localizedBadges[game];
          });
          if (badgeGame) {
            const badgeName = localizedBadges[badgeGame][badgeId].name;
            apiFetch(`${isGrant ? 'grant' : 'revoke'}badge&uuid=${uuid}&id=${badgeId}`, true)
              .then(response => {
                if (!response.ok)
                  throw new Error(response.statusText);
                return response.text();
              })
              .then(_ => showToastMessage(getMassagedLabel(localizedContextRoot.success, true).replace('{BADGE}', badgeName).replace('{PLAYER}', playerName), 'info', true, systemName))
              .catch(err => console.error(err));
          } else
            alert(localizedContextRoot.fail);
        }
      };
    }
  }

  if (!tooltipHtml) {
    target.addEventListener('contextmenu', event => event.preventDefault());
    return;
  }

  Array.from(playerTooltip.popper.querySelectorAll('.playerAction')).forEach(action => {
    const actionOnClick = action.onclick?.bind(action);
    action.onclick = () => {
      if (actionOnClick)
        actionOnClick();
      playerTooltip.hide();
    };
  });

  return playerTooltip;
}

/**
 * @param {import('tippy.js').Instance} [instance] 
 */
function addOrUpdateTooltip(target, content, asTooltipContent, delayed, interactive, options, instance) {
  if (!instance)
    return addTooltip(target, content, asTooltipContent, delayed, interactive, options);

  if (asTooltipContent) {
    const tooltipContent = document.createElement('div');
    tooltipContent.classList.add('tooltipContent');
    tooltipContent.append(content);
    content = tooltipContent;
  }
  instance.setContent(content);
  return instance;
}

let loadedLang = false;
let loadedUiTheme = false;
let loadedFontStyle = false;

function loadOrInitConfig(configObj, global, configName) {
  if (!configName)
    configName = 'config';
  try {
    const configKey = global ? configName : `${configName}_${ynoGameId}`;
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
                  case 'soundVolume':
                    document.getElementById('soundVolume').value = value;
                    setSoundVolume(value, true);
                    break;
                  case 'musicVolume':
                    document.getElementById('musicVolume').value = value;
                    setMusicVolume(value, true);
                    break;
                  case 'wikiLinkMode':
                    document.getElementById('wikiLinkMode').value = value;
                    break;
                  case 'saveReminder':
                    document.getElementById('saveReminder').value = value;
                    setSaveReminder(value, true);
                    break;
                  case 'gameChat':
                    if (value)
                      document.getElementById('gameChatButton').click();
                    break;
                  case 'gameChatGlobal':
                    if (value)
                      document.getElementById('gameChatGlobalButton').click();
                    break;
                  case 'gameChatParty':
                    if (value)
                      document.getElementById('gameChatPartyButton').click();
                    break;
                  case 'tabToChat':
                    if (!value)
                      document.getElementById('tabToChatButton').click();
                    break;
                  case 'playMentionSound':
                    if (!value)
                      document.getElementById('playMentionSoundButton').click();
                    break;
                  case 'blurScreenshotEmbeds':
                    if (value)
                      document.getElementById('blurScreenshotEmbedsButton').click();
                    break;
                  case 'mapChatHistoryLimit':
                    document.getElementById('mapChatHistoryLimit').value = value;
                    break;
                  case 'globalChatHistoryLimit':
                    document.getElementById('globalChatHistoryLimit').value = value;
                    break;
                  case 'partyChatHistoryLimit':
                    document.getElementById('partyChatHistoryLimit').value = value;
                    break;
                  case 'mobileControls':
                    if (!value && hasTouchscreen)
                      document.getElementById('mobileControlsButton').click();
                    break;
                  case 'mobileControlsType':
                    document.getElementById('mobileControl').value = value;
                    setMobileControlType(value, true);
                    break;
                  case 'locationDisplay':
                    if (value)
                      document.getElementById('locationDisplayButton').click();
                    break;
                  case 'hideRankings':
                    if (value)
                      document.getElementById('toggleRankingsButton').click();
                    break;
                  case 'hideSchedules':
                    if (value)
                      document.getElementById('toggleSchedulesButton').click();
                    break;
                  case 'autoDownloadScreenshots':
                    if (value)
                      document.getElementById('autoDownloadScreenshotsButton').click();
                    break;
                  case 'screenshotResolution':
                    document.getElementById('screenshotResolution').value = value;
                    break;
                  case 'preloads':
                    if (value) {
                      initPreloadList();
                      document.getElementById('togglePreloadsButton').click();
                    }
                    break;
                  case 'questionablePreloads':
                    if (value && gameId === '2kki')
                      document.getElementById('toggleQuestionablePreloadsButton').click();
                    break;
                  case 'rulesReviewed':
                    break;
                }
              } else { // !global
                switch (key) {
                  case 'privateMode':
                    if (value)
                      preToggle(document.getElementById('privateModeButton'));
                    break;
                  case 'disableChat':
                    if (value)
                      document.getElementById('chatButton').click();
                    break;
                  case 'explorer':
                    if (value && gameId === '2kki')
                      document.getElementById('explorerButton').click();
                    break;
                  case 'nametagMode':
                    document.getElementById('nametagMode').value = value;
                    break;
                  case 'disablePlayerSounds':
                    if (value)
                      preToggle(document.getElementById('playerSoundsButton'));
                    break;
                  case 'hideLocation':
                    if (value)
                      preToggle(document.getElementById('hideLocationButton'));
                    break;
                  case 'enableExplorer':
                    if (value)
                      document.getElementById('enableExplorerButton').click();
                    break;
                  case 'immersionMode':
                    if (value)
                      document.getElementById('immersionModeButton').click();
                    break;
                  case 'mute':
                    if (value)
                      preToggle(document.getElementById('muteButton'));
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
                  case 'hideGlobalMessageLocations':
                    if (value)
                      document.getElementById('globalMessageLocationsButton').click();
                    break;
                  case 'hideMessageTimestamps':
                    if (value)
                      document.getElementById('messageTimestampsButton').click();
                    break;
                  case 'trackedLocationId':
                    if (value)
                      document.getElementById('nextLocationContainer').classList.remove('hidden');
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
                      }
                    }
                  } else
                    continue;
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
    window.localStorage[global ? configName : `${configName}_${ynoGameId}`] = JSON.stringify(configObj);
  } catch (error) {
    console.error(error);
  }
}

function setCookie(cName, cValue) {
  const expiration = new Date();
  expiration.setTime(new Date().getTime() + 3600000 * 24 * 30);
  document.cookie = `${cName}=${cValue};SameSite=Strict;path=/;expires=${expiration.toUTCString()}`;
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

  window.addEventListener('error', event => {
    if (event.error.message.includes("side-effect in debug-evaluate") && event.defaultPrevented)
      return;
    showSystemToastMessage('error', 'important');
  });

  if (!getCookie(sessionIdKey))
    injectScripts();
  else
    trySyncSave().then(_ => injectScripts());
})();
