const gameUiThemes = {
  'yume': [
    '0000000000009',
    '0000000000010',
    '0000000000011'
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
    'system_mobile',
    'Nulsdodage_Mono',
    'Kon_sys_3',
    'Kon_sys_4',
    'Kon_sys_5',
    'Kon_sys_6',
    'RioSystem5',
    'system_GBlike',
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
    'grey-and-chartreuse',
    'chartreuse',
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
  ]
}[gameId];

const gameFullBgUiThemes = {
  'yume': [ '0000000000010' ],
  '2kki': [],
  'flow': [],
  'prayers': [ 'grey-and-chartreuse', 'chartreuse', 'customsystem' ],
  'deepdreams': [],
  'someday': [],
  'amillusion': [ 'fleur' ],
  'unevendream': [],
  'braingirl': []
}[gameId];

const gameLogoBlendModeOverrides = {
  'deepdreams': 'soft-light',
  'someday': 'hard-light',
  'amillusion': 'screen',
  'unevendream': 'color',
  'braingirl': 'color'
};

const contrastRatioThreshold = 2.02;

function setSystemName(name) {
  systemName = name.replace(/'/g, '');
  if (playerData) {
    playerData.systemName = name;
    globalPlayerData[playerData.uuid].systemName = name;
  }
  if (connStatus === 1)
    addOrUpdatePlayerListEntry(null, systemName, playerName, defaultUuid, false, true);
}

// EXTERNAL
function onUpdateSystemGraphic(name) {
  if (gameUiThemes.indexOf(name.replace(/'/g, '')) > -1) {
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

function getDefaultUiTheme() {
  return gameUiThemes[0];
}

function setUiTheme(value, isInit) {
  const isAuto = value === 'auto';
  const uiTheme = isAuto ? systemName || getDefaultUiTheme() : value;
  if (gameUiThemes.indexOf(uiTheme) === -1)
    return;
  config.uiTheme = value;
  initUiThemeContainerStyles(uiTheme, true);
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
  initUiThemeFontStyles(value, 0);

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
  initUiThemeFontStyles(uiTheme, fontStyle, true);
  if (!isInit)
    updateConfig(config);
}

function initUiThemeContainerStyles(uiTheme, setTheme, callback) {
  const parsedUiTheme = uiTheme.replace(' ', '_');
  
  const baseBgColorProp = `--base-bg-color-${parsedUiTheme}`;
  const shadowColorProp = `--shadow-color-${parsedUiTheme}`;
  const svgShadowProp = `--svg-shadow-${parsedUiTheme}`;
  const containerBgImageUrlProp = `--container-bg-image-url-${parsedUiTheme}`;
  const borderImageUrlProp = `--border-image-url-${parsedUiTheme}`;

  getBaseBgColor(uiTheme, function (color) {
    getFontShadow(uiTheme, function (shadow) {
      const rootStyle = document.documentElement.style;

      if (!rootStyle.getPropertyValue(baseBgColorProp)) {
        addSystemSvgDropShadow(uiTheme, shadow);
        rootStyle.setProperty(baseBgColorProp, color);
        rootStyle.setProperty(shadowColorProp, shadow);
        rootStyle.setProperty(svgShadowProp, `url(#dropShadow_${parsedUiTheme})`);
        rootStyle.setProperty(containerBgImageUrlProp, `url('images/ui/${gameId}/${uiTheme}/containerbg.png')`);
        rootStyle.setProperty(borderImageUrlProp, `url('images/ui/${gameId}/${uiTheme}/border.png')`);
      }

      if (setTheme) {
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

function initUiThemeFontStyles(uiTheme, fontStyle, setTheme, callback) {
  const parsedUiTheme = uiTheme.replace(' ', '_');

  let baseColorProp = `--base-color-${parsedUiTheme}`;
  let altColorProp = `--alt-color-${parsedUiTheme}`;
  let altColorTProp = `--alt-color-t-${parsedUiTheme}`;
  let baseGradientProp = `--base-gradient-${parsedUiTheme}`;
  let baseGradientBProp = `--base-gradient-b-${parsedUiTheme}`;
  let altGradientProp = `--alt-gradient-${parsedUiTheme}`;
  let altGradientBProp = `--alt-gradient-b-${parsedUiTheme}`;
  let svgBaseGradientProp = `--svg-base-gradient-${parsedUiTheme}`;
  let svgAltGradientProp = `--svg-alt-gradient-${parsedUiTheme}`;
  let baseColorImageUrlProp = `--base-color-image-url-${parsedUiTheme}`;

  if (fontStyle) {
    const fontStylePropSuffix = `-${fontStyle}`;
    baseColorProp += fontStylePropSuffix;
    altColorProp += fontStylePropSuffix;
    altColorTProp += fontStylePropSuffix;
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
  
  getFontColors(uiTheme, fontStyle, function (baseColors) {
    const altFontStyle = fontStyle !== defaultAltFontStyleIndex ? defaultAltFontStyleIndex : defaultAltFontStyleIndex - 1;
    const altColorCallback = function (altColors) {
      const rootStyle = document.documentElement.style;

      if (!rootStyle.getPropertyValue(baseColorProp)) {
        addSystemSvgGradient(uiTheme, baseColors);
        addSystemSvgGradient(uiTheme, altColors, true);
        rootStyle.setProperty(baseColorProp, getColorRgba(baseColors[8]));
        rootStyle.setProperty(altColorProp, getColorRgba(altColors[8]));
        rootStyle.setProperty(altColorTProp, getColorRgba(altColors[8], 0.5));
        rootStyle.setProperty(baseGradientProp, `linear-gradient(to bottom, ${getGradientText(baseColors)})`);
        rootStyle.setProperty(baseGradientBProp, `linear-gradient(to bottom, ${getGradientText(baseColors, true)})`);
        rootStyle.setProperty(altGradientProp, `linear-gradient(to bottom, ${getGradientText(altColors)})`);
        rootStyle.setProperty(altGradientBProp, `linear-gradient(to bottom, ${getGradientText(altColors, true)})`);
        rootStyle.setProperty(svgBaseGradientProp, `url(#baseGradient_${parsedUiTheme})`);
        rootStyle.setProperty(svgAltGradientProp, `url(#altGradient_${parsedUiTheme})`);
        rootStyle.setProperty(baseColorImageUrlProp, `url('images/ui/${gameId}/${uiTheme}/font${fontStyle + 1}.png')`);
      }

      if (setTheme) {
        rootStyle.setProperty('--base-color', `var(${baseColorProp})`);
        rootStyle.setProperty('--alt-color', `var(${altColorProp})`);
        rootStyle.setProperty('--alt-color-t', `var(${altColorTProp})`);
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

function setModalUiTheme(modalId, uiTheme, setData) {
  const rootStyle = document.documentElement.style;
  const styleProps = [ 'base-color', 'alt-color', 'base-bg-color', 'shadow-color', 'base-gradient', 'alt-gradient', 'base-gradient-b', 'alt-gradient-b', 'svg-base-gradient', 'svg-alt-gradient', 'svg-shadow', 'base-color-image-url', 'container-bg-image-url', 'border-image-url' ];
  const propThemeSuffix = uiTheme ? `-${uiTheme.replace(' ', '_')}` : '';
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
}

function setPartyUiTheme(uiTheme) {
  const rootStyle = document.documentElement.style;
  const containerCallback = () => {
    const styleProps = [ 'base-bg-color', 'shadow-color', 'svg-shadow', 'container-bg-image-url', 'border-image-url' ];
    const propThemeSuffix = uiTheme ? `-${uiTheme.replace(' ', '_')}` : '';
    for (let prop of styleProps)
      rootStyle.setProperty(`--party-${prop}`, `var(--${prop}${propThemeSuffix})`);
    
  };
  const fontCallback = () => {
    const styleProps = [ 'base-color', 'alt-color', 'alt-color-t', 'base-gradient', 'alt-gradient', 'svg-base-gradient', 'svg-alt-gradient' ];
    const propThemeSuffix = uiTheme ? `-${uiTheme.replace(' ', '_')}` : '';
    for (let prop of styleProps)
      rootStyle.setProperty(`--party-${prop}`, `var(--${prop}${propThemeSuffix})`);
  };
  if (uiTheme) {
    initUiThemeContainerStyles(uiTheme, false, containerCallback);
    initUiThemeFontStyles(uiTheme, 0, false, fontCallback);
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
  item.classList.add('uiThemeItem');
  item.classList.add('item');
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

let uiThemeBgColors = {};
let uiThemeFontShadows = {};
let uiThemeFontColors = {};

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
    for (let i = 0; i < data.length; i += 4)
      colors.push([ data[i], data[i + 1], data[i + 2] ]);
      
    if (typeof tinycolor !== 'undefined') {
      const shadowRgb = uiThemeFontShadows[uiTheme] || [0, 0, 0];
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
    uiThemeFontColors[uiTheme][fontStyle] = colors;
    callback(colors);
    canvas.remove();
  };
  img.src = 'images/ui/' + gameId + '/' + uiTheme + '/font' + (fontStyle + 1) + '.png';
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
  img.src = 'images/ui/' + gameId +'/' + uiTheme + '/fontshadow.png';
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
  img.src = 'images/ui/' + gameId + '/' + uiTheme + '/containerbg.png';
}

function getGradientText(colors, smooth) {
  let lastColor = colors[0];
  let ret = `${getColorRgba(lastColor)} 0 `;
  colors.forEach(function (color, c) {
    if (color[0] !== lastColor[0] || color[1] !== lastColor[1] || color[2] !== lastColor[2]) {
      const percent = Math.floor(((c + 1) / colors.length) * 10000) / 100;
      ret += `${percent}%, ${getColorRgba(color)} `;
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
  ret.setAttribute('stop-color', getColorRgba(color));
  ret.setAttribute('offset', `${offset}%`);
  return ret;
}

function addSystemSvgGradient(systemName, colors, alt) {
  const gradientId = `${alt ? 'alt' : 'base'}Gradient_${systemName.replace(' ', '_')}`;
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

function addSystemSvgDropShadow(systemName, color) {
  const dropShadowFilterId = `dropShadow_${systemName.replace(' ', '_')}`;
  if (!document.getElementById(dropShadowFilterId)) {
    const svgDefs = document.getElementById('svgDefs');
    const svgDropShadowFilter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    svgDropShadowFilter.id = dropShadowFilterId;

    const svgDropShadow = document.createElementNS('http://www.w3.org/2000/svg', 'feDropShadow');
    svgDropShadow.setAttribute('dx', '1');
    svgDropShadow.setAttribute('dy', '1');
    svgDropShadow.setAttribute('stdDeviation', '0.2');
    svgDropShadow.setAttribute('flood-color', color);

    svgDropShadowFilter.appendChild(svgDropShadow);
    svgDefs.appendChild(svgDropShadowFilter);
  }
}

function getColorRgba(color, alpha) {
  return alpha === undefined
    ? `rgb(${color[0]}, ${color[1]}, ${color[2]})`
    : `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}

function getTinyColor(color) {
  return tinycolor({ r: color[0], g: color[1], b: color[2] });
}

function getContrastRatio(fgLum, bgLum) {
  return (fgLum + 0.05) / (bgLum + 0.05);
}