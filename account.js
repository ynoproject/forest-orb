const badges = Object.assign(
  { null: { overlay: false, condition: _ => true } },
  Object.fromEntries(
    new Map(eventExpRanks
      .filter(er => er.badge)
      .map((er, i) => [
        er.badge,
        {
          overlay: er.badge === 'mono',
          condition: exp => exp.totalExp >= eventExpRanks[i].exp
        }
      ])
    )
  )
);
let sessionId = null;

function initAccountControls() {
  document.getElementById('loginButton').onclick = () => {
    document.getElementById('loginErrorRow').classList.add('hidden');
    openModal('loginModal');
  };
  document.getElementById('logoutButton').onclick = () => {
    setCookie('sessionId', '');
    fetchAndUpdatePlayerInfo();
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

  document.getElementById('badgeButton').onclick = () => {
    const badgeModalContent = document.querySelector('#badgesModal .modalContent');
    badgeModalContent.innerHTML = '';

    updatePlayerExp(exp => {
      for (let b of Object.keys(badges)) {
        const badgeId = b;
        const item = getBadgeItem(badgeId, exp);
        if (badgeId === (playerData?.badge || 'null'))
          item.children[0].classList.add('selected');
        if (!item.classList.contains('disabled')) {
          item.onclick = () => updatePlayerBadge(badgeId, () => {
            initAccountSettingsModal();
            closeModal();
          });
        }
        badgeModalContent.appendChild(item);
      }

      openModal('badgesModal', null, 'accountSettingsModal');
    });
  };
}

function initAccountSettingsModal() {
  document.getElementById('badgeButton').innerHTML = getBadgeItem(playerData?.badge || 'null').innerHTML;
}

function getBadgeItem(badgeId, exp) {
  const item = document.createElement('div');
  item.classList.add('badgeItem');
  item.classList.add('item');
  item.classList.add('unselectable');

  const badgeContainer = document.createElement('div');
  badgeContainer.classList.add('badgeContainer');
  
  const badge = (exp === undefined || badges[badgeId].condition(exp)) && badgeId !== 'null' ? document.createElement('div') : null;

  if (badge) {
    badge.classList.add('badge');
    badge.style.backgroundImage = `url('images/badge/${badgeId}.png')`;
  } else {
    if (badgeId !== 'null') {
      item.classList.add('disabled');
      badgeContainer.appendChild(getSvgIcon('locked', true));
    } else
      badgeContainer.appendChild(getSvgIcon('ban', true));
  }

  if (badge) {
    if (badges[badgeId].overlay) {
      const badgeOverlay = document.createElement('div');
      badgeOverlay.classList.add('badgeOverlay');
      badgeOverlay.setAttribute('style', `-webkit-mask-image: ${badge.style.backgroundImage}; mask-image: ${badge.style.backgroundImage};`);
      badge.appendChild(badgeOverlay);
    }

    badgeContainer.appendChild(badge);
  }

  item.appendChild(badgeContainer);

  return item;
}

function updatePlayerBadge(badgeId, callback) {
  apiFetch(`badge?id=${badgeId}`)
    .then(response => {
      if (!response.ok)
        throw new Error(response.statusText);
      syncPlayerData(playerUuids[-1], playerData?.rank, playerData?.account, badgeId, -1);
      callback();
    })
    .catch(err => console.error(err));
}

function showAccountToastMessage(key, icon, username) {
  if (!globalConfig.notifications.account.all || (globalConfig.notifications.account.hasOwnProperty(key) && !globalConfig.notifications.account[key]))
    return;
  let message = getMassagedLabel(localizedMessages.toast.account[key], true).replace('{USER}', username);
  showToastMessage(message, icon);
}