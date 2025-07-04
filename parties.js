let joinedPartyId = null;
let joinedPartyUiTheme = null;
let partyCache = {};
let partyDescriptionCache = {};
let joinedPartyCache = null;
let joinedPartyPendingOfflineMemberUuids = [];

function initPartyControls() {
  document.getElementById('createPartyButton').onclick = () => {
    const partyName = document.getElementById('partyName');
    const partyDescription = document.getElementById('partyDescription');
    const publicPartyButton = document.getElementById('publicPartyButton');
    const partyPassword = document.getElementById('partyPassword');

    partyName.value = '';

    partyDescription.value = '';

    if (publicPartyButton.classList.contains('toggled'))
      publicPartyButton.click();

    partyPassword.value = '';

    setPartyTheme(config.uiTheme === 'auto' ? systemName : config.uiTheme);

    const showHidePartyPasswordLink = document.getElementById('showHidePartyPasswordLink');
    if (showHidePartyPasswordLink.classList.contains('showPassword'))
      showHidePartyPasswordLink.click();

    openModal('createPartyModal', document.getElementById('partyTheme').value);
  };

  document.getElementById('publicPartyButton').onclick = function () {
    this.classList.toggle('toggled');
    this.closest('.formControlRow').nextElementSibling.classList.toggle('hidden', !this.classList.contains('toggled'));
    this.nextElementSibling.checked = !this.classList.contains('toggled');
  };

  document.getElementById('showHidePartyPasswordLink').onclick = function () {
    this.classList.toggle('showPassword');
    document.getElementById('partyPassword').type = this.classList.contains('showPassword') ? 'text' : 'password';
  };

  document.getElementById('partyThemeButton').onclick = function () {
    openModal('uiThemesModal', this.nextElementSibling.value, 'createPartyModal');
  };

  document.getElementById('createPartyForm').onsubmit = function () {
    const form = this;
    const formData = new FormData(form);
    const isUpdate = document.getElementById('createPartyModal').dataset.update;
    closeModal();
    apiFetch(`party?command=${isUpdate ? 'update' : 'create'}&${new URLSearchParams(formData).toString()}`)
      .then(response => {
        if (!response.ok)
          throw new Error(response.statusText);
        return response.text();
      })
      .then(partyId => {
        if (isUpdate) {
          showPartyToastMessage('update', 'party', formData.get('name'));
          updateJoinedParty(() => initOrUpdatePartyModal(joinedPartyId));
        } else {
          showPartyToastMessage('create', 'partyCreate', formData.get('name'));
          setJoinedPartyId(parseInt(partyId));
        }
        updatePartyList();
      }).catch(err => console.error(err));
    return false;
  };

  document.getElementById('disbandPartyButton').onclick = () => {
    showConfirmModal(localizedMessages.parties.confirmDisband, () => {
      apiFetch(`party?command=disband`)
        .then(response => {
          if (!response.ok)
            throw new Error(response.statusText);
          showPartyToastMessage('disband', 'partyDisband', joinedPartyCache?.name);
          setJoinedPartyId(null);
          updatePartyList();
        }).catch(err => console.error(err));
    });
  };

  document.getElementById('showHidePrivatePartyPasswordLink').onclick = function () {
    this.classList.toggle('showPassword');
    document.getElementById('privatePartyPassword').type = this.classList.contains('showPassword') ? 'text' : 'password';
  };

  document.getElementById('joinPrivatePartyForm').onsubmit = function () {
    const form = this;
    const partyId = document.getElementById('joinPrivatePartyModal').dataset.partyId;
    closeModal();
    apiFetch(`party?command=join&partyId=${partyId}&${new URLSearchParams(new FormData(form)).toString()}`)
      .then(response => {
        if (!response.ok) {
          if (response.status === 401) {
            document.getElementById('joinPrivatePartyFailed').classList.remove('hidden');
            openModal('joinPrivatePartyModal', partyCache[partyId].systemName);
            return;
          } else
            throw new Error(response.statusText);
        }
        showPartyToastMessage('join', 'party', partyCache[partyId]?.name);
        setJoinedPartyId(partyId, true);
        document.getElementById('content').classList.add('inParty');
        updatePartyList();
      }).catch(err => console.error(err));
    return false;
  };
}

