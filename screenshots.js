function initScreenshotControls() {
  document.getElementById('screenshotButton').onclick = () => takeScreenshot();
}

function takeScreenshot(retryCount) {
  const screenshotCanvas = document.createElement("canvas");
  const screenshotContext = screenshotCanvas.getContext("2d");

  screenshotCanvas.width = '320';
  screenshotCanvas.height = '240';

  screenshotContext.drawImage(canvas, 0, 0, 320, 240);

  const url = screenshotCanvas.toDataURL();
  const isValid = checkScreenshot(screenshotCanvas);
  if (!isValid) {
    if (retryCount < 10)
      takeScreenshot((retryCount || 0) + 1)
    return;
  }

  const a = document.createElement('a');
  const currentDate = new Date();
  const [month, day, year, hour, minute, second] = [currentDate.getMonth(), currentDate.getDate(), currentDate.getFullYear(), currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds()]
  a.href = url;
  a.download = `ynoproject_${ynoGameId}_screenshot_${year}-${month + 1}-${day}-${hour}-${minute}-${second}`;
  a.click();

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