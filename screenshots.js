let screenshotCount = 0;
let screenshotLimit = 10;

function initScreenshotControls() {
  document.getElementById('autoDownloadScreenshotsButton').onclick = function () {
    this.classList.toggle('toggled');
    const toggled = this.classList.contains('toggled');
    globalConfig.autoDownloadScreenshots = toggled;
    updateConfig(globalConfig, true);
  };

  document.getElementById('screenshotResolution').onchange = function () {
    globalConfig.screenshotResolution = this.value;
    updateConfig(globalConfig, true);
  };

  document.getElementById('screenshotButton').onclick = () => takeScreenshot(0);
  document.getElementById('myScreenshotsButton').onclick = () => {
    initMyScreenshotsModal();
    openModal('myScreenshotsModal');
  };
}

function viewScreenshot(url, date, lastModal) {
  const isRemote = url.startsWith(serverUrl);

  const screenshot = document.createElement('img');
  screenshot.classList.add('screenshot');
  screenshot.src = url;

  const screenshotModal = document.getElementById('screenshotModal');
  const screenshotModalContent = screenshotModal.querySelector('.modalContent');
  screenshotModalContent.innerHTML = '';
  screenshotModalContent.append(screenshot);

  const saveButton = screenshotModal.querySelector('.saveScreenshotButton');

  screenshotModal.querySelector('.downloadScreenshotButton').onclick = () => downloadScreenshot(url, date);

  saveButton.classList.toggle('hidden', isRemote);
  saveButton.disabled = screenshotCount >= screenshotLimit ? 'disabled' : undefined;
  saveButton.onclick = () => {
    if (isRemote)
      return;
    addLoader(screenshotModal, true);
    uploadScreenshot(url, date).then(success => {
      removeLoader(screenshotModal);
      if (success) {
        initMyScreenshotsModal();
        openModal('myScreenshotsModal');
      }
    });
  };
  
  openModal('screenshotModal', null, lastModal);
}

function downloadScreenshot(url, date, resized) {
  if (url.startsWith(serverUrl)) {
    fetch(url).then(response => response.blob()).then(blob => {
      downloadScreenshot(URL.createObjectURL(blob), date, true);
    });
    return;
  }

  if (!resized && globalConfig.screenshotResolution > 1) {
    const scaleCanvas = document.createElement('canvas');
    const scaleContext = scaleCanvas.getContext('2d');

    const width = 320 * globalConfig.screenshotResolution;
    const height = 240 * globalConfig.screenshotResolution;

    scaleCanvas.width = width;
    scaleCanvas.height = height;

    scaleContext.imageSmoothingEnabled = false;

    const img = new Image(320, 240);
    img.onload = () => {
      scaleContext.drawImage(img, 0, 0, width, height);
      downloadScreenshot(scaleCanvas.toDataURL(), date, true);
    };
    img.src = url;
    return;
  }

  const a = document.createElement('a');
  const [month, day, year, hour, minute, second] = [date.getMonth(), date.getDate(), date.getFullYear(), date.getHours(), date.getMinutes(), date.getSeconds()];
  a.href = url;
  a.download = `ynoproject_${ynoGameId}_screenshot_${year}-${month + 1}-${day}-${hour}-${minute}-${second}`;
  a.click();
}

function takeScreenshot(retryCount) {
  const screenshotCanvas = document.createElement('canvas');
  const screenshotContext = screenshotCanvas.getContext('2d');

  screenshotCanvas.width = 320;
  screenshotCanvas.height = 240;

  screenshotContext.drawImage(canvas, 0, 0, 320, 240);

  const url = screenshotCanvas.toDataURL();
  const isValid = checkScreenshot(screenshotCanvas);

  if (isValid) {
    const dateTaken = new Date();

    if (notificationConfig.all && notificationConfig.screenshots.all && notificationConfig.screenshots.screenshotTaken) {
      const toast = showScreenshotToastMessage('screenshotTaken', 'image', true, null, true);
      const thumb = document.createElement('img');
      thumb.classList.add('screenshotThumbnail');
      thumb.src = url;
      toast.querySelector('.toastMessage').prepend(thumb);
      document.documentElement.style.setProperty('--toast-offset', `-${toast.getBoundingClientRect().height + 8}px`);

      thumb.onclick = () => viewScreenshot(url, dateTaken);

      if (!globalConfig.autoDownloadScreenshots)
        return;
    }

    downloadScreenshot(url, dateTaken);
  } else if (retryCount < 8)
    setTimeout(() => takeScreenshot(retryCount + 1), 0);

  screenshotCanvas.remove();
}