function getPartyName(party, includeLock, asHtml) {
  if (!party)
    return null;

  const isPartyObj = typeof party === 'object';
  const ownerName = isPartyObj ? getPartyMemberName(party, party.ownerUuid) : null;
  let partyName = ((isPartyObj ? party.name : party) || localizedMessages.parties.defaultPartyName.replace('{OWNER}', ownerName));

  if (asHtml) {
    const html = document.createElement('div');
    html.innerHTML = `<bdi>${partyName}</bdi>`;

    if (includeLock && !party.public) {
      const partyLockIcon = getSvgIcon('locked', true);

      if (party.systemName) {
        let partySystemName = party.systemName;
        if (gameUiThemes.indexOf(partySystemName) === -1)
          partySystemName = getDefaultUiTheme();
        const parsedPartySystemName = partySystemName.replace(/ /g, '_');
        partyLockIcon.querySelector('path').setAttribute('style', `fill: var(--svg-base-gradient-${parsedPartySystemName});`);
      }

      html.prepend(partyLockIcon);
    }

    return html.innerHTML;
  } else if (includeLock && !party.public)
    partyName = `🔒 ${partyName}`;

  return partyName;
}

function getPartyMemberName(party, partyMember, includeRoles, asHtml) {
  if (typeof partyMember === 'string')
    partyMember = party ? party.members.find(m => m.uuid === partyMember) : null;

  let partyMemberName = getPlayerName(partyMember, includeRoles, false, asHtml);

  if (asHtml) {
    if (partyMember.uuid === party.ownerUuid) {
      const html = document.createElement('div');
      html.innerHTML = partyMemberName;

      const partyOwnerIcon = getSvgIcon('partyOwner', true);
      addTooltip(partyOwnerIcon, getMassagedLabel(localizedMessages.parties.partyOwner, true), true, true);

      if (party.systemName) {
        let partySystemName = party.systemName;
        if (gameUiThemes.indexOf(partySystemName) === -1)
          partySystemName = getDefaultUiTheme();
        const parsedPartySystemName = partySystemName.replace(/ /g, '_');
        partyOwnerIcon.querySelector('path').setAttribute('style', `fill: var(--svg-base-gradient-${parsedPartySystemName}); filter: var(--svg-shadow-${parsedPartySystemName});`);
      }

      html.children[0].appendChild(partyOwnerIcon);
      return html.innerHTML;
    }

    return partyMemberName;
  }

  if (includeRoles && party && party.ownerUuid === partyMember?.uuid)
    partyMemberName += roleEmojis.partyOwner;
  return partyMemberName;
}

function setJoinedPartyId(partyId) {
  const content = document.getElementById('content');
  content.classList.toggle('inParty', !!partyId);
  if (config.chatTabIndex === 3)
    setChatTab(partyId ? document.getElementById('chatTabParty') : document.getElementById('chatTabAll'));
  if (config.playersTabIndex === 1)
    setPlayersTab(partyId ? document.getElementById('playersTabParty') : document.getElementById('playersTabMap'));
  if (!partyId)
    partyId = null;
  if (config.privateMode && partyId !== joinedPartyId) {
    sendSessionCommand('pr', [ 0 ]);
    sendSessionCommand('pr', [ config.singleplayerMode ? 2 : 1 ]);
  }
  joinedPartyId = partyId;
  if (partyId)
    updateJoinedParty(() => content.classList.toggle('partyOwner', playerData?.uuid === joinedPartyCache.ownerUuid));
  else {
    joinedPartyCache = null;
    joinedPartyPendingOfflineMemberUuids = [];
    content.classList.remove('partyOwner');
    setPartyUiTheme(null);
    if (gameChatModeIndex === 2)
      cycleGameChatMode();
  }
}

