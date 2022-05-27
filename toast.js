let toastAnimEndTimer;

let fadeToastQueue = [];

const notificationTypes = {
  system: [
    'siteUpdates',
    'floodDetected'
  ],
  account: [
    'loggedIn',
    'loggedOut'
  ],
  parties: [
    'create',
    'update',
    'join',
    'leave',
    'remove',
    'disband',
    'playerJoin',
    'playerLeave',
    'playerOnline',
    'playerOffline',
    'kickPlayer',
    'transferPartyOwner'
  ],
  eventLocations: [
    'complete',
    'freeComplete',
    'listUpdated'
  ],
  badges: [
    'badgeUnlocked'
  ],
  saveSync: [
    'saveUploading',
    'saveUploaded',
    'saveDownloading',
    'saveDownloaded',
    'saveUpToDate',
    'saveCleared'
  ]
};

let notificationConfig = {
  all: true,
  screenPosition: 'bottomLeft'
};

const accountNotificationCategories = [ 'account', 'eventLocations', 'badges', 'saveSync' ];

function initNotificationsConfigAndControls() {
  const notificationSettingsControls = document.querySelector('#notificationSettingsModal .formControls');

  for (let category of Object.keys(notificationTypes)) {
    const categoryConfig = { all: true };
    notificationConfig[category] = categoryConfig;

    const accountRequired = accountNotificationCategories.indexOf(category) > -1;

    const categoryRow = document.createElement('li');
    categoryRow.classList.add('formControlRow');
    if (accountRequired)
      categoryRow.classList.add('accountRequired');

    const categoryButtonId = `notificationsButton_${category}`;

    const categoryLabel = document.createElement('label');
    categoryLabel.for = categoryButtonId;
    categoryLabel.classList.add('unselectable');
    categoryLabel.dataset.i18n = `[html]modal.notificationSettings.fields.${category}.label`;

    const categoryButtonContainer = document.createElement('div');

    const categoryButton = document.createElement('button');
    categoryButton.id = categoryButtonId;
    categoryButton.classList.add('checkboxButton');
    categoryButton.classList.add('inverseToggle');
    categoryButton.classList.add('unselectable');
    categoryButton.onclick = function () {
      const toggled = !this.classList.contains('toggled');
      this.classList.toggle('toggled', toggled);
      const typeRows = notificationSettingsControls.querySelectorAll(`.formControlRow[data-category="${category}"]`);
      for (let row of typeRows)
        row.classList.toggle('hidden', toggled);
      notificationConfig[category].all = !toggled;
      updateConfig(notificationConfig, true, 'notificationConfig');
    };

    categoryButton.appendChild(document.createElement('span'));

    categoryRow.appendChild(categoryLabel);
    
    categoryButtonContainer.appendChild(categoryButton);
    categoryRow.appendChild(categoryButtonContainer);

    notificationSettingsControls.appendChild(categoryRow);
    
    for (let type of notificationTypes[category]) {
      categoryConfig[type] = true;

      const typeRow = document.createElement('li');
      typeRow.classList.add('formControlRow');
      typeRow.classList.add('indent');
      if (accountRequired)
        typeRow.classList.add('accountRequired');
      typeRow.dataset.category = category;

      const typeButtonId = `${categoryButtonId}_${type}`;

      const typeLabel = document.createElement('label');
      typeLabel.classList.add('unselectable');
      typeLabel.for = typeButtonId;
      typeLabel.dataset.i18n = `[html]modal.notificationSettings.fields.${category}.fields.${type}`;

      const typeButtonContainer = document.createElement('div');

      const typeButton = document.createElement('button');
      typeButton.id = typeButtonId;
      typeButton.classList.add('checkboxButton');
      typeButton.classList.add('inverseToggle');
      typeButton.classList.add('unselectable');
      typeButton.onclick = function () {
        this.classList.toggle('toggled');
        notificationConfig[category][type] = !this.classList.contains('toggled');
        updateConfig(notificationConfig, true, 'notificationConfig');
      };

      typeButton.appendChild(document.createElement('span'));

      typeRow.appendChild(typeLabel);

      typeButtonContainer.appendChild(typeButton);
      typeRow.appendChild(typeButtonContainer);

      notificationSettingsControls.appendChild(typeRow);
    }
  }

  document.getElementById('notificationsButton').onclick = function () {
    const toggled = !this.classList.contains('toggled');
    this.classList.toggle('toggled', toggled);
    document.getElementById('notificationSettingsModal').classList.toggle('notificationsOff', toggled);
    notificationConfig.all = !toggled;
    updateConfig(notificationConfig, true, 'notificationConfig');
  };

  document.getElementById('notificationScreenPosition').onclick = function () { setNotificationScreenPosition(this.value); };
}

