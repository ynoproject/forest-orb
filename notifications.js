'use strict';

// in case user never visited ynoproject.net
navigator.serviceWorker.register('../service-worker.js');

navigator.serviceWorker.ready.then(async registration => {
  console.log('Service worker ready.');
  await new Promise(resolve => {
    const handle = setInterval(() => {
      if (localizedMessages) {
        clearInterval(handle);
        resolve();
      }
    }, 1000);
  });

  registration.active?.postMessage({
    sessionId: getCookie(sessionIdKey),
    game: gameId,
  });
  const applicationServerKey = await apiFetch('vapidpublickey').then(r => r.text());
  const permissions = await registration.pushManager.permissionState({ userVisibleOnly: true, applicationServerKey });
  const hasSubscription = await registration.pushManager.getSubscription();
  if (permissions !== 'denied' && !hasSubscription && !globalConfig.pushNotificationToastDismissed && notificationConfig.system.all && notificationConfig.system.pushNotifications) {
    const toast = showToastMessage(localizedMessages.requestNotifications, null, null, null, true);
    if (toast) {
      const approveIcon = getSvgIcon('approve', true);
      approveIcon.classList.add('iconButton');
      approveIcon.onclick = async () => {
        toast.remove();
        apiFetch('vapidpublickey')
          .then(r => r.text())
          .then(applicationServerKey => registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey }))
          .then(subscription => apiJsonPost('registernotification', subscription.toJSON()))
          .catch(err => console.error(err));
      };
      const closeToast = toast.querySelector('.closeToast');
      toast.insertBefore(approveIcon, closeToast);
      closeToast.addEventListener('click', () => {
        globalConfig.pushNotificationToastDismissed = true;
        updateConfig(globalConfig, true);
      });
    }
  }
});

navigator.serviceWorker.addEventListener('message', function serviceWorkerRelay({ data }) {
  if (!data) return;
  switch (data._type) {
    case 'toast':
      if (!Array.isArray(data.args) || !notificationConfig.system.all || !notificationConfig.system.pushNotifications) break;
      showToastMessage(...data.args);
      break;
    default:
      console.warn('unknown message type', data._type);
      break;
  }
});