function kickPlayerFromJoinedParty(playerUuid) {
  if (joinedPartyCache && joinedPartyCache.ownerUuid === playerData?.uuid) {
    apiFetch(`party?command=kick&player=${playerUuid}`)
      .then(response => {
        if (!response.ok)
          throw new Error(response.statusText);
        showPartyToastMessage('kick', 'leave', joinedPartyCache, playerUuid);
        updateJoinedParty();
        updatePartyList();
      }).catch(err => console.error(err));
  }
}

function transferJoinedPartyOwner(playerUuid) {
  let targetPlayerName = getPartyMemberName(joinedPartyCache, playerUuid, true, true);
  if (joinedPartyCache && joinedPartyCache.ownerUuid === playerData?.uuid) {
    showConfirmModal(localizedMessages.parties.confirmTransferPartyOwner.replace('{PLAYER}', targetPlayerName), () => {
      apiFetch(`party?command=transfer&player=${playerUuid}`)
        .then(response => {
          if (!response.ok)
          throw new Error(response.statusText);
        showPartyToastMessage('transferPartyOwner', 'transferPartyOwner', joinedPartyCache, playerUuid);
        updateJoinedParty();
        updatePartyList();
      }).catch(err => console.error(err));
    });
  }
}

function fetchAndUpdateJoinedPartyId() {
  apiFetch(`party?command=id`)
    .then(response => {
      if (!response.ok)
        throw new Error(response.statusText);
      return response.text();
    })
    .then(partyId => setJoinedPartyId(parseInt(partyId)))
    .catch(err => console.error(err));
}

function updatePartyList() {
  apiFetch(`party?command=list`)
    .then(response => {
      if (!response.ok)
        throw new Error(response.statusText);
      return response.json();
    })
    .then(data => {
      if (!Array.isArray(data))
        return;

      const partyIds = data.map(p => p.id);
      const removedPartyIds = Object.keys(partyCache).map(p => parseInt(p)).filter(p => partyIds.indexOf(p) === -1);

      for (let rp of removedPartyIds) {
        removePartyListEntry(rp);
        delete partyCache[rp];
      }

      const partyList = document.getElementById('partyList');

      if (data.length) {
        setJoinedPartyId(data.find(p => p.members.map(m => m.uuid).indexOf(playerData?.uuid) > -1)?.id);

        for (let party of data) {
          const isInParty = joinedPartyId && party.id === joinedPartyId;
          if (isInParty) {
            if (partyCache[party.id]) {
              const memberUuids = party.members.map(m => m.uuid);
              const oldMemberUuids = partyCache[party.id].members.map(m => m.uuid);
              const newMemberUuids = memberUuids.filter(uuid => oldMemberUuids.indexOf(uuid) === -1 && uuid !== playerData.uuid);
              const removedMemberUuids = oldMemberUuids.filter(uuid => memberUuids.indexOf(uuid) === -1 && uuid !== playerData.uuid);
              for (let uuid of newMemberUuids)
                showPartyToastMessage('playerJoin', 'join', party, uuid);
              for (let uuid of removedMemberUuids)
                showPartyToastMessage('playerLeave', 'leave', partyCache[party.id], uuid);
            }
          } else {
            party.members.forEach(m => {
              m.mapId = '0000';
              m.prevMapId = '0000';
              m.prevLocations = '';
              m.lastActive = null;
            });
          }
          partyCache[party.id] = party
          addOrUpdatePartyListEntry(party);
        }

        const partyListEntries = document.getElementsByClassName('partyListEntry');

        const entries = [].slice.call(partyListEntries).sort(function (a, b) {
          const partyA = partyCache[a.dataset.id];
          const partyB = partyCache[b.dataset.id];
          if (partyA.id == joinedPartyId)
            return -1;
          if (partyB.id == joinedPartyId)
            return 1;
          if (partyA.public !== partyB.public)
            return partyA.public ? -1 : 1;
          const onlineMemberCountA = partyA.members.filter(m => m.online).length;
          const onlineMemberCountB = partyB.members.filter(m => m.online).length;
          if (onlineMemberCountA !== onlineMemberCountB)
            return onlineMemberCountA < onlineMemberCountB ? 1 : -1;
          if (partyA.members.length !== partyB.members.length)
            return partyA.members.length < partyB.members.length ? 1 : -1;
          return partyA.id >= partyB.id ? 1 : -1;
        });

        entries.forEach(ple => partyList.appendChild(ple));
      } else {
        setJoinedPartyId(null);

        partyList.innerHTML = '';

        const emptyMessage = document.createElement('div');
        emptyMessage.classList.add('infoMessage');

        const emptyMessageText = document.createElement('span');
        emptyMessageText.classList.add('infoLabel');
        emptyMessageText.innerText = localizedMessages.parties.emptyMessage;

        emptyMessage.appendChild(emptyMessageText);
        partyList.appendChild(emptyMessage);
      }

      let joinedPartyLabel = document.getElementById('joinedPartyLabel');
      let joinedPartyDivider = partyList.querySelector('.divider');

      if (joinedPartyId) {
        const joinedPartyLabelHtml = getMassagedLabel(localizedMessages.parties.yourParty, true);
        if (!joinedPartyLabel) {
          joinedPartyLabel = document.createElement('span');
          joinedPartyLabel.id = 'joinedPartyLabel';
          joinedPartyLabel.classList.add('infoText');
          joinedPartyLabel.innerHTML = joinedPartyLabelHtml;
          partyList.prepend(joinedPartyLabel);
        } else
          joinedPartyLabel.innerHTML = joinedPartyLabelHtml;
        if (!joinedPartyDivider) {
          joinedPartyDivider = document.createElement('div');
          joinedPartyDivider.classList.add('divider');
        }
        partyList.querySelector(`.listEntry[data-id="${joinedPartyId}"]`).after(joinedPartyDivider);
      } else {
        joinedPartyLabel?.remove();
        joinedPartyDivider?.remove();
      }

      const activePartyModal = document.querySelector('#partyModal:not(.hidden)');
      if (activePartyModal)
        initOrUpdatePartyModal(activePartyModal.dataset.partyId);
    }).catch(err => console.error(err));
}

