const gameIdsElements = document.querySelectorAll('[data-game-ids]');
for (let el of gameIdsElements) {
  if (el.dataset.gameIds.split(',').indexOf(gameId) > -1)
    el.style.display = '';
  else
    el.remove();
}

const gameUiThemes = {
  'yume': [
    'マイシステムa',
    'マイシステムb',
    'マイシステムc'
  ],
  '2kki': [
    'system1',
    'system2',
    'system3',
    'system4',
    'system5',
    'system0',
    'systemyaguruma',
    'systemrenge',
    'system-b',
    'system-g',
    'system-i',
    'system-iiii2',
    'system-k',
    'system-n',
    'system-o',
    'system-r',
    'system-hw',
    'system_Ca0',
    'Yeris_System_Rainbow',
    'system_Suzume_choco',
    'menu 20',
    'menu 21',
    '2i9_sys1',
    '2i9_sys2',
    '2i9_sys3',
    'Noil-menu25',
    'Noil-menu26',
    'Noil-menu27',
    'RioSystem1-28',
    'RioSystem2-29',
    'Nuaahs_menu',
    'RioSystem3',
    'RioSystem4',
    'system_nantai_33',
    'system_Nulsdodage_Digital',
    'system-lav',
    'Kon_sys_1',
    'Kon_sys_2',
    '2i9_sys4',
    'system_K4_April2021',
    'Nulsdodage_Mono',
    'Kon_sys_3',
    'Kon_sys_4',
    'Kon_sys_5',
    'Kon_sys_6',
    'system_E_eye',
    'Kong_SystemFC',
    'natl_sys_PinkRibbon'
  ],
  'flow': [
    'system',
    'FCシムテム',
    'systemdot',
    'systemorange',
    'system flower',
    'systemsugar',
    'system rust',
    'systemsmile'
  ],
  'prayers': [
    'chartreuse',
    'grey-and-chartreuse',
    'customsystem'
  ],
  'deepdreams': [
    'system_sterling',
    'system_arabian',
    'system_crystalline',
    'system_kaleidoscope',
    'system_rainbow',
    'system_spiderlily'
  ],
  'someday': [
    'green',
    '8bit',
    'blue',
    'clock',
    'edible',
    'rainbow',
    'threeoneone',
    'turquoise'
  ],
  'amillusion': [
    'fleur-2',
    'fleur',
    'bullemenu',
    'menulabyrinthe',
    'rosas menu',
    'system EPACSE',
    'MenuChance',
    'tournesol'
  ],
  'unevendream': [
    '1247-0',
    '1247-0t',
    '1247-0k',
    '1247-pc98'
  ]
}[gameId];

const gameFullBgUiThemes = {
  'yume': [ 'マイシステムb' ],
  '2kki': [],
  'flow': [],
  'prayers': [ 'chartreuse', 'grey-and-chartreuse', 'customsystem' ],
  'deepdreams': [],
  'someday': [],
  'amillusion': [ 'fleur' ],
  'unevendream': []
}[gameId];

const hasUiThemes = gameUiThemes.length > 0;

let localizedMessages;

const langLabelMassageFunctions = {
  'ja': (value, isUI) => {
    if (isUI && value.indexOf(' ') > -1)
      return value.split(/ +/g).map(v => `<span class="nowrap">${v}</span>`).join('');
    return value;
  },
  'ru': (value, isUI) => {
    return value.replace(/([\u0400-\u04FF]+)/g, '<span class="ru-spacing-fix">$1</span>');
  }
};

let config = {
  lang: document.referrer && /\.jp/.test(document.referrer) ? 'ja' : 'en',
  name: '',
  singlePlayer: false,
  disableChat: false,
  disableNametags: false,
  disablePlayerSounds: false
};

let connStatus;

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
  if (status === 1)
    addOrUpdatePlayerListEntry(systemName, playerName, -1);
  else
    clearPlayerList();
  connStatus = status;
}

let playerCount;

