let toastAnimEndTimer;

let fadeToastQueue = [];

function showToastMessage(message, icon) {
  if (!globalConfig.showNotifications)
    return null;
    
  const toast = document.createElement('div');
  toast.classList.add('toast');

  if (icon) {
    const toastIcon = getSvgIcon(icon, true);
    toast.appendChild(toastIcon);
  }

  const toastMessageContainer = document.createElement('div');
  toastMessageContainer.classList.add('toastMessageContainer');

  const toastMessage = document.createElement('div');
  toastMessage.classList.add('toastMessage');

  toastMessage.innerHTML = getMassagedLabel(message, true);

  toastMessageContainer.appendChild(toastMessage);
  toast.appendChild(toastMessageContainer);

  const closeButton = document.createElement('a');
  closeButton.classList.add('closeToast');
  closeButton.innerText = '✖';
  closeButton.href = 'javascript:void(0);';
  closeButton.onclick = () => toast.remove();
  toast.appendChild(closeButton);

  const toastContainer = document.getElementById('toastContainer');

  toastContainer.appendChild(toast);

  if (toastAnimEndTimer) {
    clearInterval(toastAnimEndTimer);
    toastContainer.classList.remove('anim');
  }

  toastContainer.style.bottom = `-${toast.getBoundingClientRect().height + 8}px`;
  setTimeout(() => {
    toastContainer.classList.add('anim');
    toastContainer.style.bottom = '0';
    toastAnimEndTimer = setTimeout(() => {
      toastContainer.classList.remove('anim');
      toastAnimEndTimer = null;
      const fadeToastFunc = () => {
        toast.classList.add('fade');
        setTimeout(() => toast.remove(), 1000);
      };
      if (document.hidden)
        fadeToastQueue.push(fadeToastFunc);
      else
        setTimeout(fadeToastFunc, 10000);
    }, 500);
  }, 10);
}

document.addEventListener('visibilitychange', () => {
  while (fadeToastQueue.length)
    setTimeout(fadeToastQueue.shift(), 10000);
});