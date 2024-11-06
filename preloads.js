let preloadFiles;
let gameLoadedFiles = new Set();
let preloadLocalizationFiles = {};

function initPreloadList() {
  fetch(`../ynopreloads/${gameId}.json`)
    .then(response => {
      if (!response.ok)
        return;
      return response.text();
    })
    .then(responseText => {
      if (!responseText)
        return;
      preloadFiles = JSON.parse(responseText.replace(/\"\*\//g, '\"/'));
      if (preloadFiles) {
        const preloadFilesReplace = {};
        for (let preload of Object.entries(preloadFiles)) {
          for (let mapId of preload[0].split('/')) {
            if (!preloadFilesReplace.hasOwnProperty(mapId))
              preloadFilesReplace[mapId] = [];
            preloadFilesReplace[mapId] = preloadFilesReplace[mapId].concat(preload[1]);
          }
        }
        preloadFiles = preloadFilesReplace;
        
        // Get game localization files
        fetch("https://api.github.com/repos/ynoproject/ynotranslations/git/trees/master?recursive=1")
          .then(response => response.json())
          .then(jsonResponse => {
            const gameFiles = [];
            const gameFilesLangs = [];
            const gameFilesLowerCase = [];
            for (let path of jsonResponse.tree) {
              path = path.path;
              if (path.startsWith(gameId + "/")) {
                path = path.replace(gameId + "/", "/");
                let lang = path.substring(1, path.substring(1, path.length).indexOf("/") + 1);
                let fileName = path.replace("/" + lang, "").replace(".lmu", ".po");
                gameFiles.push(fileName);
                gameFilesLowerCase.push(fileName.toLowerCase());
                gameFilesLangs.push(lang);
              }
            }
  
            for (let map of Object.values(preloadFiles)) {
              let file;
              for (let fi = 0; fi < map.length; fi++) {
                file = map[fi];
                if (typeof file === "object") {
                  if (!file.length) {
                    let filesAdd = [];
                    for (let f = 0; f < file.files.length; f++)
                      filesAdd.push([file.files[f], file.lang || ""]);
                    map = map.concat(filesAdd);
                    continue;
                  } else
                    file = file[0];
                }
  
                let fileLocalizedName = file.toLowerCase().replace(".lmu", ".po");
  
                for (let i = 0; i < gameFiles.length; i++) {
                  if (gameFilesLowerCase[i] === fileLocalizedName) {
                    if (!preloadLocalizationFiles.hasOwnProperty(gameFilesLangs[i]))
                      preloadLocalizationFiles[gameFilesLangs[i]] = {};
                    preloadLocalizationFiles[gameFilesLangs[i]][file] = gameFiles[i];
                  }
                }
              }
            }
          }).catch(err => console.error(err));
      }
    }).catch(err => console.error(err));
}

const graphicPattern = /.(png|bmp|zyx)$/i;
const keepExtensionPattern = /.po$/i;

function preloadFileAndSave(link, languageLink, translatedFileName) {
  // languageLink and translatedFileName is not used, since we depend on EasyRPG
  // to automatically translate the paths to their translated counterparts.
  if (!easyrpgPlayer.initialized) return;
  if (link.startsWith('/'))
    link = link.slice(1);
  if (gameLoadedFiles.has(link))
    return;
  gameLoadedFiles.add(link);

  let idx, file, dir;
  if ((idx = link.lastIndexOf('/')) !== -1) {
    file = link.slice(idx + 1);
    dir = link.slice(0, idx)
  } else {
    file = link;
    dir = '.';
  }

  const graphic = graphicPattern.test(file);
  if (!keepExtensionPattern.test(file) && (idx = file.lastIndexOf('.')) !== -1)
    file = file.slice(0, file.lastIndexOf('.'));
  easyrpgPlayer.api.preloadFile(dir, file, graphic);
}

function preloadFilesFromMapId(mapId) {
  if (!preloadFiles || !preloadFiles.hasOwnProperty(mapId))
    return;
  let langLink;
  let translatedFileName;
  for (let preloadFile of preloadFiles[mapId]) {
    if (typeof preloadFile === "object") {
      let pfX = preloadFile.x?.toString() || tpX.toString();
      let pfY;
      let index = 0;
      for (let pfI of pfX.split('/')) {
        if (tpX.toString() === pfI || pfI === "-1") {
          pfX = tpX;
          pfY = preloadFile.y?.toString().split('/')[index] || tpY.toString();
          if (tpY.toString() === pfY || pfY === "-1") {
            pfY = tpY;
            break;
          }
        }
        index++;
      }
      if (tpX === pfX && tpY === pfY && (!preloadFile.questionable || globalConfig.questionablePreloads)) {
        let current = 0;
        let currentTimeout = preloadFile.delay || 0;
        const totalAtOnce = 40;
        const delayAdd = 450;

        for (let preloadFileInside of preloadFile.files) {
          if (gameLoadedFiles.has(preloadFileInside))
            continue;
          if (preloadLocalizationFiles.hasOwnProperty(preloadsGameLang) && preloadLocalizationFiles[preloadsGameLang].hasOwnProperty(preloadFileInside)) {
            translatedFileName = preloadLocalizationFiles[preloadsGameLang][preloadFileInside];
            langLink = "/" + preloadsGameLang;
            if (preloadFileInside.endsWith(".lmu")) {
              if (preloadFile.slow)
                setTimeout(preloadFileAndSave, currentTimeout, preloadFileInside, langLink, translatedFileName);
              else
                preloadFileAndSave(preloadFileInside, langLink, translatedFileName);
              current++;
              if (current % totalAtOnce === 0)
                currentTimeout += delayAdd;
              translatedFileName = "";
              langLink = "";
            }
          } else {
            langLink = "";
            translatedFileName = "";
          }
          if (preloadFile.slow)
            setTimeout(preloadFileAndSave, currentTimeout, preloadFileInside, langLink, translatedFileName);
          else
            preloadFileAndSave(preloadFileInside, langLink, translatedFileName);
          current++;
          if (current % totalAtOnce === 0)
            currentTimeout += delayAdd;
        }
      }
      continue;
    }
    if (!gameLoadedFiles.has(preloadFile)) {
      if (preloadLocalizationFiles.hasOwnProperty(preloadsGameLang) && preloadLocalizationFiles[preloadsGameLang].hasOwnProperty(preloadFile)) {
        translatedFileName = preloadLocalizationFiles[preloadsGameLang][preloadFile];
        langLink = "/" + preloadsGameLang;
        if (preloadFile.endsWith(".lmu")) {
          preloadFileAndSave(preloadFile, langLink, translatedFileName);
          translatedFileName = "";
          langLink = "";
        }
      } else {
        langLink = "";
        translatedFileName = "";
      }
      preloadFileAndSave(preloadFile, langLink, translatedFileName);
    }
  }
}

function getFilePathForPreloads(path) {
  return path.replace(`/data/${gameId}`, "").replace("Language/", "");
}

let preloadsGameLang = "default";
let preloadsLangDetected = false;
let prevLoadedFiles = [];

// EXTERNAL
function onRequestFile(_url) {
  if (!preloadFiles) return;
          
  let filePath;
  try {
    filePath = getFilePathForPreloads(decodeURIComponent(_url));
  } catch (err) {
    return console.warn('not processing post-request for', _url);
  }
  gameLoadedFiles.add(filePath);

  // Game language detection
  if (_url.indexOf("Language/") !== -1 && !filePath.endsWith("/meta.ini")) 
    preloadsGameLang = filePath.substring(0, filePath.substring(1, filePath.length).indexOf("/") + 1);
  if (filePath.indexOf("Title/") !== -1) {
    gameLoadedFiles.clear();
    preloadsGameLang = 'default';
    for (let prevFile of prevLoadedFiles) {
      if (prevFile.indexOf("Language/") !== -1) {
        let folderFilePath = getFilePathForPreloads(decodeURIComponent(prevFile));
        preloadsGameLang = folderFilePath.substring(0, folderFilePath.substring(1, folderFilePath.length).indexOf("/") + 1);
        break
      }
    }
    if (preloadsLangDetected)
      preloadFilesFromMapId("title");
    preloadsLangDetected = true;
  }
  prevLoadedFiles.push(_url);
  if (prevLoadedFiles.length > 4)
    prevLoadedFiles.shift();
  if (filePath.endsWith(".lmu")) { 
    preloadFilesFromMapId("event" + filePath.replace("./Map", "").replace(".lmu", ""));
  }
}
