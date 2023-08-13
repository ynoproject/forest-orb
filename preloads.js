let preloadFiles;
let preloadedFiles = {};
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
      preloadFiles = JSON.parse(responseText.replaceAll('\"*/', '\"/'));
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

function preloadFileAndSave(link, languageLink, translatedFileName) {
  link = languageLink + (translatedFileName ? translatedFileName : link);
  if (gameLoadedFiles.has(link))
    return;
  gameLoadedFiles.add(link);
  const request = new XMLHttpRequest();
  request.onload = function () {
    if (request.status >= 200 && request.status < 300)
      preloadedFiles[link] = request.response;
  };
  request.responseType = "arraybuffer";
  let versionAdd = "";
  if (gameVersion)
    versionAdd = `${link.indexOf('?') > -1 ? '&' : '?'}v=${gameVersion}`;
  request.open("GET", `/data/${gameId}${languageLink ? "/Language" : ""}${encodeURIComponent(link)}${versionAdd}`);
  request.send();
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
  return path.replace(`/data/${gameId}`, "").replace("/Language", "");
}

let preloadsGameLang = "default";
let preloadsLangDetected = false;
let prevLoadedFiles = [];

function initPreloads() {
  const ca = wasmImports.ca;
  wasmImports.ca = function (url, file, request, param, arg, onload, onerror, onprogress) {
    if (preloadFiles) {
      const _url = UTF8ToString(url);
              
      const filePath = getFilePathForPreloads(decodeURIComponent(_url));
      gameLoadedFiles.add(filePath);

      // Game language detection
      if (_url.indexOf("/Language") !== -1 && !filePath.endsWith("/meta.ini")) 
        preloadsGameLang = filePath.substring(1, filePath.substring(1, filePath.length).indexOf("/") + 1);
      if (filePath.indexOf("/Title") !== -1) {
        gameLoadedFiles = new Set(Object.keys(preloadedFiles));
        preloadsGameLang = "default";
        for (let prevFile of prevLoadedFiles) {
          if (prevFile.indexOf("/Language") !== -1) {
            let folderFilePath = getFilePathForPreloads(decodeURIComponent(prevFile));
            preloadsGameLang = folderFilePath.substring(1, folderFilePath.substring(1, folderFilePath.length).indexOf("/") + 1);
            break
          }
        }
        if (preloadsLangDetected)
          preloadFilesFromMapId("title");
        preloadsLangDetected = true;
      }
      prevLoadedFiles.push(_url);
      if (prevLoadedFiles.length > 4)
        prevLoadedFiles.shift(1);
      if (filePath.endsWith(".lmu"))
        preloadFilesFromMapId("event" + filePath.replace("/Map", "").replace(".lmu", ""));
      if (preloadedFiles.hasOwnProperty(filePath)) {
        runtimeKeepalivePush();
        let _file = UTF8ToString(file);
        _file = PATH_FS.resolve(_file);
        const index = _file.lastIndexOf("/");
        const http = new XMLHttpRequest();
        const handle = wget.getNextWgetRequestHandle();
        const destinationDirectory = PATH.dirname(_file);
        try {
          FS.unlink(_file);
        } catch (e) {}
        FS.mkdirTree(destinationDirectory);
        FS.createDataFile(_file.substr(0, index), _file.substr(index + 1), new Uint8Array(preloadedFiles[filePath]), true, true, false);
        if (onload) {
          withStackSave((function() {
            ((a1,a2,a3)=>dynCall_viii.apply(null, [onload, a1, a2, a3]))(handle, arg, stringToUTF8OnStack(_file));
          }));
        }
        if (filePath !== "/CharSet/syujinkou_effect_action_01.png")
          delete preloadedFiles[filePath];
                    
        wget.wgetRequests[handle] = http;
        return handle;
      }
    }
    ca(url, file, request, param, arg, onload, onerror, onprogress);
  };
}