let loginToken = null;

function initAccountControls() {
  document.getElementById('loginButton').onclick = () => {
    document.getElementById('loginErrorRow').classList.add('hidden');
    openModal('loginModal');
  };
  document.getElementById('logoutButton').onclick = () => {
    apiFetch('logout')
      .then(response => {
        if (!response.ok)
          console.error(response.statusText);
        closeSession();
        setCookie('sessionId', '');
        fetchAndUpdatePlayerInfo();
      }).catch(err => console.error(err));
  };

  document.getElementById('loginForm').onsubmit = function () {
    const form = this;
    closeModal();
    apiFetch(`login?${new URLSearchParams(new FormData(form)).toString()}`)
      .then(response => {
        if (!response.ok) {
          response.text().then(_ => {
            document.getElementById('loginError').innerHTML = getMassagedLabel(localizedMessages.account.login.errors.invalidLogin, true);
            document.getElementById('loginErrorRow').classList.remove('hidden');
            openModal('loginModal');
          });
          return;
        }
        return response.text();
      }).then(sId => {
        if (sId) {
          closeSession();
          setCookie('sessionId', sId);
          fetchAndUpdatePlayerInfo();
        }
      }).catch(err => console.error(err));
    return false;
  };

  document.getElementById('registerForm').onsubmit = function () {
    const form = this;
    if (document.getElementById('registerPassword').value !== document.getElementById('registerConfirmPassword').value) {
      document.getElementById('registerError').innerHTML = getMassagedLabel(localizedMessages.account.register.errors.confirmPasswordMismatch, true);
      document.getElementById('registerErrorRow').classList.remove('hidden');
      return false;
    }
    closeModal();
    apiFetch(`register?${new URLSearchParams(new FormData(form)).toString()}`)
      .then(response => {
        if (!response.ok) {
          response.text().then(error => {
            document.getElementById('registerError').innerHTML = getMassagedLabel(localizedMessages.account.register.errors[error === 'user exists' ? 'usernameTaken' : 'invalidCredentials'], true);
            document.getElementById('registerErrorRow').classList.remove('hidden');
            openModal('registerModal');
          });
          return;
        }
        document.getElementById('loginErrorRow').classList.add('hidden');
        openModal('loginModal');
      })
      .catch(err => console.error(err));
    return false;
  };

  document.getElementById('accountSettingsButton').onclick = () => {
    initAccountSettingsModal();
    openModal('accountSettingsModal', null, 'settingsModal');
  };

  document.getElementById('changePasswordButton').onclick = () => {
    initPasswordModal();
    openModal('passwordModal', null, 'accountSettings');
  };

  document.getElementById('changePasswordForm').onsubmit = function () {
    const form = this;
    if (document.getElementById('newPassword').value !== document.getElementById('newConfirmPassword').value) {
      document.getElementById('passwordError').innerHTML = getMassagedLabel(localizedMessages.account.password.errors.confirmPasswordMismatch, true);
      document.getElementById('passwordErrorRow').classList.remove('hidden');
      return false;
    }
    closeModal();
    apiFetch(`changePw?${new URLSearchParams(new FormData(form)).toString()}`)
      .then(response => {
        if (!response.ok) {
          response.text().then(error => {
            document.getElementById('passwordError').innerHTML = getMassagedLabel(localizedMessages.account.password.errors[error === 'bad login' ? 'badLogin' : 'internalServerError'], true);
            document.getElementById('passwordErrorRow').classList.remove('hidden');
            openModal('passwordModal');
          });
          return;
        }
        document.getElementById('passwordErrorRow').classList.add('hidden');
      })
      .catch(err => console.error(err));
    return false;
  };
}

function initAccountSettingsModal() {
  const badgeId = playerData?.badge || 'null';
  const badge = playerData?.badge ? badgeCache.find(b => b.badgeId === badgeId) : null;

  const accountBadgeButton = document.getElementById('accountBadgeButton');
  const badgeButton = document.getElementById('badgeButton');

  accountBadgeButton.innerHTML = getBadgeItem(badge || { badgeId: 'null' }, false, true, false, true).innerHTML;
  badgeButton.innerHTML = getBadgeItem(badge || { badgeId: 'null' }, false, true).innerHTML;

  if (gameId === '2kki' && badge?.overlayType & BadgeOverlayType.LOCATION) {
    handle2kkiBadgeOverlayLocationColorOverride(accountBadgeButton.querySelector('.badgeOverlay'), accountBadgeButton.querySelector('.badgeOverlay2'), cachedLocations);
    handle2kkiBadgeOverlayLocationColorOverride(badgeButton.querySelector('.badgeOverlay'), badgeButton.querySelector('.badgeOverlay2'), cachedLocations);
  }
}

function initPasswordModal() {
  document.getElementById('oldPassword').innerHTML = '';
  document.getElementById('newPassword').innerHTML = '';
  document.getElementById('newConfirmPasword').innerHTML = '';
  document.getElementById('passwordErrorRow').classList.add('hidden');
}

function showAccountToastMessage(key, icon, username) {
  if (!notificationConfig.account.all || (notificationConfig.account.hasOwnProperty(key) && !notificationConfig.account[key]))
    return;
  let message = getMassagedLabel(localizedMessages.toast.account[key], true).replace('{USER}', username);
  showToastMessage(message, icon, true);
}