function uploadScreenshot(url) {
  return new Promise(resolve => {
    apiPost('screenshot?command=uploadScreenshot', getScreenshotBinary(url), 'application/png')
      .then(response => {
        if (!response.ok)
          throw new Error(response.statusText);
        resolve(true);
      }).catch(err => {
        console.error(err);
        resolve(false);
      });
  });
}

function checkScreenshot(canvas) {
  const context = canvas.getContext('2d');

  for (let y = 8; y < canvas.height - 8; y += 16) {
    for (let x = 8; x < canvas.width - 8; x += 16) {
      const pixel = context.getImageData(x, y, 1, 1).data;
      if (pixel[0] > 1 || pixel[1] > 1 || pixel[2] > 1)
        return true;
    }
  }

  return false;
}

function getScreenshotBinary(url) {
  const arr = url.split(',');
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const ret = new Uint8Array(n);
  while (n--)
    ret[n] = bstr.charCodeAt(n);
  return ret;
}

function initMyScreenshotsModal() {
  const myScreenshotsModal = document.getElementById('myScreenshotsModal');
  const screenshotItemsList = myScreenshotsModal.querySelector('.itemContainer');
  screenshotItemsList.innerHTML = '';

  const limitLabel = document.getElementById('myScreenshotsLimitLabel');
  const emptyLabel = document.getElementById('myScreenshotsEmptyLabel');
  
  addLoader(myScreenshotsModal);

  apiFetch('screenshot?command=getPlayerScreenshots').then(response => {
    if (!response.ok)
      throw new Error(response.statusText);
    return response.json();
  }).then(screenshots => {
    removeLoader(myScreenshotsModal);

    screenshotCount = screenshots?.length || 0;

    limitLabel.innerHTML = getMassagedLabel(localizedMessages.screenshots.limit.replace('{COUNT}', screenshotCount).replace('{LIMIT}', screenshotLimit), true);
    emptyLabel.classList.toggle('hidden', !!screenshotCount);

    if (!screenshotCount)
      return;

    for (let screenshot of screenshots) {
      const screenshotItem = document.createElement('div');
      screenshotItem.classList.add('screenshotItem', 'item');

      const screenshotThumbnail = document.createElement('img');
      screenshotThumbnail.classList.add('screenshotThumbnail');
      screenshotThumbnail.src = `${serverUrl}/screenshots/${screenshot.uuid}/${screenshot.id}.png`;
      screenshotThumbnail.onclick = () => viewScreenshot(screenshotThumbnail.src, new Date(screenshot.timestamp), 'myScreenshotsModal');

      const screenshotControls = document.createElement('div');
      screenshotControls.classList.add('screenshotControls');

      const deleteButton = getSvgIcon('delete');
      deleteButton.classList.add('iconButton');
      deleteButton.onclick = () => {
        if (!confirm(localizedMessages.screenshots.delete.confirm))
          return;
        
        addLoader(myScreenshotsModal);

        apiFetch(`screenshot?command=deleteScreenshot&id=${screenshot.id}`).then(response => {
          if (!response.ok)
            throw new Error(response.statusText);
          initMyScreenshotsModal();
        });
      };
      addTooltip(deleteButton, getMassagedLabel(localizedMessages.screenshots.delete.tooltip, true), true);

      screenshotControls.append(deleteButton);

      screenshotItem.append(screenshotThumbnail);
      screenshotItem.append(screenshotControls);
      
      screenshotItemsList.append(screenshotItem);
    }
  });
}

function showScreenshotToastMessage(key, icon, iconFill, systemName, persist) {
  if (!notificationConfig.screenshots.all || !notificationConfig.screenshots[key])
    return;
  const message = getMassagedLabel(localizedMessages.toast.screenshots[key], true);
  return showToastMessage(message, icon, iconFill, systemName, persist);
}