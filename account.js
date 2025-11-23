let loggedIn = false;

function initAccountControls() {
  document.getElementById('loginButton').onclick = () => {
    document.getElementById('loginErrorRow').classList.add('hidden');
    openModal('loginModal');
    turnstile.reset();
  };
  document.getElementById('logoutButton').onclick = () => {
    showConfirmModal(localizedMessages.logout, () => {
      authApiFetch('logout')
        .then(response => {
          if (!response.ok)
            console.error(response.statusText);
          setCookie(loggedInKey, '');
          closeSessionWs();
          fetchAndUpdatePlayerInfo(false);
        }).catch(err => console.error(err));
    });
  };

  document.getElementById('loginForm').onsubmit = function () {
    const form = this;
    authApiPost('login', new URLSearchParams(new FormData(form)), 'application/x-www-form-urlencoded')
      .then(response => {
        if (!response.ok) {
          response.text().then(_ => {
            document.getElementById('loginError').innerHTML = getMassagedLabel(localizedMessages.account.login.errors.invalidLogin, true);
            document.getElementById('loginErrorRow').classList.remove('hidden');
          });
          turnstile.reset();
          return;
        }
        closeSessionWs();
        fetchAndUpdatePlayerInfo(true);
        closeModal();
        return;
      }).catch(err => console.error(err));
    return false;
  };

  document.getElementById('loginRegisterLink').onclick = () => {
    openModal('registerModal');
    turnstile.reset();
  };

  document.getElementById('registerForm').onsubmit = function () {
    const form = this;
    if (document.getElementById('registerPassword').value !== document.getElementById('registerConfirmPassword').value) {
      document.getElementById('registerError').innerHTML = getMassagedLabel(localizedMessages.account.register.errors.confirmPasswordMismatch, true);
      document.getElementById('registerErrorRow').classList.remove('hidden');
      return false;
    }
    authApiPost('register', new URLSearchParams(new FormData(form)), 'application/x-www-form-urlencoded')
      .then(response => {
        if (!response.ok) {
          response.text().then(error => {
            document.getElementById('registerError').innerHTML = getMassagedLabel(localizedMessages.account.register.errors[error.replace('\n', '') === 'user exists' ? 'usernameTaken' : 'invalidCredentials'], true);
            document.getElementById('registerErrorRow').classList.remove('hidden');
          });
          turnstile.reset();
          return;
        }
        document.getElementById('loginErrorRow').classList.add('hidden');
        openModal('loginModal');
        turnstile.reset();
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
    openModal('passwordModal', null, 'accountSettingsModal');
  };

  document.getElementById('changePasswordForm').onsubmit = function () {
    const form = this;
    if (document.getElementById('newPassword').value !== document.getElementById('newConfirmPassword').value) {
      document.getElementById('passwordError').innerHTML = getMassagedLabel(localizedMessages.account.password.errors.confirmPasswordMismatch, true);
      document.getElementById('passwordErrorRow').classList.remove('hidden');
      return false;
    }
    closeModal();
    apiFetch(`changepw?${new URLSearchParams(new FormData(form)).toString()}`)
      .then(response => {
        if (!response.ok) {
          response.text().then(error => {
            document.getElementById('passwordError').innerHTML = getMassagedLabel(localizedMessages.account.password.errors[error === 'bad login' ? 'badLogin' : 'internalServerError'], true);
            document.getElementById('passwordErrorRow').classList.remove('hidden');
            openModal('passwordModal', null, 'accountSettingsModal');
          });
          return;
        }
        showAccountToastMessage('passwordUpdated', 'info');
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

  if (badge?.overlayType & BadgeOverlayType.LOCATION) {
    handleBadgeOverlayLocationColorOverride(accountBadgeButton.querySelector('.badgeOverlay'), accountBadgeButton.querySelector('.badgeOverlay2'), cachedLocations);
    handleBadgeOverlayLocationColorOverride(badgeButton.querySelector('.badgeOverlay'), badgeButton.querySelector('.badgeOverlay2'), cachedLocations);
  }
}

function initPasswordModal() {
  document.getElementById('oldPassword').value = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('newConfirmPassword').value = '';
  document.getElementById('passwordErrorRow').classList.add('hidden');
}

function updateModControls(forceRecreate = false) {
  const modSettingsModal = document.getElementById('modSettingsModal');
  if (!modSettingsModal) return;
  const modSettingsControls = modSettingsModal.querySelector('.formControls');
  const modSettingsTitle = modSettingsModal.querySelector('.modalTitle');
  let modSettingsButton = document.getElementById('modSettingsButton');
  if (playerData && playerData.rank >= 1) {
    if (typeof localizedMessages === 'undefined' || !localizedMessages.modSettings) {
      return;
    }
    if (modSettingsTitle) {
      modSettingsTitle.textContent = getMassagedLabel(localizedMessages.modSettings.title, true);
    }
    if (modSettingsButton && !forceRecreate)
      return;
    if (!modSettingsButton) {
      modSettingsButton = document.createElement('button');
      modSettingsButton.id = 'modSettingsButton';
      modSettingsButton.classList.add('unselectable', 'iconButton');
      addTooltip(modSettingsButton, getMassagedLabel(localizedMessages.modSettings.title, true), true, true);
      modSettingsButton.onclick = () => openModal('modSettingsModal');
      modSettingsButton.innerHTML = '<svg viewbox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="m2 2q5 0 7-2 2 2 7 2 0 9-7 16-7-7-7-16m2 2q3 0 5-2 2 2 5 2-1 7-5 12-4-5-5-12"></path></svg>';
      document.getElementById('leftControls').appendChild(modSettingsButton);
    } else {
      addTooltip(modSettingsButton, getMassagedLabel(localizedMessages.modSettings.title, true), true, true);
      if (forceRecreate) {
        modSettingsControls.innerHTML = '';
      }
    }

    if (forceRecreate || !modSettingsControls.children.length) {
      const addModControlsButton = (label, onClick) => {
        const row = document.createElement('li');
        row.classList.add('formControlRow');

        const button = document.createElement('button');
        button.classList.add('unselectable');
        button.type = 'button';
        button.innerHTML = label;
        button.onclick = onClick;

        row.appendChild(button);

        modSettingsControls.appendChild(row);
      };

    const adminPlayerAction = (action, playerPromptMessage, successMessage, successIcon) => {
      const playerName = prompt(playerPromptMessage);
      if (!playerName)
        return;
      apiFetch(`${action}${action.indexOf('?') > -1 ? '&' : '?'}user=${playerName}`, true)
        .then(response => {
          if (!response.ok)
            throw new Error(response.statusText);
          return response.text();
        })
        .then(response => showToastMessage((typeof successMessage === 'function' ? successMessage(response) : successMessage).replace('{PLAYER}', playerName), successIcon, true, null, true))
        .catch(err => console.error(err));
    };

    const adminPlayerActionTemporal = (action, playerPromptMessage, timePromptMessage, successMessage, successIcon) => {
      const user = prompt(playerPromptMessage);
      if (!user)
        return;
      const expiry = prompt(timePromptMessage, new Date().toISOString());
      if (!expiry)
        return;
      const q = new URLSearchParams({ user, expiry });
      apiFetch(`${action}?${q}`, true)
        .then(response => {
          if (!response.ok)
            throw new Error(response.statusText);
          return response.text();
        })
        .then(response => showToastMessage((typeof successMessage === 'function' ? successMessage(response) : successMessage).replace('{PLAYER}', playerName), successIcon, true, null, true))
        .catch(err => console.error(err));
    };

    addModControlsButton(localizedMessages.modSettings.actions.resetPassword.label,
      () => adminPlayerAction('resetpw', localizedMessages.modSettings.actions.resetPassword.playerPrompt, newPassword => getMassagedLabel(localizedMessages.modSettings.actions.resetPassword.success, true).replace('{PASSWORD}', newPassword), 'info'));
    addModControlsButton(localizedMessages.modSettings.actions.changeUsername.label,
      () => {
        const playerName = prompt(localizedMessages.modSettings.actions.changeUsername.playerPrompt);
        if (!playerName)
          return;
        const newPlayerName = prompt(localizedMessages.modSettings.actions.changeUsername.namePrompt.replace('{PLAYER}', playerName));
        if (!newPlayerName)
          return;
        apiFetch(`changeusername?user=${playerName}&newUser=${newPlayerName}`, true)
          .then(response => {
            if (!response.ok) {
              showToastMessage(getMassagedLabel(localizedMessages.modSettings.actions.changeUsername.error, true).replace('{PLAYER}', playerName));
              throw new Error(response.statusText);
            }
            return response.text();
          })
          .then(_ => showToastMessage(getMassagedLabel(localizedMessages.modSettings.actions.changeUsername.success, true).replace('{PLAYER}', playerName).replace('{NAME}', newPlayerName), 'info', true, null, true))
          .catch(err => console.error(err));
      });
    addModControlsButton(localizedMessages.modSettings.actions.ban.label,
      () => adminPlayerAction('ban', localizedMessages.modSettings.actions.ban.playerPrompt, getMassagedLabel(localizedMessages.context.admin.ban.success, true), 'ban'));
    addModControlsButton(localizedMessages.modSettings.actions.tempban.label,
      () => adminPlayerActionTemporal('tempban', localizedMessages.modSettings.actions.tempban.playerPrompt, localizedMessages.modSettings.actions.tempban.timePrompt, getMassagedLabel(localizedMessages.context.admin.tempban.success, true), 'ban'));
    addModControlsButton(localizedMessages.modSettings.actions.unban.label,
      () => adminPlayerAction('unban', localizedMessages.modSettings.actions.unban.playerPrompt, getMassagedLabel(localizedMessages.context.admin.unban.success, true), 'info'));
    addModControlsButton(localizedMessages.modSettings.actions.mute.label,
      () => adminPlayerAction('mute', localizedMessages.modSettings.actions.mute.playerPrompt, getMassagedLabel(localizedMessages.context.admin.mute.success, true), 'mute'));
    addModControlsButton(localizedMessages.modSettings.actions.tempmute.label,
      () => adminPlayerActionTemporal('tempmute', localizedMessages.modSettings.actions.tempmute.playerPrompt, localizedMessages.modSettings.actions.tempmute.timePrompt, getMassagedLabel(localizedMessages.context.admin.tempmute.success, true), 'mute'));
    addModControlsButton(localizedMessages.modSettings.actions.unmute.label,
      () => adminPlayerAction('unmute', localizedMessages.modSettings.actions.unmute.playerPrompt, getMassagedLabel(localizedMessages.context.admin.unmute.success, true), 'info'));

    const grantRevokeBadgeAction = isGrant => {
      const playerName = prompt(localizedMessages.modSettings.actions[isGrant ? 'grantBadge' : 'revokeBadge'].playerPrompt);
      if (!playerName)
        return;
      const localizedContextRoot = localizedMessages.context.admin[isGrant ? 'grantBadge' : 'revokeBadge'];
      const badgeId = prompt(localizedContextRoot.prompt.replace('{PLAYER}', playerName));
      if (badgeId) {
        const badgeGame = Object.keys(localizedBadges).find(game => {
          return badgeId in localizedBadges[game];
        });
        if (badgeGame) {
          const badgeName = localizedBadges[badgeGame][badgeId].name;
          apiFetch(`${isGrant ? 'grant' : 'revoke'}badge?user=${playerName}&id=${badgeId}`, true)
            .then(response => {
              if (!response.ok)
                throw new Error(response.statusText);
              return response.text();
            })
            .then(() => showToastMessage(getMassagedLabel(localizedContextRoot.success, true).replace('{BADGE}', badgeName).replace('{PLAYER}', playerName), 'info', true, null, true))
            .catch(err => console.error(err));
        } else
          alert(localizedContextRoot.fail);
      }
    };

      addModControlsButton(localizedMessages.modSettings.actions.grantBadge.label, () => grantRevokeBadgeAction(true));
      addModControlsButton(localizedMessages.modSettings.actions.revokeBadge.label, () => grantRevokeBadgeAction(false));
    }
  } else if (modSettingsButton) {
    modSettingsButton.remove();
    modSettingsControls.innerHTML = '';
  }
}

function showAccountToastMessage(key, icon, username) {
  if (!notificationConfig.account.all || (notificationConfig.account.hasOwnProperty(key) && !notificationConfig.account[key]))
    return;
  let message = getMassagedLabel(localizedMessages.toast.account[key], true).replace('{USER}', username);
  showToastMessage(message, icon);
}