function updateJoinedParty(callback) {
  if (!joinedPartyId)
    return;

  sendSessionCommand('pt', null, params => {
    const party = JSON.parse(params[0]);
    if (party) {
      if (callback)
        callback();
    } else {
      showPartyToastMessage('remove', 'leave', partyCache[joinedPartyId]);
      setJoinedPartyId(null);
    }
  });
}

function onUpdateJoinedParty(party) {
  if (!party)
    return;
  const oldMembers = joinedPartyCache ? joinedPartyCache.members : [];
  joinedPartyCache = party;

  if (party.systemName !== joinedPartyUiTheme)
    setPartyUiTheme(party.systemName);

  const partyPlayerList = document.getElementById('partyPlayerList');

  Array.from(partyPlayerList.querySelectorAll('.listEntryCategoryHeader')).map(h => h.remove());

  const oldPlayerUuids = Array.from(partyPlayerList.querySelectorAll('.listEntry')).map(e => e.dataset.uuid);
  const removedPlayerUuids = oldPlayerUuids.filter(uuid => !party.members.find(m => m.uuid === uuid));

  for (let playerUuid of removedPlayerUuids)
    removePlayerListEntry(partyPlayerList, playerUuid);

  for (let member of party.members) {
    const uuid = member.uuid;
    const oldMember = oldMembers.find(m => m.uuid === uuid);
    if (oldMember) {
      const isFriend = !!playerFriendsCache.find(pf => pf.uuid === uuid);
      const pendingOfflineMemberIndex = joinedPartyPendingOfflineMemberUuids.indexOf(uuid);
      if (member.online !== oldMember.online) {
        if (member.online) {
          if (pendingOfflineMemberIndex > -1)
            joinedPartyPendingOfflineMemberUuids.splice(pendingOfflineMemberIndex, 1);
          else if (!isFriend || !notificationConfig.friends.playerOnline)
            showPartyToastMessage('playerOnline', 'party', party, uuid);
        } else
          joinedPartyPendingOfflineMemberUuids.push(uuid);
      } else if (!member.online) {
        if (pendingOfflineMemberIndex > -1) {
          if (!isFriend || !notificationConfig.friends.playerOffline)
            showPartyToastMessage('playerOffline', 'party', party, uuid);
          joinedPartyPendingOfflineMemberUuids.splice(pendingOfflineMemberIndex, 1);
        }
      }
    }

    if (member.badge === 'null')
      member.badge = null;

    globalPlayerData[member.uuid] = {
      name: member.name,
      systemName: member.systemName,
      rank: member.rank,
      account: member.account,
      badge: member.badge || null,
      medals: member.medals
    };

    const entry = addOrUpdatePlayerListEntry(partyPlayerList, member, true);
    entry.classList.toggle('offline', !member.online);
    entry.dataset.categoryId = member.online ? 'online' : 'offline';
    addOrUpdatePlayerListEntryLocation(party.id == joinedPartyId && !!member.mapId, member, entry);
  }

  sortPlayerListEntries(partyPlayerList);

  [ 'online', 'offline' ].forEach(c => updatePlayerListEntryHeader(partyPlayerList, 'parties', c));
}

