let updatePlayerFriendsTimer = null;
let skipPlayerFriendsUpdate = false;
let playerFriendsCache = [];
let pendingOfflineFriendUuids = [];

function updatePlayerFriends(skipNextUpdate) {
  if (loginToken)
    sendSessionCommand('pf');
  else
    onUpdatePlayerFriends([]);

  if (skipNextUpdate)
    skipPlayerFriendsUpdate = true;
}

function onUpdatePlayerFriends(playerFriends) {
  const friendsPlayerList = document.getElementById('friendsPlayerList');

  const oldPlayerUuids = Array.from(friendsPlayerList.querySelectorAll('.listEntry')).map(e => e.dataset.uuid);
  const removedPlayerUuids = oldPlayerUuids.filter(uuid => !playerFriends.find(m => m.uuid === uuid));

  let newIncomingCount = 0;

  for (let playerUuid of removedPlayerUuids)
    removePlayerListEntry(friendsPlayerList, playerUuid);

  Array.from(friendsPlayerList.querySelectorAll('.listEntryCategoryHeader')).map(h => h.remove());

  for (let playerFriend of playerFriends) {
    const uuid = playerFriend.uuid;
    const oldFriendData = playerFriendsCache.find(m => m.uuid === uuid);
    if (oldFriendData) {
      const pendingOfflineFriendIndex = pendingOfflineFriendUuids.indexOf(uuid);
      if (playerFriend.online !== oldFriendData.online) {
        if (playerFriend.online) {
          if (pendingOfflineFriendIndex > -1)
            pendingOfflineFriendUuids.splice(pendingOfflineFriendIndex, 1);
          else
            showFriendsToastMessage('playerOnline', 'friend', playerFriend);
        } else
          pendingOfflineFriendUuids.push(uuid);
      } else if (!playerFriend.online) {
        if (pendingOfflineFriendIndex > -1) {
          showFriendsToastMessage('playerOffline', 'friend', playerFriend);
          pendingOfflineFriendUuids.splice(pendingOfflineFriendIndex, 1);
        }
      }
    } else if (!playerFriend.accepted && playerFriend.incoming) {
      showFriendsToastMessage('incoming', 'friend', playerFriend, true);
      newIncomingCount++;
    }

    if (playerFriend.badge === 'null')
      playerFriend.badge = null;

    globalPlayerData[playerFriend.uuid] = {
      name: playerFriend.name,
      systemName: playerFriend.systemName,
      rank: playerFriend.rank,
      account: playerFriend.account,
      badge: playerFriend.badge || null,
      medals: playerFriend.medals
    };

    const entry = addOrUpdatePlayerListEntry(friendsPlayerList, playerFriend.systemName, playerFriend.name, playerFriend.uuid, true);
    entry.classList.toggle('offline', playerFriend.accepted && !playerFriend.online);
    entry.dataset.categoryId = playerFriend.accepted ? playerFriend.online ? 'online' : 'offline' : playerFriend.incoming ? 'incoming' : 'outgoing';
    addOrUpdatePlayerListEntryLocation(true, playerFriend, entry);
  }

  playerFriendsCache = playerFriends || [];

  sortPlayerListEntries(friendsPlayerList);

  [ 'incoming', 'outgoing', 'online', 'offline' ].forEach(c => updatePlayerListEntryHeader(friendsPlayerList, 'friends', c));

  if (!playerFriendsCache.length)
    document.getElementById('incomingFriendRequestCountContainer').classList.add('hidden');

  const playersTabFriends = document.getElementById('playersTabFriends');
  const incomingFriendRequestCountContainer = document.getElementById('incomingFriendRequestCountContainer');
  const incomingFriendRequestCountLabel = incomingFriendRequestCountContainer.querySelector('.notificationCountLabel');
  if (incomingFriendRequestCountContainer.classList.contains('hidden'))
    incomingFriendRequestCountLabel.textContent = '0';
  let incomingCount = parseInt(incomingFriendRequestCountLabel.textContent) + newIncomingCount;
  if (incomingCount) {
    incomingFriendRequestCountContainer.classList.toggle('hidden', !incomingCount);
    if (newIncomingCount)
      playersTabFriends.classList.toggle('unread', !!incomingCount);
    incomingFriendRequestCountLabel.textContent = incomingCount < 9 ? incomingCount : `${incomingCount}+`;
  }
}

function showFriendsToastMessage(key, icon, player, persist) {
  if (!notificationConfig.friends.all || !notificationConfig.friends[key])
    return;
  let message = getMassagedLabel(localizedMessages.toast.friends[key], true);
  if (player)
    message = message.replace('{PLAYER}', getPlayerName(player, true, false, true));
  showToastMessage(message, icon, true, null, persist);
}

(function () {
  addSessionCommandHandler('pf', args => onUpdatePlayerFriends(JSON.parse(args[0]) || []));

  updatePlayerFriendsTimer = setInterval(() => {
    if (loginToken) {
      if (!skipPlayerFriendsUpdate)
        updatePlayerFriends();
      else
        skipPlayerFriendsUpdate = false;
    } else
      updatePlayerFriends();
  }, 10000);
})();