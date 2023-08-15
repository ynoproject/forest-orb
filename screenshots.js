function initScreenshotControls() {
  document.getElementById('screenshotButton').onclick = () => takeScreenshot(0);
}

function viewScreenshot(url, date) {
  const screenshot = document.createElement('img');
  screenshot.classList.add('screenshot');
  screenshot.src = url;

  const screenshotModal = document.getElementById('screenshotModal');
  const screenshotModalContent = screenshotModal.querySelector('.modalContent');
  screenshotModalContent.innerHTML = '';
  screenshotModalContent.append(screenshot);

  screenshotModal.querySelector('.downloadScreenshotButton').onclick = () => downloadScreenshot(url, date);
  
  openModal('screenshotModal');
}

function downloadScreenshot(url, date) {
  const a = document.createElement('a');
  const [month, day, year, hour, minute, second] = [date.getMonth(), date.getDate(), date.getFullYear(), date.getHours(), date.getMinutes(), date.getSeconds()]
  a.href = url;
  a.download = `ynoproject_${ynoGameId}_screenshot_${year}-${month + 1}-${day}-${hour}-${minute}-${second}`;
  a.click();
}

function takeScreenshot(retryCount) {
  const screenshotCanvas = document.createElement("canvas");
  const screenshotContext = screenshotCanvas.getContext("2d");

  screenshotCanvas.width = '320';
  screenshotCanvas.height = '240';

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
    } else
      downloadScreenshot(url, dateTaken);
  } else if (retryCount < 8)
    setTimeout(() => takeScreenshot(retryCount + 1), 0);

  screenshotCanvas.remove();
}

function checkScreenshot(canvas) {
  const context = canvas.getContext('2d');

  for (let y = 8; y < canvas.height - 8; y += 16) {
    for (let x = 8; x < canvas.width - 8; x += 16) {
      const pixel = context.getImageData(x, y, 1, 1).data;
      if (pixel[0] || pixel[1] || pixel[2])
        return true;
    }
  }

  return false;
}

function showScreenshotToastMessage(key, icon, iconFill, systemName, persist) {
  if (!notificationConfig.screenshots.all || !notificationConfig.screenshots[key])
    return;
  const message = getMassagedLabel(localizedMessages.toast.screenshots[key], true);
  return showToastMessage(message, icon, iconFill, systemName, persist);
}