// EXTERNAL
function updatePlayerCount(count) {
  if (isNaN(count) && count !== '?')
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

function setSystemName(name) {
  systemName = name;
  document.getElementById('chatInput').dataset.sys = name;
  if (connStatus === 1)
    addOrUpdatePlayerListEntry(systemName, playerName, -1);
}

setSystemName(getDefaultUiTheme());

// EXTERNAL
function onUpdateSystemGraphic(name) {
  if (name)
    name = name.replace(/'/g, '');
  if (gameUiThemes.indexOf(name) > -1) {
    setSystemName(name);
    const lastAutoButton = document.querySelector('.uiThemeItem.auto');
    if (lastAutoButton)
      lastAutoButton.remove();
    const uiThemeModalContent = document.querySelector('#uiThemesModal .modalContent');
    const autoUiThemeOption = getUiThemeOption('auto');
    autoUiThemeOption.onclick = onSelectUiTheme;
    uiThemeModalContent.prepend(autoUiThemeOption);
    locI18next.init(i18next)('.uiThemeItem.auto label');
    if (config.uiTheme === 'auto')
      setUiTheme('auto');
  }
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

if (hasUiThemes)
  populateUiThemes();

let locationCache;

document.getElementById('lang').onchange = function () {
  setLang(this.value);
};

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

document.getElementById('chatButton').onclick = function () {
  this.classList.toggle('toggled');
  document.getElementById('layout').classList.toggle('hideChat');
  onResize();
  config.disableChat = this.classList.contains('toggled');
  updateConfig(config);
};

if (hasUiThemes) {
  config.uiTheme = 'Default';

  document.getElementById('uiThemeButton').onclick = function () {
    document.getElementById('modalContainer').classList.remove('hidden');
    document.getElementById('uiThemesModal').classList.remove('hidden');
  };

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

let activeChatboxTabSection = 'messages';

function onClickChatboxTab() {
  if (this.dataset.tabSection !== activeChatboxTabSection) {
    activeChatboxTabSection = this.dataset.tabSection;
    if (activeChatboxTabSection === 'messages')
      document.getElementById("unreadMessageCountContainer").classList.add('hidden');
    for (let tab of document.getElementsByClassName('chatboxTab'))
      tab.classList.toggle('active', tab === this);
    for (let tabSection of document.getElementsByClassName('chatboxTabSection'))
      tabSection.classList.toggle('hidden', tabSection.id !== activeChatboxTabSection);
  }
}

for (let tab of document.getElementsByClassName('chatboxTab'))
  tab.onclick = onClickChatboxTab;

let ignoreSizeChanged = false;

function onResize() {
  const layout = document.getElementById('layout');

  const downscale = window.innerWidth < 704 || window.innerHeight < 577;
  const downscale2 = window.innerWidth < 544 || window.innerHeight < 457;

  layout.classList.toggle('noSideBorders', window.innerWidth < 384);

  onUpdateChatboxInfo();

  if (window.innerWidth < window.innerHeight) {
    layout.classList.toggle('downscale', downscale);
    layout.classList.toggle('downscale2', downscale2);
    layout.classList.toggle('overflow', isOverflow(downscale2 ? 0.5 : downscale ? 0.75 : 1));
  } else {
    const overflow = isOverflow();
    if (overflow !== isOverflow(0.75)) {
      layout.classList.toggle('downscale', downscale || overflow);
      layout.classList.remove('downscale2');
      layout.classList.toggle('overflow', !overflow);
    } else if (overflow !== isOverflow(0.5)) {
      layout.classList.toggle('downscale', downscale || overflow);
      layout.classList.toggle('downscale2', downscale2 || overflow);
      layout.classList.toggle('overflow', !overflow);
    } else {
      layout.classList.toggle('downscale', downscale);
      layout.classList.toggle('downscale2', downscale2);
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

  if (window.getComputedStyle(layout).flexWrap === 'wrap') {
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
  const layoutElement = document.getElementById('layout');
  const canvasElement = document.getElementById('canvas');
  const canvasContainerElement = document.getElementById('canvasContainer');
  const chatboxContainerElement = document.getElementById('chatboxContainer');

  let canvasContainerHeight = null;
  let canvasContainerPaddingRight = null;
  let canvasContainerMarginTop = null;
  let chatboxContainerMarginTop = null;
  let chatboxHeight = null;
  let chatboxOverlap = false;
  
  if (document.fullscreenElement) {
    const showChat = !layoutElement.classList.contains('hideChat');
    let scaleX = window.innerWidth / canvasElement.offsetWidth;
    let scaleY = window.innerHeight / canvasElement.offsetHeight;
    const scaleFraction = layoutElement.classList.contains('downscale') ? 0.25 : 0.5;
    scaleX -= scaleX % scaleFraction;
    scaleY -= scaleY % scaleFraction;
    const scale = Math.max(Math.min(scaleX, scaleY), 0.5);
    canvasElement.style.transform = `scale(${scale})`;

    if (window.innerWidth > 1050 || window.innerHeight < 595) {
      const chatboxContainerWidth = chatboxContainerElement.offsetWidth - 24;
      chatboxContainerMarginTop = '24px';
      if (chatboxContainerWidth + 48 <= window.innerWidth - (canvasElement.offsetWidth * scale)) {
        if (showChat)
          canvasContainerPaddingRight = `${chatboxContainerWidth}px`;
      } else
        chatboxOverlap = true;
    } else {
      const canvasScaledHeight = canvasElement.offsetHeight * scale;
      const unusedHeight = window.innerHeight - (canvasScaledHeight + 32);
      if (unusedHeight >= 376 && showChat) {
        canvasContainerMarginTop = `-${(window.innerHeight - canvasScaledHeight) / 2}px`
        chatboxContainerMarginTop = `${(window.innerHeight - unusedHeight) - 40}px`;
        chatboxHeight = `${unusedHeight}px`;
      } else {
        chatboxContainerMarginTop = '24px';
        if (showChat)
          chatboxOverlap = true;
      }
    }
  } else {
    canvasElement.style.transform = null;
    canvasContainer.style.paddingRight = null;
  }

  canvasContainerElement.style.height = canvasContainerHeight;
  canvasContainerElement.style.paddingRight = canvasContainerPaddingRight;
  canvasContainerElement.style.marginTop = canvasContainerMarginTop;
  chatboxContainerElement.style.marginTop = chatboxContainerMarginTop;
  layoutElement.classList.toggle('chatboxOverlap', chatboxOverlap);
  document.getElementById('chatbox').style.height = chatboxHeight;

  document.getElementById("messages").scrollTop = messages.scrollHeight;
}

if (Module.postRun) {
  Module.postRun.push(function () {
    document.getElementById('singlePlayerButton').onclick = function () {
      Module._ToggleSinglePlayer();
    };

    document.getElementById('nametagButton').onclick = function () {
      Module._ToggleNametags();
    };

    document.getElementById('playerSoundsButton').onclick = function () {
      Module._TogglePlayerSounds();
    };
  });
  Module.postRun.push(onResize);
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
  config.lang = lang;
  initLocalization(isInit);
  if (!isInit)
    updateConfig(config);
}

function setName(name, isInit) {
  config.name = name;
  if (!isInit)
    updateConfig(config);
}

function getDefaultUiTheme() {
  return gameUiThemes[0];
}

function setUiTheme(value, isInit) {
  const isAuto = value === 'auto';
  const uiTheme = isAuto ? systemName || getDefaultUiTheme() : value;
  if (gameUiThemes.indexOf(uiTheme) === -1)
    return;
  if (hasUiThemes)
    config.uiTheme = value;
  const themeStyles = document.getElementById('themeStyles');
  getBaseBgColor(uiTheme, function (color) {
    const bgColorPixel = uiThemeBgColors[uiTheme];
    const altColor = getColorRgba([Math.min(bgColorPixel[0] + 48, 255), Math.min(bgColorPixel[1] + 48, 255), Math.min(bgColorPixel[2] + 48, 255)]);
    getFontShadow(uiTheme, function (shadow) {
      themeStyles.textContent = themeStyles.textContent.replace(new RegExp('url\\(\'images\\/ui\\/[a-zA-Z0-9]+\\/(?:[^\\/]+\\/)?(containerbg|border(?:2)?|font\\d)\\.png\'\\)', 'g'), 'url(\'images/ui/' + gameId + (hasUiThemes ? '/' + uiTheme : '') + '/$1.png\')')
        .replace(/background-color:( *)[^;!]*(!important)?;( *)\/\*basebg\*\//g, 'background-color:$1' + color + '$2;$3/*basebg*/')
        .replace(/background-color:( *)[^;!]*(!important)?;( *)\/\*altbg\*\//g, 'background-color:$1' + altColor + '$2;$3/*altbg*/')
        .replace(/(?:[#a-zA-Z0-9]+|rgba\([0-9]+, [0-9]+, [0-9]+, [0-9]+\))(;? *)\/\*shadow\*\//g, shadow + '$1/*shadow*/');
      document.getElementById('dropShadow').children[0].setAttribute('flood-color', shadow);
      const lastSelectedThemeContainer = document.querySelector('.uiThemeContainer.selected');
      const newSelectedTheme = document.querySelector(`.uiTheme[data-ui-theme="${value}"]`);
      if (lastSelectedThemeContainer)
        lastSelectedThemeContainer.classList.remove('selected');
      if (newSelectedTheme)
        newSelectedTheme.parentElement.classList.add('selected');
      const useFullBg = hasUiThemes && gameFullBgUiThemes.indexOf(uiTheme) > -1;
      const containers = document.querySelectorAll('.container');
      const modals = document.querySelectorAll('.modal');
      for (let container of containers)
        container.classList.toggle('fullBg', useFullBg);
      for (let modal of modals)
        modal.classList.toggle('fullBg', useFullBg);
      document.querySelector('body').classList.toggle('fullBg', useFullBg);
      if (!isInit) {
        document.querySelector('.fontStyle').onchange();
        if (hasUiThemes)
          updateConfig(config);
      }
    });
  });
}

function setFontStyle(fontStyle, isInit) {
  const isAuto = config.uiTheme == 'auto';
  const uiTheme = (isAuto ? systemName : config.uiTheme) || getDefaultUiTheme();
  if (gameUiThemes.indexOf(uiTheme) === -1)
    return;
  config.fontStyle = fontStyle;
  const themeStyles = document.getElementById('themeStyles');
  const defaultAltFontStyleIndex = 1;
  const defaultFallbackAltFontStyleIndex = 3;
  getFontColors(uiTheme, fontStyle, function (baseColors) {
    const altFontStyle = fontStyle !== defaultAltFontStyleIndex ? defaultAltFontStyleIndex : defaultAltFontStyleIndex - 1;
    const altColorCallback = function (altColors) {
      themeStyles.textContent = themeStyles.textContent
        .replace(/linear\-gradient\((.*?),.*?\)( *!important)?;( *)\/\*base\*\//g, 'linear-gradient($1, ' + getGradientText(baseColors) + ')$2;$3/*base*/')
        .replace(/linear\-gradient\((.*?),.*?\)( *!important)?;( *)\/\*alt\*\//g, 'linear-gradient($1, ' + getGradientText(altColors) + ')$2;$3/*alt*/')
        .replace(/([^\-])((?:(?:background|border)\-)?color|fill):( *)[^;!]*(!important)?;( *)\/\*base\*\//g, '$1$2:$3' + getColorRgba(baseColors[8]) + '$4;$5/*base*/')
        .replace(/([^\-])((?:(?:background|border)\-)?color|fill):( *)[^;!]*(!important)?;( *)\/\*alt\*\//g, '$1$2:$3' + getColorRgba(altColors[8]) + '$4;$5/*alt*/');
      updateSvgGradient(document.getElementById('baseGradient'), baseColors);
      updateSvgGradient(document.getElementById('altGradient'), altColors);
      if (!isInit)
        updateConfig(config);
    };
    getFontColors(uiTheme, altFontStyle, function (altColors) {
      if (altColors[8][0] !== baseColors[8][0] || altColors[8][1] !== baseColors[8][1] || altColors[8][2] !== baseColors[8][2])
        altColorCallback(altColors);
      else {
        const fallbackAltFontStyle = fontStyle !== defaultFallbackAltFontStyleIndex ? defaultFallbackAltFontStyleIndex : defaultFallbackAltFontStyleIndex - 1;
        getFontColors(uiTheme, fallbackAltFontStyle, altColorCallback);
      }
    });
  });
}

function populateUiThemes() {
  const modalContent = document.querySelector('#uiThemesModal .modalContent');
  modalContent.innerHTML = '';
  if (hasUiThemes)
    modalContent.appendChild(getUiThemeOption('auto'));
  for (let uiTheme of gameUiThemes)
    modalContent.appendChild(getUiThemeOption(uiTheme));
}

function onSelectUiTheme(e) {
  setUiTheme(e.target.dataset.uiTheme);
}

function getUiThemeOption(uiTheme) {
  const isAuto = uiTheme === 'auto';
  if (isAuto)
    uiTheme = systemName || getDefaultUiTheme();

  const item = document.createElement('div');
  item.classList.add('uiThemeItem');
  if (isAuto)
    item.classList.add('auto');
  
  const container = document.createElement('div');
  container.classList.add('uiThemeContainer');

  const option = document.createElement('div');
  option.classList.add('uiTheme');
  if (gameFullBgUiThemes.indexOf(uiTheme) > -1)
    option.classList.add('fullBg');
  option.dataset.uiTheme = isAuto ? 'auto' : uiTheme;
  option.style.backgroundImage = `url('images/ui/${gameId}/${uiTheme}/containerbg.png')`;
  option.style.borderImage = `url('images/ui/${gameId}/${uiTheme}/border.png') 10 repeat`;

  const arrowUp = document.createElement('img');
  arrowUp.src = `images/ui/${gameId}/${uiTheme}/arrowup.png`;
  option.appendChild(arrowUp);

  const arrowDown = document.createElement('img');
  arrowDown.src = `images/ui/${gameId}/${uiTheme}/arrowdown.png`;
  option.appendChild(arrowDown);

  container.appendChild(option);

  if (isAuto) {
    const autoLabel = document.createElement('label');
    autoLabel.dataset.i18n = '[html]modal.uiTheme.auto';
    item.appendChild(autoLabel);
  }

  item.appendChild(container);

  return item;
}

let uiThemeBgColors = {};
let uiThemeFontShadows = {};
let uiThemeFontColors = {};
let spriteData = {};
let playerSpriteCache = {};

function getFontColors(uiTheme, fontStyle, callback) {
  if (!uiThemeFontColors[uiTheme])
    uiThemeFontColors[uiTheme] = {};
  let colors = uiThemeFontColors[uiTheme][fontStyle];
  if (colors)
    return callback(colors);
  const img = new Image();
  img.onload = function () {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.drawImage(img, 0, 0);
    const data = context.getImageData(0, 0, 1, 16).data;
    const colors = [];
    for (let i = 0; i < data.length; i += 4) {
      colors.push([ data[i], data[i + 1], data[i + 2] ]);
    }
    uiThemeFontColors[uiTheme][fontStyle] = colors;
    callback(colors);
    canvas.remove();
  };
  img.src = 'images/ui/' + gameId + (hasUiThemes ? '/' + uiTheme : '') + '/font' + (fontStyle + 1) + '.png';
}

function getFontShadow(uiTheme, callback) {
  let pixel = uiThemeFontShadows[uiTheme];
  if (pixel)
    return callback(getColorRgba(pixel));
  const img = new Image();
  img.onload = function () {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.drawImage(img, 0, 0);
    pixel = context.getImageData(0, 8, 1, 1).data;
    uiThemeFontShadows[uiTheme] = [ pixel[0], pixel[1], pixel[2] ];
    callback(getColorRgba(pixel));
    canvas.remove();
  };
  img.src = 'images/ui/' + gameId + (hasUiThemes ? '/' + uiTheme : '') + '/fontshadow.png';
}

function getBaseBgColor(uiTheme, callback) {
  const img = new Image();
  let pixel = uiThemeBgColors[uiTheme];
  if (pixel)
    return callback(getColorRgba(pixel));
  img.onload = function () {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.drawImage(img, 0, 0);
    pixel = context.getImageData(0, 0, 1, 1).data;
    const pixel2 = context.getImageData(4, 4, 1, 1).data;
    const pixel3 = context.getImageData(8, 8, 1, 1).data;
    const r = Math.round((pixel[0] + pixel2[0] + pixel3[0]) / 3);
    const g = Math.round((pixel[1] + pixel2[1] + pixel3[1]) / 3);
    const b = Math.round((pixel[2] + pixel2[2] + pixel3[2]) / 3);
    uiThemeBgColors[uiTheme] = [ r, g, b ];
    callback('rgba(' + r + ', ' + g + ', ' + b + ', 1)');
    canvas.remove();
  };
  img.src = 'images/ui/' + gameId + (hasUiThemes ? '/' + uiTheme : '') + '/containerbg.png';
}

function getGradientText(colors) {
  let lastColor = colors[0];
  let ret = `${getColorRgba(lastColor)} 0 `;
  colors.forEach(function (color, c) {
    if (color[0] !== lastColor[0] || color[1] !== lastColor[1] || color[2] !== lastColor[2]) {
      const percent = Math.floor(((c + 1) / colors.length) * 10000) / 100;
      ret += `${percent}%, ${getColorRgba(color)} ${percent}% `;
      lastColor = color;
    }
  });
  ret += '100%';
  return ret;
}

function updateSvgGradient(gradient, colors) {
  gradient.innerHTML = '';
  let lastColor = colors[0];
  gradient.appendChild(getSvgGradientStop(lastColor, 0));
  colors.forEach(function (color, c) {
    if (color[0] !== lastColor[0] || color[1] !== lastColor[1] || color[2] !== lastColor[2]) {
      const offset = Math.floor(((c + 1) / colors.length) * 10000) / 100;
      gradient.appendChild(getSvgGradientStop(color, offset));
      lastColor = color;
    }
  });
}

function getSvgGradientStop(color, offset) {
  const ret = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  ret.setAttribute('stop-color', getColorRgba(color));
  ret.setAttribute('offset', `${offset}%`);
  return ret;
}

function getColorRgba(color) {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, 1)`;
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

  request.onsuccess = function (e) {

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

  request.onsuccess = function (e) {
    const saveSlot = getSaveSlot(true);

    if (saveSlot == null)
      return;

    const db = request.result; 
    const transaction = db.transaction(['FILE_DATA'], 'readwrite');
    const objectStore = transaction.objectStore('FILE_DATA');
    const objectStoreRequest = objectStore.get(`/easyrpg/${gameId}/Save/Save${saveSlot}.lsd`);

    objectStoreRequest.onsuccess = function (event) {
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
  if (isInitial && gameId === '2kki') {
    const uiThemeOptions = document.querySelectorAll('.uiTheme option');
    for (let option of uiThemeOptions)
      option.setAttribute('data-i18n', `[html]uiTheme.values.2kki.${option.value}`);
  }
  document.getElementsByTagName('html')[0].lang = config.lang;
  fetch(`lang/${config.lang}.json`)
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
      
      if (isInitial) {
        onUpdateConnectionStatus(0);
        updatePlayerCount('?');
      } else {
        if (connStatus !== undefined)
          onUpdateConnectionStatus(connStatus);
        if (playerCount !== undefined)
          updatePlayerCount(playerCount);
      }

      const translationComplete = jsonResponse.translationComplete === '1';
      const translationInstruction = document.getElementById('translationInstruction');
      translationInstruction.classList.toggle('hidden', translationComplete);
      if (!translationComplete)
        document.getElementById('translationLink').href = `https://github.com/ynoproject/forest-orb/edit/master/lang/${config.lang}.json`;

      const resourcesJson = {};
      resourcesJson[config.lang] = { translation: jsonResponse.ui };
      i18next.init({
        lng: config.lang,
        resources: resourcesJson,
        preventValueFromContent: false
      }, function (err, t) {
        if (err)
          console.error(err);
        locI18next.init(i18next)('[data-i18n]');
      });
    });
}

function massageLabels(data) {
  if (langLabelMassageFunctions.hasOwnProperty(config.lang) && data) {
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
  if (langLabelMassageFunctions.hasOwnProperty(config.lang) && label)
    return langLabelMassageFunctions[config.lang](label, isUI);
  return label;
}

let loadedUiTheme = false;
let loadedFontStyle = false;

function loadOrInitConfig() {
  try {
    const configKey = `config_${gameId}`;
    if (!window.localStorage.hasOwnProperty(configKey))
      window.localStorage.setItem(configKey, JSON.stringify(config));
    else {
      const savedConfig = JSON.parse(window.localStorage.getItem(configKey));
      const savedConfigKeys = Object.keys(savedConfig);
      for (let k in savedConfigKeys) {
        const key = savedConfigKeys[k];
        if (config.hasOwnProperty(key)) {
          let value = savedConfig[key];
          switch (key) {
            case 'lang':
              document.getElementById('lang').value = value;
              setLang(value, true);
              break;
            case 'name':
              document.getElementById('nameInput').value = value;
              setName(value, true);
              break;
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
          config[key] = value;
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
}

function updateConfig(config) {
  try {
    window.localStorage[`config_${gameId}`] = JSON.stringify(config);
  } catch (error) {
  }
}

onResize();

loadOrInitConfig();

if (!loadedFontStyle)
  setFontStyle(0, true);
if (!loadedUiTheme)
  setUiTheme('auto', true);
if (!localizedMessages)
  initLocalization(true);