function setNotificationScreenPosition(value) {
  if (value) {
    const toastContainer = document.getElementById('toastContainer');
    toastContainer.classList.toggle('top', value === 'topLeft' || value === 'topRight');
    toastContainer.classList.toggle('right', value === 'bottomRight' || value === 'topRight');
    document.getElementById('notificationScreenPosition').value = value;
    notificationConfig.screenPosition = value;
    updateConfig(notificationConfig, true, 'notificationConfig');
  }
}

function showToastMessage(message, icon, iconFill, systemName, persist) {
  if (!notificationConfig.all)
    return;

  if (systemName) {
    if (gameUiThemes.indexOf(systemName) === -1)
      systemName = getDefaultUiTheme();
    systemName = systemName.replace(' ', '_')
  }
    
  const toast = document.createElement('div');
  toast.classList.add('toast');
  if (systemName)
    toast.setAttribute('style', `background-image: var(--container-bg-image-url-${systemName}) !important; border-image: var(--border-image-url-${systemName}) 8 repeat !important;`)

  if (icon) {
    const toastIcon = getSvgIcon(icon, iconFill);
    if (systemName)
      toastIcon.querySelector('path').setAttribute('style', `fill: var(--svg-base-gradient-${systemName}); filter: var(--svg-shadow-${systemName});`);
    toast.appendChild(toastIcon);
  }

  const toastMessageContainer = document.createElement('div');
  toastMessageContainer.classList.add('toastMessageContainer');

  const toastMessage = document.createElement('div');
  toastMessage.classList.add('toastMessage');
  if (systemName)
    toastMessage.setAttribute('style', `background-image: var(--base-gradient-${systemName}) !important; drop-shadow(1.5px 1.5px var(--shadow-color-${systemName}));`);

  toastMessage.innerHTML = message;

  toastMessageContainer.appendChild(toastMessage);
  toast.appendChild(toastMessageContainer);

  const closeButton = document.createElement('a');
  closeButton.classList.add('closeToast');
  if (systemName)
    closeButton.setAttribute('style', `background-image: var(--alt-gradient-${systemName}) !important; drop-shadow(1.5px 1.5px var(--shadow-color-${systemName}));`);
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

  const rootStyle = document.documentElement.style;

  rootStyle.setProperty('--toast-offset', `-${toast.getBoundingClientRect().height + 8}px`);
  setTimeout(() => {
    toastContainer.classList.add('anim');
    rootStyle.setProperty('--toast-offset', '0');
    toastAnimEndTimer = setTimeout(() => {
      toastContainer.classList.remove('anim');
      toastAnimEndTimer = null;
      if (!persist) {
        const fadeToastFunc = () => {
          toast.classList.add('fade');
          setTimeout(() => toast.remove(), 1000);
        };
        if (document.hidden)
          fadeToastQueue.push(fadeToastFunc);
        else
          setTimeout(fadeToastFunc, 10000);
      }
    }, 500);
  }, 10);
}

// EXTERNAL
function showClientToastMessage(key, icon) {
  showSystemToastMessage(key, icon);
}

function showSystemToastMessage(key, icon) {
  if (!notificationConfig.system.all || !notificationConfig.system[key])
    return;
  showToastMessage(getMassagedLabel(localizedMessages.toast.system[key], true), icon, true, null, true);
}

document.addEventListener('visibilitychange', () => {
  while (fadeToastQueue.length)
    setTimeout(fadeToastQueue.shift(), 10000);
});