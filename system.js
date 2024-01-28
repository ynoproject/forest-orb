const allGameUiThemes = {
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
    'system_mobile',
    'Nulsdodage_Mono',
    'Kon_sys_3',
    'Kon_sys_4',
    'Kon_sys_5',
    'Kon_sys_6',
    'RioSystem5',
    'system_GBlike',
    'horatsuki sys1',
    'yumehako-sys1',
    'sniperbob_system44',
    'sniperbob_system45',
    'moka_sys',
    '21keb_sys_1',
    'JIVV_sys sakura',
    'JIVV_sys dusk',
    'Kong_Gothic window_system',
    'takikomi_syst1',
    'maptsukiSystem',
    'yumehako-sys2',

    'system_E_eye',
    'System_kuraud',
    'Kong_SystemFC',
    'natl_sys_PinkRibbon',
    'aediorugap_sys',
    'Bean_sys1'
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
  'braingirl': [
    'analog',
    'Vanilla',
    'Licorice',
    'Tobacco',
    'Chalkboard',
    'Acryllic',
    'Copper',
    'Psychedelic',
    'Spacecraft',
    'Floorgum',
    'moss',
    'Carpet',
    'Raspberry'
  ],
  'cu': [
    'system',
    'system2',
    'maple-penmenu',
    'millie_system_sun',
    'nacre_system_dusk',
    'nacre_system_vague_memory',
    'nacre_system_squids',
    'bWF5_system_willow',
    'delly_system_blue',
    'delly_horrid',
    'nacre_system_ammolites',
    'roninnozlo_Menu_FILM'
  ],
  'deepdreams': [
    'system_sterling',
    'system_arabian',
    'system_crystalline',
    'system_kaleidoscope',
    'system_rainbow',
    'system_spiderlily'
  ],
  'flow': [
    'system',
    'FCシムテム',
    'systemdot',
    'systemorange',
    'system flower',
    'system sugar',
    'system rust',
    'system smile'
  ],
  'genie': [
    'system_Negtive',
    'system_Home',
    'system_Springs'
  ],
  'mikan': [
    's_1',
    's_2',
    's_3'
  ],
  'muma': [
    'SYSTEM'
  ],
  'oversomnia': [
    'window-a',
    'window-b',
    'window-c',
    'window-d',
    'window-e',
    'window-f',
    'window-g',
    'window-h',
    'window-i',
    'window-j',
    'window-temp1'
  ],
  'prayers': [
    'grey-and-chartreuse',
    'chartreuse',
    'customsystem'
  ],
  'sheawaits': [
    'system_sa1'
  ],
  'someday': [
    'green',
    'blue',
    'turquoise',
    'clock',
    'threeoneone',
    '8bit',
    'edible',
    'rainbow',
    'gold',
    'swaltz',
    'zapnef',
    'monochrome_mk2',
    'monochrome'
  ],
  'ultraviolet': [
    'ss-システムviolet',
    'ss-システムmonochrome',
    'ss-システムsilver',
    'ss-システムorange',
    'ss-システムcookie',
    'ss-システムhexe',
    'ss-システムhexe 2',
    'ss-システムold black',
    'ss-システムold  blue',
    'ss-システムviolet II',
    'ss-システムgreen',
    'ss-システムeyes',
    'ss-システムviolet III'
  ],
  'unevendream': [
    '1247-0',
    '1247-0t',
    '1247-0k',
    '1247-pc98'
  ],
  'yume': [
    '0000000000009',
    '0000000000010',
    '0000000000011'
  ]
};
const gameUiThemes = allGameUiThemes[gameId];

const allGameFullBgUiThemes = {
  '2kki': [],
  'amillusion': [ 'fleur' ],
  'braingirl': [],
  'cu': [],
  'deepdreams': [],
  'flow': [],
  'genie': [],
  'mikan': [],
  'muma': [],
  'oversomnia': [],
  'prayers': [ 'grey-and-chartreuse', 'chartreuse', 'customsystem' ],
  'sheawaits': [],
  'someday': [],
  'ultraviolet': [ 'ss-システムsilver' ],
  'unevendream': [],
  'yume': [ '0000000000010' ]
};