function addOrUpdatePartyListEntry(party) {
  const isInParty = party.id === joinedPartyId;
  const partyList = document.getElementById('partyList');

  let partyListEntry = partyList.querySelector(`.partyListEntry[data-id="${party.id}"]`);

  const partyListEntrySprite = partyListEntry ? partyListEntry.querySelector('.partyListEntrySprite') : document.createElement('img');
  const nameText = partyListEntry ? partyListEntry.querySelector('.nameText') : document.createElement('span');
  const memberCount = partyListEntry ? partyListEntry.querySelector('.partyListEntryMemberCount') : document.createElement('div');
  const memberCountText = partyListEntry ? memberCount.querySelector('.partyListEntryMemberCountText') : document.createElement('span');
  const partyMemberSpritesContainer = partyListEntry ? partyListEntry.querySelector('.partyMemberSpritesContainer') : document.createElement('div');
  const partyListEntryActionContainer = partyListEntry ? partyListEntry.querySelector('.partyListEntryActionContainer') : document.createElement('div');
  let joinLeaveAction = partyListEntryActionContainer.querySelector('.partyJoinLeaveAction');

  if (!partyListEntry) {
    partyListEntry = document.createElement('div');
    partyListEntry.classList.add('partyListEntry', 'listEntry');
    partyListEntry.dataset.id = party.id;

    partyListEntrySprite.classList.add('partyListEntrySprite', 'listEntrySprite');

    partyListEntry.appendChild(partyListEntrySprite);

    const detailsContainer = document.createElement('div');
    detailsContainer.classList.add('detailsContainer');

    const partyNameContainer = document.createElement('div');
    partyNameContainer.classList.add('partyNameContainer');

    nameText.classList.add('nameText');

    memberCount.classList.add('partyListEntryMemberCount');

    memberCountText.classList.add('partyListEntryMemberCountText');

    memberCount.appendChild(getSvgIcon('partyMember', true));
    memberCount.appendChild(memberCountText);

    partyMemberSpritesContainer.classList.add('partyMemberSpritesContainer');

    partyNameContainer.appendChild(nameText);
    partyNameContainer.appendChild(memberCount);
    detailsContainer.appendChild(partyNameContainer);
    detailsContainer.appendChild(partyMemberSpritesContainer);
    partyListEntry.appendChild(detailsContainer);

    partyListEntryActionContainer.classList.add('partyListEntryActionContainer', 'listEntryActionContainer');

    const viewDetailsAction = document.createElement('a');
    viewDetailsAction.classList.add('listEntryAction');
    viewDetailsAction.href = 'javascript:void(0);';
    viewDetailsAction.onclick = function () {
      initOrUpdatePartyModal(party.id);
      openModal('partyModal', partyCache[party.id].systemName);
    };
    viewDetailsAction.appendChild(getSvgIcon('party', true));
    addTooltip(viewDetailsAction, getMassagedLabel(localizedMessages.parties.actions.viewPartyDetails, true), true, true);
    partyListEntryActionContainer.appendChild(viewDetailsAction);

    partyListEntry.appendChild(partyListEntryActionContainer);

    partyList.appendChild(partyListEntry);
  } else
    partyMemberSpritesContainer.innerHTML = '';

  if (!joinedPartyId || isInParty) {
    const actionClass = `party${isInParty ? 'Leave' : party.public || playerData?.rank ? 'Join' : 'PrivateJoin'}Action`;
    if (!joinLeaveAction || !joinLeaveAction.classList.contains(actionClass)) {
      if (joinLeaveAction)
        joinLeaveAction.remove();
      joinLeaveAction = document.createElement('a');
      joinLeaveAction.classList.add('listEntryAction', 'partyJoinLeaveAction', actionClass);
      joinLeaveAction.href = 'javascript:void(0);';
      joinLeaveAction.onclick = isInParty
        ? function () {
          apiFetch(`party?command=leave`)
            .then(response => {
              if (!response.ok)
                throw new Error(response.statusText);
              showPartyToastMessage('leave', 'leave', party);
              setJoinedPartyId(null);
              document.getElementById('content').classList.remove('inParty');
              updatePartyList();
            }).catch(err => console.error(err));
        }
      : party.public || playerData?.rank
        ? function () {
          apiFetch(`party?command=join&partyId=${party.id}`)
            .then(response => {
              if (!response.ok)
                throw new Error(response.statusText);
              showPartyToastMessage('join', 'join', party);
              setJoinedPartyId(party.id);
              document.getElementById('content').classList.add('inParty');
              updatePartyList();
            }).catch(err => console.error(err));
          }
        : function () {
          const showHidePrivatePartyPasswordLink = document.getElementById('showHidePrivatePartyPasswordLink');
          if (showHidePrivatePartyPasswordLink.classList.contains('showPassword'))
            showHidePrivatePartyPasswordLink.click();
          document.getElementById('joinPrivatePartyFailed').classList.add('hidden');
          openModal('joinPrivatePartyModal', party.systemName, null, { partyId: party.id });
        };
      addTooltip(joinLeaveAction, getMassagedLabel(localizedMessages.parties.actions[`${isInParty ? 'leave' : party.public || playerData?.rank ? 'join' : 'joinPrivate'}Party`], true), true, true);
      joinLeaveAction.appendChild(getSvgIcon(isInParty ? 'leave' : 'join', true));
      partyListEntryActionContainer.prepend(joinLeaveAction);
    }
  } else if (joinLeaveAction)
    joinLeaveAction.remove();

  partyListEntry.classList.toggle('joinedParty', joinedPartyId);

  if (party.systemName) {
    let systemName = party.systemName.replace(/'/g, '');
    if (gameUiThemes.indexOf(systemName) === -1)
      systemName = getDefaultUiTheme();
    const parsedSystemName = systemName.replace(/ /g, '_');
    initUiThemeContainerStyles(systemName, null, false, () => {
      initUiThemeFontStyles(systemName, null, 0, false);
    });
    applyThemeStyles(partyListEntry, parsedSystemName)
  }

  updateThemedContainer(partyListEntry);

  const ownerMemberIndex = party.members.map(m => m.uuid).indexOf(party.ownerUuid);
  const ownerMember = party.members[ownerMemberIndex];

  let partyMemberName = getPartyMemberName(party, ownerMember, true, true);

  if (!ownerMember.online) {
    partyListEntrySprite.classList.add('offline');
    partyMemberName += getMassagedLabel(localizedMessages.parties.offlineMemberSuffix, true);
  }

  addTooltip(partyListEntrySprite, partyMemberName, true, true);

  const partyPlayerList = document.getElementById('partyPlayerList');

  if (isInParty) {
    const oldMemberUuids = Array.from(partyPlayerList.querySelectorAll('.listEntry')).map(e => e.dataset.uuid);
    const removedMemberUuids = oldMemberUuids.filter(uuid => !party.members.find(m => m.uuid === uuid));

    for (let uuid of removedMemberUuids)
      removePartyListEntry(uuid);
  }

  for (let m = 0; m < party.members.length; m++) {
    const memberIndex = m;

    const member = party.members[memberIndex];

    if (member.badge === 'null')
      member.badge = null;

    globalPlayerData[member.uuid] = {
      name: member.name,
      systemName: member.systemName,
      rank: member.rank,
      account: member.account,
      badge: member.badge || null,
      medals: member.medals
    };

    const playerSpriteCacheEntry = (playerSpriteCache[member.uuid] = { sprite: member.spriteName, idx: member.spriteIndex });

    getSpriteProfileImg(playerSpriteCacheEntry.sprite, playerSpriteCacheEntry.idx).then(spriteImg => {
      if (!spriteImg)
        return;
      if (memberIndex === ownerMemberIndex) {
        partyListEntrySprite.src = spriteImg;
      } else {
        const spriteImgIcon = document.createElement('img');
        spriteImgIcon.classList.add('partyListEntrySprite', 'listEntrySprite');
        let partyMemberName = getPartyMemberName(party, member, true, true);
        if (!member.online) {
          spriteImgIcon.classList.add('offline');
          partyMemberName += localizedMessages.parties.offlineMemberSuffix;
        }
        addTooltip(spriteImgIcon, partyMemberName, true, true);
        spriteImgIcon.src = spriteImg;
        partyMemberSpritesContainer.appendChild(spriteImgIcon);
      }
    });
  }

  nameText.innerHTML = getPartyName(party, true, true);
  addTooltip(nameText, getPartyName(party, false, true), true, true);

  memberCountText.innerText = party.members.length;
}

function removePartyListEntry(id) {
  document.getElementById('partyList').querySelector(`.partyListEntry[data-id="${id}"]`)?.remove();
}

function clearPartyList() {
  const partyList = document.getElementById('partyList');
  partyList.innerHTML = '';
  updateMapPlayerCount(0);
}

function initOrUpdatePartyModal(partyId) {
  const isInParty = partyId == joinedPartyId;
  const party = isInParty ? joinedPartyCache : partyCache[partyId];

  if (!party)
    return;

  const isOwnParty = isInParty && party.ownerUuid === playerData?.uuid;
  const partyModal = document.getElementById('partyModal');
  const partyModalOnlinePlayerList = document.getElementById('partyModalOnlinePlayerList');
  const partyModalOfflinePlayerList = document.getElementById('partyModalOfflinePlayerList');

  const lastPartyId = partyModal.dataset.partyId;
  const modalTitle = partyModal.querySelector('.modalTitle');

  modalTitle.innerText = getPartyName(party);

  if (!party.public)
    modalTitle.prepend(getSvgIcon('locked', true));

  if (isOwnParty) {
    const editButton = getSvgIcon('edit', true);
    editButton.classList.add('iconButton', 'altIcon');
    editButton.onclick = function () {
      if (party) {
        const partyName = document.getElementById('partyName');
        const partyDescription = document.getElementById('partyDescription');
        const publicPartyButton = document.getElementById('publicPartyButton');
        const partyPassword = document.getElementById('partyPassword');

        partyName.value = party.name;

        partyDescription.value = party.description;

        if (publicPartyButton.classList.contains('toggled') === party.public)
          publicPartyButton.click();

        partyPassword.value = party.pass;

        setPartyTheme(party.systemName);

        const showHidePartyPasswordLink = document.getElementById('showHidePartyPasswordLink');
        if (showHidePartyPasswordLink.classList.contains('showPassword'))
          showHidePartyPasswordLink.click();

        openModal('createPartyModal', party.systemName, 'partyModal', { update: true });
      }
    };
    modalTitle.append(editButton);
  }

  let onlineCount = 0;
  let offlineCount = 0;

  if (lastPartyId) {
    if (partyId == lastPartyId) {
      const oldOnlinePlayerUuids = Array.from(partyModalOnlinePlayerList.querySelectorAll('.listEntry')).map(e => e.dataset.uuid);
      const oldOfflinePlayerUuids = Array.from(partyModalOfflinePlayerList.querySelectorAll('.listEntry')).map(e => e.dataset.uuid);

      const removedOnlinePlayerUuids = oldOnlinePlayerUuids.filter(uuid => !party.members.find(m => m.uuid === uuid && m.online));
      const removedOfflinePlayerUuids = oldOfflinePlayerUuids.filter(uuid => !party.members.find(m => m.uuid === uuid && !m.online));

      for (let onlinePlayerUuid of removedOnlinePlayerUuids)
        removePlayerListEntry(partyModalOnlinePlayerList, onlinePlayerUuid);
      for (let offlinePlayerUuid of removedOfflinePlayerUuids)
        removePlayerListEntry(partyModalOfflinePlayerList, offlinePlayerUuid);
    } else {
      clearPlayerList(partyModalOnlinePlayerList);
      clearPlayerList(partyModalOfflinePlayerList);
    }
  }

  partyModal.dataset.partyId = partyId;

  for (let member of party.members) {
    const playerList = member.online ? partyModalOnlinePlayerList : partyModalOfflinePlayerList;
    if (member.online)
      onlineCount++;
    else
      offlineCount++;

    const entry = addOrUpdatePlayerListEntry(playerList, member, true);
    entry.classList.toggle('offline', !member.online);
    addOrUpdatePlayerListEntryLocation(party.id == joinedPartyId && !!member.mapId, member, entry);
  }

  sortPlayerListEntries(partyModalOnlinePlayerList);
  sortPlayerListEntries(partyModalOfflinePlayerList);

  const onlineCountLabel = document.getElementById('partyModalOnlineCount');
  const offlineCountLabel = document.getElementById('partyModalOfflineCount');

  onlineCountLabel.innerText = localizedMessages.parties.categories.online.replace('{COUNT}', onlineCount);
  offlineCountLabel.innerText = localizedMessages.parties.categories.offline.replace('{COUNT}', offlineCount);

  onlineCountLabel.classList.toggle('hidden', !onlineCount);
  offlineCountLabel.classList.toggle('hidden', !offlineCount);

  const partyDescriptionContainer = document.getElementById('partyModalDescriptionContainer');
  const partyDescriptionText = document.getElementById('partyModalDescription');

  if (!partyDescriptionCache.hasOwnProperty(partyId)) {
    partyDescriptionContainer.classList.add('hidden');
    apiFetch(`party?command=description&partyId=${partyId}`)
      .then(response => {
        if (!response.ok) {
          partyDescriptionCache[partyId] = null;
          throw new Error(response.statusText);
        }
        return response.text();
      })
      .then(description => {
        partyDescriptionCache[partyId] = description;
        if (partyModal.dataset.partyId == partyId) {
          partyDescriptionText.innerText = description;
          if (description)
            partyDescriptionContainer.classList.remove('hidden');
        }
        setTimeout(() => delete partyDescriptionCache[partyId], 300000);
      }).catch(err => console.error(err));
  } else {
    const description = partyDescriptionCache[partyId];
    partyDescriptionText.innerText = description;
    partyDescriptionContainer.classList.toggle('hidden', !description);
  }
}

function showPartyToastMessage(key, icon, party, playerUuid) {
  if (!notificationConfig.parties.all || !notificationConfig.parties[key])
    return;
  let message = getMassagedLabel(localizedMessages.toast.parties[key], true).replace('{PARTY}', getPartyName(party));
  if (playerUuid)
    message = message.replace('{PLAYER}', getPartyMemberName(party, playerUuid, true, true));
  showToastMessage(message, icon, true, party?.systemName);
}

(function () {
  addSessionCommandHandler('pt', args => onUpdateJoinedParty(JSON.parse(args[0])));
})();