const gameFullBgUiThemes = allGameFullBgUiThemes[gameId];

const gameLogoBlendModeOverrides = {
  'amillusion': 'screen',
  'braingirl': 'color',
  'cu': 'color',
  'deepdreams': 'soft-light',
  'genie': 'color',
  'mikan': 'soft-light',
  'someday': 'hard-light',
  'ultraviolet': 'soft-light',
  'unevendream': 'color'
};

const contrastRatioThreshold = 2.02;

function setSystemName(name) {
  systemName = name.replace(/'|\s$/g, '');
  if (playerData) {
    playerData.systemName = name;
    globalPlayerData[playerData.uuid].systemName = name;
  }
  if (connStatus == 1 || connStatus == 3)
    addOrUpdatePlayerListEntry(null, playerData, false, true);
}

// EXTERNAL
function onUpdateSystemGraphic(name) {
  if (gameUiThemes.indexOf(name.replace(/'|\s$/g, '')) > -1) {
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

function getDefaultUiTheme(themeGameId) {
  if (!themeGameId || !allGameUiThemes.hasOwnProperty(themeGameId))
    themeGameId = gameId;
  return allGameUiThemes[themeGameId][0];
}

function setUiTheme(value, isInit) {
  const isAuto = value === 'auto';
  const uiTheme = isAuto ? systemName || getDefaultUiTheme() : value;
  if (gameUiThemes.indexOf(uiTheme) === -1)
    return;
  config.uiTheme = value;
  initUiThemeContainerStyles(uiTheme, null, true);
  const lastSelectedThemeContainer = document.querySelector('.uiThemeContainer.selected');
  const newSelectedTheme = document.querySelector(`.uiTheme[data-ui-theme="${value}"]`);
  if (lastSelectedThemeContainer)
    lastSelectedThemeContainer.classList.remove('selected');
  if (newSelectedTheme)
    newSelectedTheme.parentElement.classList.add('selected');
  const useFullBg = gameFullBgUiThemes.indexOf(uiTheme) > -1;
  const containers = document.querySelectorAll('.container');
  for (let container of containers)
    container.classList.toggle('fullBg', useFullBg);
  const themedContainers = document.querySelectorAll('.listEntry, .toast');
  for (let themedContainer of themedContainers)
    updateThemedContainer(themedContainer);
  document.getElementById('header').classList.toggle('fullBg', useFullBg);
  document.querySelector('body').classList.toggle('fullBg', useFullBg);
  if (isInit)
    setPartyTheme(uiTheme);
  else {
    document.querySelector('.fontStyle').onchange();
    onUpdateChatboxInfo();
    updateConfig(config);
  }
}

function setPartyTheme(value) {
  const partyThemeButton = document.getElementById('partyThemeButton');
  partyThemeButton.innerHTML = getUiThemeOption(value).innerHTML;
  partyThemeButton.nextElementSibling.value = value;

  initUiThemeContainerStyles(value);
  initUiThemeFontStyles(value, null, 0);

  const lastSelectedThemeContainer = document.querySelector('.uiThemeContainer.partySelected');
  const newSelectedTheme = document.querySelector(`.uiTheme[data-ui-theme="${value}"]`);
  if (lastSelectedThemeContainer)
    lastSelectedThemeContainer.classList.remove('partySelected');
  if (newSelectedTheme)
    newSelectedTheme.parentElement.classList.add('partySelected');
}

function setFontStyle(fontStyle, isInit) {
  const isAuto = config.uiTheme == 'auto';
  const uiTheme = (isAuto ? systemName : config.uiTheme) || getDefaultUiTheme();
  if (gameUiThemes.indexOf(uiTheme) === -1)
    return;
  config.fontStyle = fontStyle;
  initUiThemeFontStyles(uiTheme, null, fontStyle, true);
  if (!isInit)
    updateConfig(config);
}

function initUiThemeContainerStyles(uiTheme, themeGameId, setTheme, callback) {
  if (!themeGameId)
    themeGameId = gameId;

  const parsedUiTheme = uiTheme.replace(/ /g, '_');
  const themeGamePropSuffix = themeGameId !== gameId ? `${themeGameId}-` : '';
  
  const baseBgColorProp = `--base-bg-color-${themeGamePropSuffix}${parsedUiTheme}`;
  const shadowColorProp = `--shadow-color-${themeGamePropSuffix}${parsedUiTheme}`;
  const svgShadowProp = `--svg-shadow-${themeGamePropSuffix}${parsedUiTheme}`;
  const containerBgImageUrlProp = `--container-bg-image-url-${themeGamePropSuffix}${parsedUiTheme}`;
  const borderImageUrlProp = `--border-image-url-${themeGamePropSuffix}${parsedUiTheme}`;

  getBaseBgColor(uiTheme, themeGameId, function (color) {
    getFontShadow(uiTheme, themeGameId, function (shadow) {
      const rootStyle = document.documentElement.style;

      if (!rootStyle.getPropertyValue(baseBgColorProp)) {
        addSystemSvgDropShadow(uiTheme, themeGameId, shadow);
        rootStyle.setProperty(baseBgColorProp, color);
        rootStyle.setProperty(shadowColorProp, shadow);
        rootStyle.setProperty(svgShadowProp, `url(#dropShadow_${themeGameId !== gameId ? `${themeGameId}_` : ''}${parsedUiTheme})`);
        rootStyle.setProperty(containerBgImageUrlProp, `url('images/ui/${themeGameId}/${uiTheme}/containerbg.png')`);
        rootStyle.setProperty(borderImageUrlProp, `url('images/ui/${themeGameId}/${uiTheme}/border.png')`);
      }

      if (setTheme && themeGameId === gameId) {
        rootStyle.setProperty('--base-bg-color', `var(${baseBgColorProp})`);
        rootStyle.setProperty('--shadow-color', `var(${shadowColorProp})`);
        rootStyle.setProperty('--svg-shadow', `var(${svgShadowProp})`);
        rootStyle.setProperty('--container-bg-image-url', `var(${containerBgImageUrlProp})`);
        rootStyle.setProperty('--border-image-url', `var(${borderImageUrlProp})`);
      }

      if (callback)
        callback(color, shadow);
    });
  });
}

function initUiThemeFontStyles(uiTheme, themeGameId, fontStyle, setTheme, callback) {
  if (!themeGameId)
    themeGameId = gameId;

  const parsedUiTheme = uiTheme.replace(/ /g, '_');
  const themeGamePropSuffix = themeGameId !== gameId ? `${themeGameId}-` : '';

  let baseColorProp = `--base-color-${themeGamePropSuffix}${parsedUiTheme}`;
  let altColorProp = `--alt-color-${themeGamePropSuffix}${parsedUiTheme}`;
  let baseGradientProp = `--base-gradient-${themeGamePropSuffix}${parsedUiTheme}`;
  let baseGradientBProp = `--base-gradient-b-${themeGamePropSuffix}${parsedUiTheme}`;
  let altGradientProp = `--alt-gradient-${themeGamePropSuffix}${parsedUiTheme}`;
  let altGradientBProp = `--alt-gradient-b-${themeGamePropSuffix}${parsedUiTheme}`;
  let svgBaseGradientProp = `--svg-base-gradient-${themeGamePropSuffix}${parsedUiTheme}`;
  let svgAltGradientProp = `--svg-alt-gradient-${themeGamePropSuffix}${parsedUiTheme}`;
  let baseColorImageUrlProp = `--base-color-image-url-${themeGamePropSuffix}${parsedUiTheme}`;

  if (fontStyle) {
    const fontStylePropSuffix = `-${fontStyle}`;
    baseColorProp += fontStylePropSuffix;
    altColorProp += fontStylePropSuffix;
    baseGradientProp += fontStylePropSuffix;
    baseGradientBProp += fontStylePropSuffix;
    altGradientProp += fontStylePropSuffix;
    altGradientBProp += fontStylePropSuffix;
    svgBaseGradientProp += fontStylePropSuffix;
    svgAltGradientProp += fontStylePropSuffix;
    baseColorImageUrlProp += fontStylePropSuffix;
  }

  const defaultAltFontStyleIndex = 1;
  const defaultFallbackAltFontStyleIndex = 3;
  
  getFontColors(uiTheme, themeGameId, fontStyle, function (baseColors) {
    const altFontStyle = fontStyle !== defaultAltFontStyleIndex ? defaultAltFontStyleIndex : defaultAltFontStyleIndex - 1;
    const altColorCallback = function (altColors) {
      const rootStyle = document.documentElement.style;

      if (!rootStyle.getPropertyValue(baseColorProp)) {
        addSystemSvgGradient(uiTheme, themeGameId, baseColors);
        addSystemSvgGradient(uiTheme, themeGameId, altColors, true);
        rootStyle.setProperty(baseColorProp, getColorRgb(baseColors[8]));
        rootStyle.setProperty(altColorProp, getColorRgb(altColors[8]));
        rootStyle.setProperty(baseGradientProp, `linear-gradient(to bottom, ${getGradientText(baseColors)})`);
        rootStyle.setProperty(baseGradientBProp, `linear-gradient(to bottom, ${getGradientText(baseColors, true)})`);
        rootStyle.setProperty(altGradientProp, `linear-gradient(to bottom, ${getGradientText(altColors)})`);
        rootStyle.setProperty(altGradientBProp, `linear-gradient(to bottom, ${getGradientText(altColors, true)})`);
        rootStyle.setProperty(svgBaseGradientProp, `url(#baseGradient_${themeGameId !== gameId ? `${themeGameId}_` : ''}${parsedUiTheme})`);
        rootStyle.setProperty(svgAltGradientProp, `url(#altGradient_${themeGameId !== gameId ? `${themeGameId}_` : ''}${parsedUiTheme})`);
        rootStyle.setProperty(baseColorImageUrlProp, `url('images/ui/${themeGameId}/${uiTheme}/font${fontStyle + 1}.png')`);
      }

      if (setTheme && themeGameId === gameId) {
        rootStyle.setProperty('--base-color', `var(${baseColorProp})`);
        rootStyle.setProperty('--alt-color', `var(${altColorProp})`);
        rootStyle.setProperty('--base-gradient', `var(${baseGradientProp})`);
        rootStyle.setProperty('--base-gradient-b', `var(${baseGradientBProp})`);
        rootStyle.setProperty('--alt-gradient', `var(${altGradientProp})`);
        rootStyle.setProperty('--alt-gradient-b', `var(${altGradientBProp})`);
        rootStyle.setProperty('--svg-base-gradient', `var(${svgBaseGradientProp})`);
        rootStyle.setProperty('--svg-alt-gradient', `var(${svgAltGradientProp})`);
        rootStyle.setProperty('--base-color-image-url', `var(${baseColorImageUrlProp})`);
      }

      if (callback)
        callback(baseColors, altColors);
    };
    getFontColors(uiTheme, themeGameId, altFontStyle, function (altColors) {
      if (altColors[8][0] !== baseColors[8][0] || altColors[8][1] !== baseColors[8][1] || altColors[8][2] !== baseColors[8][2])
        altColorCallback(altColors);
      else {
        const fallbackAltFontStyle = fontStyle !== defaultFallbackAltFontStyleIndex ? defaultFallbackAltFontStyleIndex : defaultFallbackAltFontStyleIndex - 1;
        getFontColors(uiTheme, themeGameId, fallbackAltFontStyle, altColorCallback);
      }
    });
  });
}

let applyThemeStyles;

{
  const themeStyleTemplate = `
    .listEntry.theme{THEME}, .screenshotItem.theme{THEME} .screenshotControls, .toast.theme{THEME} {
      background-image: var(--container-bg-image-url{THEME_PROP}) !important;
      border-image-source: var(--border-image-url{THEME_PROP}) !important;
    }

    .theme{THEME} .infoLabel, .theme{THEME} .infoText, .toast.theme{THEME} .toastMessage, h1.theme{THEME}, .theme{THEME} h1, h2.theme{THEME}, .theme{THEME} h2, h3.theme{THEME}, .theme{THEME} h3, h4.theme{THEME}, .theme{THEME} h4, .theme{THEME} a:not(.listEntryAction), .theme{THEME} label {
      background-image: var(--base-gradient{THEME_PROP}) !important;
      filter: drop-shadow(1.5px 1.5px rgb(var(--shadow-color{THEME_PROP})));
    }

    .theme{THEME} a:not(.modalClose):not(.listEntryAction) {
      background-image: var(--alt-gradient{THEME_PROP}) !important;
    }

    .nameText.theme{THEME}, .theme{THEME} .nameText, .theme{THEME} .partyListEntryMemberCountText {
      color: rgb(var(--base-color{THEME_PROP}));
      background-image: var(--base-gradient{THEME_PROP}) !important;
      filter: drop-shadow(1.5px 1.5px rgb(var(--shadow-color{THEME_PROP})));
    }

    .theme{THEME} .nameMarker {
      color: rgb(var(--alt-color{THEME_PROP}));
      background-image: var(--alt-gradient{THEME_PROP}) !important;
      filter: drop-shadow(1.5px 1.5px rgb(var(--shadow-color{THEME_PROP})));
    }

    .theme{THEME} .checkbox {
      color: rgb(var(--base-color{THEME_PROP})) !important;
      border-image-source: var(--border-image-url{THEME_PROP}) !important;
      background-color: rgb(var(--base-bg-color{THEME_PROP})) !important;
      text-shadow: 1.5px 1.5px rgb(var(--shadow-color{THEME_PROP}));
    }

    .theme{THEME}.icon path, .theme{THEME} .icon path {
      stroke: var(--svg-base-gradient{THEME_PROP});
      filter: var(--svg-shadow{THEME_PROP});
    }

    .theme{THEME}.fillIcon path, .theme{THEME} .fillIcon path {
      stroke: none;
      fill: var(--svg-base-gradient{THEME_PROP});
      filter: var(--svg-shadow{THEME_PROP});
    }

    .itemContainer .badgeItem.theme{THEME} > .badgeContainer {
      background-color: rgb(var(--base-bg-color{THEME_PROP})) !important;
    }
    
    .modalContent.itemContainer .badgeItem.theme{THEME} > .badgeContainer {
      background-color: rgb(var(--base-bg-color{THEME_PROP})) !important;
    }
    
    .modalContent.itemContainer .badgeItem.theme{THEME} > .badgeContainer.special {
      background-image: var(--alt-gradient-b{THEME_PROP});
    }
    
    .itemContainer .badgeItem.theme{THEME} > .badgeContainer > div, .screenshotItem.theme{THEME} > .screenshotThumbnailContainer {
      border-image-source: var(--border-image-url{THEME_PROP}) !important;
    }
    
    .modalContent.itemContainer .badgeItem.locked.theme{THEME} > .badgeContainer > div:first-child {
      border-image-source: var(--border-image-url{THEME_PROP}) !important;
    }
    
    .badge.theme{THEME} > .badgeOverlay, .theme{THEME} .badge > .badgeOverlay {
      background: var(--base-gradient{THEME_PROP});
    }
    
    .badge.theme{THEME} > .badgeOverlayBase, .theme{THEME} .badge > .badgeOverlayBase {
      background: rgb(var(--base-color{THEME_PROP}));
    }
    
    .badge.theme{THEME} > .badgeOverlayAlt, .theme{THEME} .badge > .badgeOverlayAlt {
      background: rgb(var(--alt-color{THEME_PROP}));
    }
    
    .badge.theme{THEME} > .badgeOverlayBg, .theme{THEME} .badge > .badgeOverlayBg {
      background: rgb(var(--base-bg-color{THEME_PROP}));
    }

    .eventVmListEntry.theme{THEME} .vmContainer .vmImage {
      border-image-source: var(--border-image-url{THEME_PROP}) !important;
    }

    .tippy-box.theme{THEME} {
      border-image-source: var(--border-image-url{THEME_PROP}) !important;
      background-image: var(--container-bg-image-url{THEME_PROP}) !important;
      {FULL_BG|background-origin: border-box; background-size: cover;}
    }
    
    .tippy-box.theme{THEME} .tippy-content .tooltipContent {
      background-image: var(--base-gradient{THEME_PROP}) !important;
      filter: drop-shadow(1.5px 1.5px rgb(var(--shadow-color{THEME_PROP})));
    }

    .tippy-box.theme{THEME} .tippy-content .tooltipContent.noShadow {
      filter: unset;
    }
    
    .tippy-box.theme{THEME} .tippy-content .tooltipContent.altText {
      background-image: var(--alt-gradient{THEME_PROP}) !important;
    }
  `;

  applyThemeStyles = (el, uiTheme, themeGameId) => {
    if (!el || !uiTheme)
      return;
    if (!themeGameId)
      themeGameId = gameId;

    const themeSuffix = `_${themeGameId !== gameId ? `${themeGameId}___` : ''}${uiTheme}`;
    const themeStylesId = `theme${themeSuffix}`;

    let themeStyles = document.getElementById(themeStylesId);
    if (!themeStyles) {
      const themePropSuffix = `-${themeGameId !== gameId ? `${themeGameId}-` : ''}${uiTheme}`;

      themeStyles = document.createElement('style');
      themeStyles.id = themeStylesId;
      themeStyles.innerHTML = themeStyleTemplate.replace(/\{THEME\}/g, themeSuffix).replace(/\{THEME_PROP\}/g, themePropSuffix).replace(/\{FULL_BG\|(.*?)\}/, allGameFullBgUiThemes[themeGameId].indexOf(uiTheme) > -1 ? '$1' : '');
      document.head.appendChild(themeStyles);
    }

    for (let cls of el.classList) {
      if (cls.startsWith('theme_')) {
        if (cls === themeStylesId)
          continue;
        el.classList.remove(cls);
      }
    }
    el.classList.add(themeStylesId);
  };
}

function setModalUiTheme(modalId, uiTheme, setData) {
  const rootStyle = document.documentElement.style;
  const styleProps = [ 'base-color', 'alt-color', 'base-bg-color', 'shadow-color', 'base-gradient', 'alt-gradient', 'base-gradient-b', 'alt-gradient-b', 'svg-base-gradient', 'svg-alt-gradient', 'svg-shadow', 'base-color-image-url', 'container-bg-image-url', 'border-image-url' ];
  const propThemeSuffix = uiTheme ? `-${uiTheme.replace(/ /g, '_')}` : '';
  for (let prop of styleProps)
    rootStyle.setProperty(`--modal-${prop}`, `var(--${prop}${propThemeSuffix})`);

  const modal = modalId ? document.getElementById(modalId) : document.querySelector('.modal:not(.hidden)');
  if (modal)
    modal.classList.toggle('fullBg', gameFullBgUiThemes.indexOf(uiTheme) > -1);

  if (setData) {
    const modalContainer = document.getElementById('modalContainer');
    if (modalContainer.dataset.lastModalId) {
      const lastModalThemeSeparatorIndex = modalContainer.dataset.lastModalTheme.lastIndexOf(',');
      if (lastModalThemeSeparatorIndex === -1)
        modalContainer.dataset.lastModalTheme = uiTheme || '';
      else
        modalContainer.dataset.lastModalTheme = `${modalContainer.dataset.lastModalTheme.slice(0, lastModalThemeSeparatorIndex + 1)}${uiTheme || ''}`;
    }
  }
  
  modalUiTheme = uiTheme;
}

function setPartyUiTheme(uiTheme) {
  const rootStyle = document.documentElement.style;
  const containerCallback = () => {
    const styleProps = [ 'base-bg-color', 'shadow-color', 'svg-shadow', 'container-bg-image-url', 'border-image-url' ];
    const propThemeSuffix = uiTheme ? `-${uiTheme.replace(/ /g, '_')}` : '';
    for (let prop of styleProps)
      rootStyle.setProperty(`--party-${prop}`, `var(--${prop}${propThemeSuffix})`);
    
  };
  const fontCallback = () => {
    const styleProps = [ 'base-color', 'alt-color', 'base-gradient', 'alt-gradient', 'svg-base-gradient', 'svg-alt-gradient' ];
    const propThemeSuffix = uiTheme ? `-${uiTheme.replace(/ /g, '_')}` : '';
    for (let prop of styleProps)
      rootStyle.setProperty(`--party-${prop}`, `var(--${prop}${propThemeSuffix})`);
  };
  if (uiTheme) {
    initUiThemeContainerStyles(uiTheme, null, false, containerCallback);
    initUiThemeFontStyles(uiTheme, null, 0, false, fontCallback);
  } else {
    containerCallback();
    fontCallback();
  }
  joinedPartyUiTheme = uiTheme;
}

function populateUiThemes() {
  const modalContent = document.querySelector('#uiThemesModal .modalContent');
  modalContent.innerHTML = '';
  modalContent.appendChild(getUiThemeOption('auto'));
  for (let uiTheme of gameUiThemes)
    modalContent.appendChild(getUiThemeOption(uiTheme));
  setPartyTheme(gameUiThemes[0]);
}

function getUiThemeOption(uiTheme) {
  const isAuto = uiTheme === 'auto';
  if (isAuto)
    uiTheme = systemName || getDefaultUiTheme();

  const item = document.createElement('div');
  item.classList.add('uiThemeItem', 'item');
  if (isAuto)
    item.classList.add('auto');
  item.classList.add('unselectable');
  
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

function updateThemedContainer(themedContainer) {
  if (!themedContainer)
    return;

  let themeName = systemName;
  let themeGameId = gameId;
  for (let cls of themedContainer.classList) {
    if (cls.startsWith('theme_')) {
      themeName = cls.slice(cls.indexOf('_') + 1);
      if (themeName.indexOf('___') > -1) {
        themeGameId = themeName.slice(0, themeName.indexOf('___'));
        themeName = themeName.slice(themeGameId.length + 2);
      }
      break;
    }
  }
  
  themedContainer.classList.toggle('fullBg', allGameFullBgUiThemes[themeGameId].indexOf(themeName) > -1)
}

let uiThemeBgColors = {};
let uiThemeFontShadows = {};
let uiThemeFontColors = {};

function getFontColors(uiTheme, themeGameId, fontStyle, callback) {
  if (!themeGameId)
    themeGameId = gameId;
  if (!uiThemeFontColors[themeGameId])
    uiThemeFontColors[themeGameId] = {};
  if (!uiThemeFontColors[themeGameId][uiTheme])
    uiThemeFontColors[themeGameId][uiTheme] = {};
  let colors = uiThemeFontColors[themeGameId][uiTheme][fontStyle];
  if (colors)
    return callback(colors);
  const img = new Image();
  img.onload = function () {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.drawImage(img, 0, 0);
    const data = context.getImageData(0, 0, 1, 16).data;
    const colors = [];
    for (let i = 0; i < data.length; i += 4)
      colors.push([ data[i], data[i + 1], data[i + 2] ]);
      
    if (typeof tinycolor !== 'undefined') {
      const shadowRgb = uiThemeFontShadows[themeGameId][uiTheme] || [0, 0, 0];
      const shadowTc = getTinyColor(shadowRgb);
      const shadowLum = shadowTc.getLuminance();
      for (let rgbArray of colors) {
        let tc = getTinyColor(rgbArray);
        let lum = tc.getLuminance();
        const lighten = lum >= shadowLum;
        let lastContrastRatio = getContrastRatio(lighten ? lum : shadowLum, lighten ? shadowLum : lum);
        if (lastContrastRatio < contrastRatioThreshold) {
          let contrastRatio;
          do {
            lastContrastRatio = contrastRatio;
            tc = lighten ? tc.lighten(5) : tc.darken(5);
            lum = tc.getLuminance();
            contrastRatio = getContrastRatio(lighten ? lum : shadowLum, lighten ? shadowLum : lum);
          } while (contrastRatio < contrastRatioThreshold && contrastRatio !== lastContrastRatio);
          const rgb = tc.toRgb();
          rgbArray[0] = rgb.r;
          rgbArray[1] = rgb.g;
          rgbArray[2] = rgb.b;
        }
      }
    }
    uiThemeFontColors[themeGameId][uiTheme][fontStyle] = colors;
    callback(colors);
    canvas.remove();
  };
  img.src = `images/ui/${themeGameId}/${uiTheme}/font${(fontStyle + 1)}.png`;
}

function getFontShadow(uiTheme, themeGameId, callback) {
  if (!themeGameId)
    themeGameId = gameId;
  if (!uiThemeFontShadows[themeGameId])
    uiThemeFontShadows[themeGameId] = {};
  let pixel = uiThemeFontShadows[themeGameId][uiTheme];
  if (pixel)
    return callback(getColorRgb(pixel));
  const img = new Image();
  img.onload = function () {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.drawImage(img, 0, 0);
    pixel = context.getImageData(0, 8, 1, 1).data;
    uiThemeFontShadows[themeGameId][uiTheme] = [ pixel[0], pixel[1], pixel[2] ];
    callback(getColorRgb(pixel));
    canvas.remove();
  };
  img.src = `images/ui/${themeGameId}/${uiTheme}/fontshadow.png`;
}

function getBaseBgColor(uiTheme, themeGameId, callback) {
  if (!themeGameId)
    themeGameId = gameId;
  const img = new Image();
  if (!uiThemeBgColors[themeGameId])
    uiThemeBgColors[themeGameId] = {};
  let pixel = uiThemeBgColors[themeGameId][uiTheme];
  if (pixel)
    return callback(getColorRgb(pixel));
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
    uiThemeBgColors[themeGameId][uiTheme] = [ r, g, b ];
    callback(`${r}, ${g}, ${b}`);
    canvas.remove();
  };
  img.src = `images/ui/${themeGameId}/${uiTheme}/containerbg.png`;
}

function getGradientText(colors, smooth) {
  let lastColor = colors[0];
  let ret = `rgb(${getColorRgb(lastColor)}) 0 `;
  colors.forEach(function (color, c) {
    if (color[0] !== lastColor[0] || color[1] !== lastColor[1] || color[2] !== lastColor[2]) {
      const percent = Math.floor(((c + 1) / colors.length) * 10000) / 100;
      ret += `${percent}%, rgb(${getColorRgb(color)}) `;
      if (!smooth)
        ret += `${percent}% `;
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
  ret.setAttribute('stop-color', `rgb(${getColorRgb(color)})`);
  ret.setAttribute('offset', `${offset}%`);
  return ret;
}

function addSystemSvgGradient(systemName, systemGameId, colors, alt) {
  if (!systemGameId)
    systemGameId = gameId;
  const gradientId = `${alt ? 'alt' : 'base'}Gradient_${systemGameId !== gameId ? `${systemGameId}_` : ''}${systemName.replace(/ /g, '_')}`;
  if (!document.getElementById(gradientId)) {
    const svgDefs = document.getElementById('svgDefs');
    const svgGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    svgGradient.id = gradientId;
    svgGradient.setAttribute('x1', '0%');
    svgGradient.setAttribute('y1', '0%');
    svgGradient.setAttribute('x2', '0%');
    svgGradient.setAttribute('y2', '100%');
    updateSvgGradient(svgGradient, colors);
    svgDefs.appendChild(svgGradient);
  }
}

function addSystemSvgDropShadow(systemName, systemGameId, color) {
  if (!systemGameId)
    systemGameId = gameId;
  const dropShadowFilterId = `dropShadow_${systemGameId !== gameId ? `${systemGameId}_` : ''}${systemName.replace(/ /g, '_')}`;
  if (!document.getElementById(dropShadowFilterId)) {
    const svgDefs = document.getElementById('svgDefs');
    const svgDropShadowFilter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    svgDropShadowFilter.id = dropShadowFilterId;

    const svgDropShadow = document.createElementNS('http://www.w3.org/2000/svg', 'feDropShadow');
    svgDropShadow.setAttribute('dx', '1');
    svgDropShadow.setAttribute('dy', '1');
    svgDropShadow.setAttribute('stdDeviation', '0.2');
    svgDropShadow.setAttribute('flood-color', `rgb(${color})`);

    svgDropShadowFilter.appendChild(svgDropShadow);
    svgDefs.appendChild(svgDropShadowFilter);
  }
}

function getStylePropertyValue(name) {
  const value = document.documentElement.style.getPropertyValue(name);
  if (value && value.startsWith('var('))
    return getStylePropertyValue(value.slice(4, -1));
  return value;
}

function getColorRgb(color) {
  return `${color[0]}, ${color[1]}, ${color[2]}`;
}

function getTinyColor(color) {
  return tinycolor({ r: color[0], g: color[1], b: color[2] });
}

function getContrastRatio(fgLum, bgLum) {
  return (fgLum + 0.05) / (bgLum + 0.05);
}
