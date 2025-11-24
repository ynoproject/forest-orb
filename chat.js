easyrpgPlayer["onRuntimeInitialized"] = initChat;
if (typeof ENV === "undefined")
  initChat();

const MESSAGE_TYPE = {
  SYSTEM: 0,
  MAP: 1,
  GLOBAL: 2,
  PARTY: 3
};

const SCREENSHOT_FLAGS = {
  SPOILER: 1 << 0,
};

const mentionSe = new Audio('./audio/mention.wav');

function chatboxAddMessage(msg, type, player, ignoreNotify, mapId, prevMapId, prevLocationsStr, x, y, msgId, timestamp, shouldScroll = true) {
  const messages = document.getElementById("messages");

  if (msgId && messages.querySelector(`.messageContainer[data-msg-id="${msgId}"]`))
    return null;

  const msgContainer = document.createElement("div");
  msgContainer.classList.add("messageContainer");
  
  const message = document.createElement("div");
  message.classList.add("message");

  const messageSender = document.createElement("div");
  messageSender.classList.add("messageSender");

  const messageContents = document.createElement("span");
  messageContents.classList.add("messageContents");

  let uuid = player?.uuid;

  if (player && typeof player === 'string') {
    uuid = player;
    player = globalPlayerData[uuid];
  }

  const system = !type;
  const map = type === MESSAGE_TYPE.MAP;
  const global = type === MESSAGE_TYPE.GLOBAL;
  const party = type === MESSAGE_TYPE.PARTY;

  let systemThemeProm = Promise.resolve();

  if (!system) {
    let rankIcon;
    let friendIcon;
    let chatTypeIcon;

    const msgHeader = document.createElement("div");
    msgHeader.classList.add("messageHeader");

    if (global || party) {
      const showLocation = (mapId || "0000") !== "0000" && (localizedMapLocations || gameId === "2kki");

      msgContainer.classList.add(global ? "global" : "party");
      msgContainer.dataset.msgId = msgId;
      msgContainer.dataset.senderUuid = uuid;

      if (showLocation) {
        const playerLocation = document.createElement("bdi");

        // Store location data for langs change updates
        msgContainer.dataset.mapId = mapId || "0000";
        msgContainer.dataset.prevMapId = prevMapId || "0000";
        if (x !== undefined) msgContainer.dataset.x = x;
        if (y !== undefined) msgContainer.dataset.y = y;
        if (prevLocationsStr) msgContainer.dataset.prevLocationsStr = prevLocationsStr;

        if (gameId === "2kki" && (!localizedMapLocations.hasOwnProperty(mapId))) {
          const prevLocations = prevLocationsStr && prevMapId !== "0000" ? decodeURIComponent(window.atob(prevLocationsStr)).split("|").map(l => { return { title: l }; }) : null;
          set2kkiGlobalChatMessageLocation(playerLocation, mapId, prevMapId, prevLocations);
        } else {
          const locationsHtml = getLocalizedMapLocationsHtml(gameId, mapId, prevMapId, x, y, getInfoLabel("&nbsp;|&nbsp;"));
          fastdom.mutate(() => playerLocation.innerHTML = locationsHtml);
        }

        playerLocation.classList.add("playerLocation");

        msgHeader.appendChild(playerLocation);
      } else
        msgHeader.appendChild(document.createElement('span'));

      if (global) {
        chatTypeIcon = getSvgIcon("global", true);
        addTooltip(chatTypeIcon, document.createTextNode(getMassagedLabel(localizedMessages.chat.globalMessage)), true, true);
      } else {
        chatTypeIcon = getSvgIcon("party", true);
        if (joinedPartyCache)
          addTooltip(chatTypeIcon, getPartyName(joinedPartyCache, false, true), true, true);
      }
      messageSender.appendChild(chatTypeIcon);
    } else
      msgHeader.appendChild(document.createElement('span'));

    if (blockedPlayerUuids.indexOf(uuid) > -1)
      msgContainer.classList.add('blockedHidden');

    const defaultDate = !timestamp;
    if (defaultDate)
      timestamp = new Date();

    const msgTimestamp = document.createElement("bdi");

    msgTimestamp.classList.add('messageTimestamp', 'infoLabel');
    msgTimestamp.dataset.time = timestamp.getTime();

    const timestampLabel = getChatMessageTimestampLabel(timestamp, defaultDate);
    fastdom.mutate(() => {
      msgTimestamp.innerHTML = timestampLabel;
    });
    // msgTimestamp.innerHTML = getChatMessageTimestampLabel(timestamp, defaultDate);

    msgHeader.appendChild(msgTimestamp);
    msgContainer.appendChild(msgHeader);

    const name = document.createElement("bdi");
    name.classList.add("nameText");

    name.innerText = getPlayerName(player);
    const nameBeginMarker = document.createElement("span");
    nameBeginMarker.classList.add("nameMarker", "punct");
    nameBeginMarker.textContent = player?.account ? "[" : "<";
    const nameEndMarker = document.createElement("span");
    nameEndMarker.classList.add("nameMarker", "punct");
    nameEndMarker.textContent = player?.account ? "]" : ">";
    messageSender.appendChild(nameBeginMarker);
    messageSender.appendChild(name);

    addPlayerContextMenu(name, player, uuid, global ? MESSAGE_TYPE.GLOBAL : party ? MESSAGE_TYPE.PARTY : MESSAGE_TYPE.MAP, {msg, msgId});

    if (player?.rank) {
      const rank = Math.min(player.rank, 2);
      rankIcon = getSvgIcon(rank === 1 ? "mod" : "dev", true);
      rankIcon.classList.add("rankIcon");
      addTooltip(rankIcon, getMassagedLabel(localizedMessages.roles[Object.keys(localizedMessages.roles)[rank - 1]], true), true, true);
      messageSender.appendChild(rankIcon);
    }

    if (playerFriendsCache.find(pf => pf.accepted && pf.uuid === uuid)) {
      friendIcon = getSvgIcon('friend', true);
      friendIcon.classList.add('friendIcon');
      addTooltip(friendIcon, getMassagedLabel(localizedMessages.friends.friend, true), true, true);
      messageSender.appendChild(friendIcon);
    }

    if (party) {
      let partyOwnerIcon;
      if (joinedPartyCache && player?.uuid === joinedPartyCache.ownerUuid) {
        partyOwnerIcon = getSvgIcon("partyOwner", true);
        addTooltip(partyOwnerIcon, getMassagedLabel(localizedMessages.parties.partyOwner, true), true, true);
        messageSender.appendChild(partyOwnerIcon);
      }
      if (joinedPartyCache?.systemName) {
        const parsedPartySystemName = joinedPartyCache.systemName.replace(" ", "_");
        const iconStyle = `fill: var(--svg-base-gradient-${parsedPartySystemName}); filter: var(--svg-shadow-${parsedPartySystemName});`;
        chatTypeIcon.querySelector("path").setAttribute("style", iconStyle);
        if (partyOwnerIcon)
          partyOwnerIcon.querySelector("path").setAttribute("style", iconStyle);
      }
    }

    let systemName = player?.systemName;
    
    const badge = player?.badge ? badgeCache?.find(b => b.badgeId === player.badge) : null;

    const badgeEl = badge ? document.createElement('div') : null;
    const badgeOverlayEl = badge?.overlayType ? document.createElement('div') : null;
    const badgeOverlay2El = badge?.overlayType & BadgeOverlayType.DUAL ? document.createElement('div') : null;

    if (badge) {
      badgeEl.classList.add('badge', 'nameBadge');

      if (localizedBadges) {
        const badgeGame = localizedBadges[badge?.game]?.[player.badge] && badge.game;
        if (badgeGame) {
          const badgeTippy = addTooltip(badgeEl, document.createTextNode(getMassagedLabel(localizedBadges[badgeGame][player.badge].name)), true, true);
          if (!badge || badge.hidden)
            badgeTippy.popper.querySelector('.tooltipContent').classList.add('altText');
        }
      }
      if (player.name) {
        addOrUpdatePlayerBadgeGalleryTooltip(badgeEl, player.name, (systemName || getDefaultUiTheme()).replace(/'/g, ''), mapId, prevMapId, prevLocationsStr, x, y);
        badgeEl.classList.toggle('badgeButton', player.name);
      }

      const badgeUrl = getBadgeUrl(player.badge, true);
      badgeEl.style.backgroundImage = `url('${badgeUrl}')`;

      if (badgeOverlayEl) {
        badgeEl.classList.add('overlayBadge');

        badgeOverlayEl.classList.add('badgeOverlay');
        if (badge.overlayType & BadgeOverlayType.MULTIPLY)
          badgeOverlayEl.classList.add('badgeOverlayMultiply');

        badgeEl.appendChild(badgeOverlayEl);

        const badgeMaskUrl = badge.overlayType & BadgeOverlayType.MASK
          ? badgeUrl.replace('.', badge.overlayType & BadgeOverlayType.DUAL ? '_mask_fg.' : '_mask.')
          : badgeUrl;

        badgeOverlayEl.setAttribute('style', `-webkit-mask-image: url('${badgeMaskUrl}'); mask-image: url('${badgeMaskUrl}');`);

        if (badgeOverlay2El) {
          const badgeMask2Url = badge.overlayType & BadgeOverlayType.MASK
            ? badgeUrl.replace('.', '_mask_bg.')
            : badgeUrl;

          badgeOverlay2El.classList.add('badgeOverlay', 'badgeOverlay2');
          if (badge.overlayType & BadgeOverlayType.MULTIPLY)
            badgeOverlay2El.classList.add('badgeOverlayMultiply');

          badgeEl.appendChild(badgeOverlay2El);

          badgeOverlay2El.setAttribute('style', `-webkit-mask-image: url('${badgeMask2Url}'); mask-image: url('${badgeMask2Url}');`);
        }
      }
    }

    if (systemName) {
      let completeSystemThemeProm;
      systemThemeProm = new Promise(res => completeSystemThemeProm = res);
      systemName = systemName.replace(/'|\s$/g, "");
      const parsedSystemName = systemName.replace(/ /g, "_");
      initUiThemeContainerStyles(systemName, null, false, () => {
        initUiThemeFontStyles(systemName, null, 0, false, () => {
          applyThemeStyles(name, parsedSystemName).finally(completeSystemThemeProm);
          if (rankIcon)
            applyThemeStyles(rankIcon, parsedSystemName);
          if (badgeOverlayEl) {
            badgeOverlayEl.style.background = badge.overlayType & BadgeOverlayType.GRADIENT
              ? `var(--base-gradient-${parsedSystemName})`
              : `rgb(var(--base-color-${parsedSystemName}))`;
            if (badgeOverlay2El) {
              if (getStylePropertyValue(`--base-color-${parsedSystemName}`) !== getStylePropertyValue(`--alt-color-${parsedSystemName}`)) {
                badgeOverlay2El.style.background = badge.overlayType & BadgeOverlayType.GRADIENT
                  ? `var(--alt-gradient-${parsedSystemName})`
                  : `rgb(var(--alt-color-${parsedSystemName}))`;
              } else
                badgeOverlay2El.style.background = `var(--base-bg-color-${parsedSystemName})`;
            }
            if (badge.overlayType & BadgeOverlayType.LOCATION)
              handleBadgeOverlayLocationColorOverride(badgeOverlayEl, badgeOverlay2El, null, player?.name, mapId, prevMapId, prevLocationsStr, x, y);
          }
        });
      });
    }

    if (badgeEl)
      messageSender.appendChild(badgeEl);
    
    messageSender.appendChild(nameEndMarker);
    message.appendChild(messageSender);
    message.appendChild(document.createTextNode(" "));
  }

  if (playerName && new RegExp(`(^|[^a-z\d])@${playerName}($|[^a-z\d])`, 'i').test(msg)) {
    msgContainer.classList.add("highlight");
    if (globalConfig.playMentionSound && blockedPlayerUuids.indexOf(uuid) === -1)
      mentionSe.play();
  }
  
  populateMessageNodes(parseMessageTextForMarkdown(msg), messageContents, system);
  wrapMessageEmojis(messageContents);
  tryEmbedScreenshot(messageContents, uuid);

  if (!messageContents.innerText.trim())
    messageContents.classList.add("notext");

  if (localizedMapLocations && !global) {
    const mapMessages = messages.querySelectorAll(".messageContainer:not(.global):not(.party)");
    if (mapMessages.length) {
      const lastMapMessage = mapMessages[mapMessages.length - 1];
      if (lastMapMessage.classList.contains("locMessage"))
          lastMapMessage.classList.remove("hidden");
    }
  }

  const messageContentsWrapper = document.createElement('div');
  messageContentsWrapper.classList.add('messageContentsWrapper');
  messageContentsWrapper.appendChild(messageContents);
  messageContentsWrapper.dir = "auto";
  message.appendChild(messageContentsWrapper);
  msgContainer.appendChild(message);

  let task = Promise.resolve(shouldScroll);
  if (shouldScroll)
    task = fastdom.measure(() => Math.abs((messages.scrollHeight - messages.scrollTop) - messages.clientHeight) <= 60);

  const didPopulateMessage = task.then(() => fastdom.mutate(() => {
    messages.appendChild(msgContainer);
  }));
  Promise.allSettled([didPopulateMessage, systemThemeProm]).then(() => {
    if (player)
      addGameChatMessage(message.innerHTML, type, uuid);
  });

  const chatbox = document.getElementById("chatbox");

  const mapChat = chatbox.classList.contains("mapChat");
  const globalChat = chatbox.classList.contains("globalChat");
  const partyChat = chatbox.classList.contains("partyChat");

  if (!ignoreNotify) {
    if ((globalChat || partyChat) && (system || map))
      document.getElementById("chatTabMap").classList.add("unread");
    else if ((mapChat || partyChat) && global)
      document.getElementById("chatTabGlobal").classList.add("unread");
    else if ((mapChat || globalChat) && party)
      document.getElementById("chatTabParty").classList.add("unread");
    else if (!system && !document.querySelector(".chatboxTab.active[data-tab-section='chat']")) {
      const unreadMessageCountContainer = document.getElementById("unreadMessageCountContainer");
      const unreadMessageCountLabel = unreadMessageCountContainer.querySelector(".notificationCountLabel");
      if (unreadMessageCountContainer.classList.contains("hidden")) {
        unreadMessageCountLabel.textContent = "0";
        unreadMessageCountContainer.classList.remove("hidden");
      }
      let unreadMessageCount = parseInt(unreadMessageCountLabel.textContent);
      if (!unreadMessageCount || unreadMessageCount < 9)
        unreadMessageCountLabel.textContent = ++unreadMessageCount < 9 ? unreadMessageCount : `${unreadMessageCount}+`;
    }
  }

  let tabMessagesLimit;

  if (global)
    tabMessagesLimit = parseInt(globalConfig.globalChatHistoryLimit);
  else if (party)
    tabMessagesLimit = parseInt(globalConfig.partyChatHistoryLimit);
  else
    tabMessagesLimit = parseInt(globalConfig.mapChatHistoryLimit);

  if (tabMessagesLimit) {
    let tabMessages;
    if (global)
      tabMessages = [...messages.querySelectorAll('.messageContainer.global')];
    else if (party)
      tabMessages = [...messages.querySelectorAll('.messageContainer.party')];
    else
      tabMessages = [...messages.querySelectorAll('.messageContainer:not(.global):not(.party)')];
    const oldTask = task;
    task = fastdom.mutate(() => {
      while (tabMessages.length > tabMessagesLimit)
        tabMessages.shift().replaceWith(tabMessages[0]);
      return oldTask;
    })
  }

  task.then(shouldScroll => shouldScroll && scrollChatMessages());

  return msgContainer;
}

function scrollChatMessages() {
  // force the scroll to work in the next task,
  // avoiding a costly style invalidation on startup.
  setTimeout(() => {
    const messages = document.getElementById('messages');
    const scrollHeight = messages.scrollHeight;
    fastdom.mutate(() => {
      messages.scrollTop = scrollHeight;
    });
  });
}

let savedChatScrollTop = 0;

function saveScrollPosition() {
  const messages = document.getElementById('messages');
  savedChatScrollTop = messages.scrollTop;
}

let gameChatModeIndex = 0;

function addGameChatMessage(messageHtml, messageType, senderUuid) {
  const gameChatContainer = document.getElementById('gameChatContainer');

  const messageContainer = document.createElement('div');
  messageContainer.classList.add('gameChatMessageContainer');
  if (messageType === 2) {
    if (!globalConfig.gameChatGlobal)
      messageContainer.classList.add('hidden');
  } else if (messageType === 3) {
    if (!globalConfig.gameChatParty || !joinedPartyId)
      messageContainer.classList.add('hidden');
  }
  messageContainer.dataset.messageType = messageType;
  messageContainer.dataset.senderUuid = senderUuid;

  if (blockedPlayerUuids.indexOf(senderUuid) > -1)
    messageContainer.classList.add('blockedHidden');

  const message = document.createElement('div');
  message.classList.add('gameChatMessage', 'message');
  message.innerHTML = messageHtml;

  messageContainer.appendChild(message);

  fastdom.mutate(() => {
    gameChatContainer.insertBefore(messageContainer, gameChatContainer.children[gameChatContainer.childElementCount - 1]);

    const typeMessages = Array.from(gameChatContainer.children).filter(m => m.dataset.messageType == messageType);
    if (typeMessages.length > 10)
      typeMessages[0].remove();
  });

  setTimeout(() => {
    messageContainer.classList.add('fade');
    setTimeout(() => {
      messageContainer.classList.remove('fade');
      messageContainer.classList.add('expired');
    }, 1000);
  }, 10000);
}

function setGameChatMode(modeIndex) {
  const chatModeIcon = document.getElementById('gameChatModeIcon');
  gameChatModeIndex = modeIndex;
  if (modeIndex) {
    if (modeIndex === 1) {
      if (globalConfig.gameChatGlobal)
        chatModeIcon.innerHTML = getSvgIcon('global', true).outerHTML;
      else
        cycleGameChatMode();
    } else {
      if (globalConfig.gameChatParty && joinedPartyId)
        chatModeIcon.innerHTML = getSvgIcon('party', true).outerHTML;
      else
        cycleGameChatMode();
    }
  } else
    chatModeIcon.innerHTML = '';
  document.getElementById('gameChatInputContainer').querySelector('.globalCooldownIcon').classList.toggle('hidden', modeIndex !== 1);
}

function cycleGameChatMode() {
  if (gameChatModeIndex < 2)
    setGameChatMode(gameChatModeIndex + 1);
  else
    setGameChatMode(0);
}

function updateGameChatMessageVisibility() {
  const gameChatMessageContainers = document.getElementsByClassName('gameChatMessageContainer');
  for (let messageContainer of gameChatMessageContainers) {
    if (messageContainer.dataset.messageType == 2)
      messageContainer.classList.toggle('hidden', !globalConfig.gameChatGlobal);
    else if (messageContainer.dataset.messageType == 3)
      messageContainer.classList.toggle('hidden', !globalConfig.gameChatParty || !joinedPartyId);
  }
}

function chatInputActionFired() {
  const chatInput = document.getElementById("chatInput");
  if (!chatInput?.value.trim().length)
    return;
  const htmlTextEl = document.createElement("span");
  htmlTextEl.innerHTML = parseMessageTextForMarkdown(chatInput.value);
  if (!htmlTextEl.innerText.trim().length)
    return;
  const partyChat = document.getElementById("chatbox").classList.contains("partyChat");
  if (!chatInput.dataset.global && !partyChat && (connStatus != 1 && connStatus != 3))
    return;
  if (chatInput.dataset.global && chatInput.dataset.blockGlobal)
    return;
  const chatTab = document.querySelector(".chatboxTab[data-tab-section='chat']");
  if (!chatTab.classList.contains("active"))
    chatTab.click();
  let message = chatInput.value.trim();
  if (message.includes('[screenshot]') && chatInput.dataset.screenshotId) {
    const flags = +chatInput.dataset.screenshotFlags;
    message = message.replace('[screenshot]', `[${chatInput.dataset.screenshotTemp ? 't' : ''}${chatInput.dataset.screenshotId}${flags ? `:${flags}` : ''}]`);
    delete chatInput.dataset.screenshotId;
    delete chatInput.dataset.screenshotTemp;
    delete chatInput.dataset.screenshotFlags;
  }
  if (!chatInput.dataset.global || partyChat) {
    if (!joinedPartyId || !partyChat) {
      sendSessionCommand("say", [ message ]);
    } else
      sendSessionCommand("psay", [ message ]);
  } else if (!trySendGlobalMessage(message))
    return;
  chatInput.value = "";
  document.getElementById("ynomojiContainer").classList.add("hidden");
}

/** @param {number} length */
function constrainByteLength(length) {
  const buf = new Uint8Array(length + 1);
  const enc = new TextEncoder();
  const dec = new TextDecoder(undefined, { fatal: false });
  return event => {
    const target = event?.target;
    if (!target) return;
    if (enc.encodeInto(target.value, buf).read <= length) return;
    let recovered = dec.decode(buf.slice(0, length));
    const invalid = recovered.indexOf('�');
    if (invalid > -1) recovered = recovered.slice(0, invalid);
    target.value = recovered;
  };
}

document.getElementById('chatInput').addEventListener('input', constrainByteLength(150));

function chatNameCheck() {
  trySetChatName(document.getElementById("nameInput").value);
}

function trySetChatName(name) {
  if (name && !(/^[A-Za-z0-9]+$/.test(name)))
    return;
  playerName = name;
  document.getElementById("enterNameContainer").style.display = playerName ? "none" : null;
  document.getElementById("chatInput").disabled = !playerName;
  document.getElementById("chatInputContainer").setAttribute("style", playerName ? "" : "display: none");
  updateYnomojiContainerPos();
  if (playerName) {
    if (playerData) {
      playerData.name = playerName;
      globalPlayerData[playerData.uuid].name = playerName;
    }
    addOrUpdatePlayerListEntry(null, playerData, false, true);
    if (!loggedIn)
      sendSessionCommand('name', [ playerName ]);
  }
}

function initChat() {
  document.getElementById("chatboxContainer").style.display = "table-cell";
  
  const gameChatContainer = document.getElementById('gameChatContainer');
  const gameChatInput = document.getElementById('gameChatInput');
  gameChatInput.onfocus = function() {
    gameChatContainer.classList.add('focused');
    document.execCommand('selectAll', false, null);
    document.getSelection().collapseToEnd();
  };
  gameChatInput.onblur = () => gameChatContainer.classList.remove('focused');
  gameChatInput.onkeydown = function (e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      cycleGameChatMode();
    } else if (e.key === 'Enter') {
      const chatMessageContent = e.target.innerText.trim();
      if (!chatMessageContent) {
        document.getElementById('canvas').focus();
        return;
      }
      e.preventDefault();
      if (!playerName)
        return;
      switch (gameChatModeIndex) {
        case 0:
          sendSessionCommand('say', [ chatMessageContent ]);
          break;
        case 1:
          if (!trySendGlobalMessage(chatMessageContent))
            return;
          break;
        case 2:
          sendSessionCommand('psay', [ chatMessageContent ]);
          break;
      }
      e.target.innerHTML = '';
    } else if (e.key === 'Escape') {
      document.getElementById('canvas').focus();
      return;
    }
  };
}

function trySendGlobalMessage(content) {
  const chatInput = document.getElementById("chatInput");
  if (chatInput.blockGlobal)
    return false;

  const chatInputContainer = document.getElementById("chatInputContainer");
  
  if (!chatInputContainer.classList.contains("globalCooldown")) {
    const chatInputContainers = [ chatInputContainer, document.getElementById("gameChatInputContainer") ];
    const chatInputs = [ chatInput, document.getElementById('gameChatInput') ];
    sendSessionCommand("gsay", [ content ]);
    chatInputs.forEach(el => el.dataset.blockGlobal = true);
    chatInputContainers.forEach(el => el.classList.add("globalCooldown"));
    window.setTimeout(function () {
      chatInputContainers.forEach(el => el.classList.remove("globalCooldown"));
      chatInputs.forEach(el => delete el.dataset.blockGlobal);
    }, 5000);

    return true;
  }

  return false;
}

function addChatTip() {
  const tips = localizedMessages.chatTips.tips;
  if (++globalConfig.chatTipIndex >= Object.keys(tips).length)
    globalConfig.chatTipIndex = 0;
  const tipIndex = globalConfig.chatTipIndex;
  const tipKey = Object.keys(tips)[tipIndex];
  const msgContainer = chatboxAddMessage(getMassagedLabel(localizedMessages.chatTips.template.replace("{CONTENT}", tips[tipKey])), null, null, true);
  if (msgContainer) {
    msgContainer.dataset.chatTip = tipKey;
  }
  updateConfig(globalConfig, true);
}

function addChatMapLocation(locations) {
  const locationHtml = cached2kkiLocations
    ? getLocalized2kkiLocations(cached2kkiLocations, "&nbsp;|&nbsp;")
    : getLocalizedMapLocations(gameId, cachedMapId, cachedPrevMapId, tpX, tpY, "&nbsp;|&nbsp;");

  if (eventPeriodCache)
    getOrQueryLocationColors(locations)
      .then(colors => updateLocationDisplay(cached2kkiLocations
        ? getLocalized2kkiLocations(cached2kkiLocations, "&nbsp;/&nbsp;", true)
        : getLocalizedMapLocations(gameId, cachedMapId, cachedPrevMapId, tpX, tpY, "&nbsp;/&nbsp;", true),
          Array.isArray(colors) && colors.length === 2 ? colors : null))
  else
    updateLocationDisplay(getLocalizedMapLocations(gameId, cachedMapId, cachedPrevMapId, tpX, tpY, "&nbsp;/&nbsp;", true));
    
  const locMessages = document.getElementById("messages").querySelectorAll(".messageContainer.locMessage");
  let lastLocMessage = locMessages.length ? locMessages[locMessages.length - 1] : null;
  if (lastLocMessage?.classList.contains("hidden")) {
    lastLocMessage.remove();
    lastLocMessage = locMessages.length > 1 ? locMessages[locMessages.length - 2] : null;
  }
  
  if (lastLocMessage && new DOMParser().parseFromString(locationHtml, "text/html").documentElement.textContent === lastLocMessage.innerText)
    return;

  const mapId = cachedMapId || "0000";
  const prevMapId = cachedPrevMapId || "0000";
  const x = tpX !== -1 ? tpX : undefined;
  const y = tpY !== -1 ? tpY : undefined;
  const prevLocationsStr = (gameId === "2kki" && typeof cachedPrev2kkiLocations !== 'undefined' && cachedPrev2kkiLocations?.length)
    ? window.btoa(encodeURIComponent(cachedPrev2kkiLocations.map(l => l.title).join('|')))
    : null;
  const locMessage = chatboxAddMessage(locationHtml, null, null, true, mapId, prevMapId, prevLocationsStr, x, y);
  if (locMessage) {
    locMessage.classList.add("locMessage", "map", "hidden");
    locMessage.dataset.mapId = mapId;
    locMessage.dataset.prevMapId = prevMapId;
    if (x !== undefined) locMessage.dataset.x = String(x);
    if (y !== undefined) locMessage.dataset.y = String(y);
    if (prevLocationsStr) locMessage.dataset.prevLocationsStr = prevLocationsStr;
    if (gameId === "2kki") {
      locMessage.dataset.is2kki = "true";
    }
  }
}

function markMapUpdateInChat() {
  const messages = document.getElementById("messages");
  const allTabMessageContainers = messages.querySelectorAll(".messageContainer:not(.map)");
  const mapTabMessageContainers = messages.querySelectorAll(".messageContainer:not(.global)");
  
  if (allTabMessageContainers.length) {
    const allTabLocMessages = messages.querySelectorAll("lastAllTabMessageInLoc");
    if (!allTabLocMessages.length)
      allTabMessageContainers[allTabMessageContainers.length - 1].classList.add("lastAllTabMessageInLoc");
  }
  if (mapTabMessageContainers.length) {
    const mapTabLocMessages = messages.querySelectorAll("lastMapTabMessageInLoc");
    if (!mapTabLocMessages.length)
      mapTabMessageContainers[mapTabMessageContainers.length - 1].classList.add("lastMapTabMessageInLoc");
  }
}

function getChatMessageTimestampLabel(timestamp, defaultDate) {
  const timeString = timestamp.toLocaleString(globalConfig.lang === 'en' ? [] : globalConfig.lang, { "timeStyle": "short" });
  const weekdayString = !defaultDate && new Date().toDateString() !== timestamp.toDateString() ? timestamp.toLocaleString(globalConfig.lang === 'en' ? [] : globalConfig.lang, { "weekday": "short" }) : null;

  let timestampLabel = getMassagedLabel(localizedMessages.timestamp[weekdayString ? "timeAndWeekday" : "time"], true).replace("{TIME}", timeString);
  if (weekdayString)
    timestampLabel = timestampLabel.replace("{WEEKDAY}", weekdayString);

  return timestampLabel;
}

function updateChatMessageTimestamps() {
  const timestamps = document.getElementById("messages").querySelectorAll('.messageTimestamp');

  for (let timestamp of timestamps)
    timestamp.innerHTML = getChatMessageTimestampLabel(new Date(parseInt(timestamp.dataset.time)));
}

async function syncChatHistory() {
  const messages = document.getElementById("messages");
  const idMessages = messages.querySelectorAll('.messageContainer[data-msg-id]');
  const lastMessageId = idMessages.length ? idMessages[idMessages.length - 1].dataset.msgId : null;

  updateChatMessageTimestamps();

  const chatHistory = await apiFetch(`chathistory?globalMsgLimit=${globalConfig.globalChatHistoryLimit}&partyMsgLimit=${globalConfig.partyChatHistoryLimit}${lastMessageId ? `&lastMsgId=${lastMessageId}` : ''}`)
    .then(response => {
      if (!response.ok)
        throw new Error(response.statusText);
      return response.json();
    });
  if (chatHistory.players) {
    for (let player of chatHistory.players) {
      let badge = player.badge;
      
      if (badge === 'null')
        badge = null;

      globalPlayerData[player.uuid] = {
        name: player.name,
        systemName: player.systemName,
        rank: player.rank,
        account: player.account,
        badge: badge,
        medals: player.medals
      };
    }
  }

  if (chatHistory.messages) {
    // don't yield to any other task here, since we may be loading at least
    // a hundred of these and each yield will cause a decent amount of layout thrasing
    for (let message of chatHistory.messages) {
      chatboxAddMessage(message.contents, message.party ? MESSAGE_TYPE.PARTY : MESSAGE_TYPE.GLOBAL, message.uuid, true, message.mapId, message.prevMapId, message.prevLocations, message.x, message.y, message.msgId, new Date(message.timestamp), false);
    }
    scrollChatMessages();
  }
}

const markdownSyntax = [
  { p: /<\/?[bisux] *>/ig, r: '' },
  { p: /(?:^|([^\\]))(\*{3,})([^*_~|\\]+)\2/g, r: '$1<b><i>$3</i></b>' },
  { p: /(?:^|([^\\]))(\*{2})([^*_~|\\]+)\2/g, r: '$1<b>$3</b>' },
  { p: /(?:^|([^\\]))\*([^*_~|\\]+)\*/g, r: '$1<i>$2</i>' },
  { p: /(?:^|([^\\]))(_{3,})([^*_~|\\]+)\2(?= |$)/g, r: '$1<u><i>$3</i></u>' },
  { p: /(?:^|([^\\]))(_{2})([^*_~|\\]+)\2(?= |$)/g, r: '$1<u>$3</u>' },
  { p: /(?:^|([^\\]))_([^*_~|\\]+)_(?= |$)/g, r: '$1<i>$2</i>' },
  { p: /(?:^|([^\\]))(~{2,})([^*_~|\\]+)\2/g, r: '$1<s>$3</s>' },
  { p: /(?:^|([^\\]))(\|{2,})([^*_~|\\]+)\2/g, r: '$1<x>$3</x>' },
  { p: /\\\*/g, r: '*' },
  { p: /\\_/g, r: '_' },
  { p: /\\~/g, r: '~' },
  { p: /\\\|/g, r: '|' },
];
/** @param {string} msg */
function parseMessageTextForMarkdown(msg) {
  for (let syntax of markdownSyntax)
    msg = msg.replace(syntax.p, syntax.r);

  return msg;
}

function populateMessageNodes(msg, node, asHtml) {
  const tagPattern = /<([bisux])>(.*?)<\/\1>/;
  let cursor = 0;
  let result;

  while ((result = tagPattern.exec(msg.slice(cursor)))) {
    if (result.index) {
      const content = msg.slice(cursor, cursor + result.index);
      let textNode;
      if (asHtml) {
        textNode = document.createElement("span");
        textNode.innerHTML = content;
      } else
        textNode = document.createTextNode(content);
      node.appendChild(textNode);
    }
    const isSpoiler = result[1] === "x";
    const childNode = document.createElement(isSpoiler ? "span" : result[1]);
    const innerMsg = msg.substr(cursor + result.index + 3, result[2].length);
    if (isSpoiler) {
      childNode.classList.add("spoiler");
      childNode.onclick = function () { this.classList.add("show"); };
    }
    populateMessageNodes(innerMsg, childNode, asHtml);
    node.appendChild(childNode);
    cursor += result.index + result[2].length + 7;
  }

  if (cursor < msg.length) {
    const content = msg.slice(cursor);
    let textNode;
    if (asHtml) {
      textNode = document.createElement("span");
      textNode.innerHTML = content;
    } else
      textNode = document.createTextNode(content);
    node.appendChild(textNode);
  }
}

function wrapMessageEmojis(node, force) {
  if (node.childNodes.length && !force) {
    for (let childNode of node.childNodes) {
      if (/\p{Extended_Pictographic}/u.test(childNode.textContent) || /:([a-z0-9_\-]+):/i.test(childNode.textContent)) {
        if (childNode.nodeType === Node.TEXT_NODE) {
          const newChildNode = document.createElement("span");
          newChildNode.innerText = childNode.textContent;
          node.replaceChild(newChildNode, childNode);
          wrapMessageEmojis(newChildNode, true);
        } else
          wrapMessageEmojis(childNode);
      }
    }
  } else {
    node.innerHTML = node.innerHTML.replace(/(\p{Extended_Pictographic}+)/ug, '<span class="emoji">$1</span>');
    const ynomojiPattern = /:([a-z0-9_\-]+):/gi;
    let ynomojiMatch;
    while (ynomojiMatch = ynomojiPattern.exec(node.innerHTML)) {
      const ynomojiId = Object.keys(ynomojiConfig).find(id => id === ynomojiMatch[1]);
      if (ynomojiId)
        node.innerHTML = `${node.innerHTML.slice(0, ynomojiMatch.index)}<span class="ynomojiWrapper"><img src="${ynomojiUrlPrefix}${ynomojiConfig[ynomojiId]}" class="ynomoji" title="${ynomojiId}" /></span>${node.innerHTML.slice(ynomojiMatch.index + ynomojiId.length + 2)}`;
    }
  }
}

const screenshotPattern = /\[(t?)(\w{16})(?::(\d+))?\]/;
/** Decodes the message constructed by {@linkcode chatInputActionFired}
	Currently disabled. */
function tryEmbedScreenshot(node, uuid) {
	return false;
  if (node.childNodes.length) {
    for (let childNode of node.childNodes) {
      if (childNode.nodeType === Node.TEXT_NODE) {
        let screenshotResult;
        if ((screenshotResult = screenshotPattern.exec(childNode.textContent)) !== null) {
          let isTemp = !!screenshotResult[1];
          const flags = +screenshotResult[3] || 0;

          const imageNode = document.createElement('img');
          imageNode.classList.add('screenshotEmbed');
          imageNode.classList.toggle('screenshotBlur', globalConfig.blurScreenshotEmbeds || !!(flags & SCREENSHOT_FLAGS.SPOILER));
          imageNode.src = `${serverUrl}/screenshots/${isTemp ? 'temp/' : ''}${uuid}/${screenshotResult[2]}.png`;
          const date = new Date();
          imageNode.onclick = function () {
            sendSessionCommand('psi', [ uuid, screenshotResult[2] ], args => {
              const screenshotInfo = JSON.parse(args[0]);
              viewScreenshot(imageNode.src, date, screenshotInfo);
            });
          };
          let offset = 18;
          if (isTemp) offset++;
          if (flags) offset += 1 + screenshotResult[3].length;
          
          const beforeNode = screenshotResult.index ? document.createTextNode('') : null;
          if (beforeNode)
            beforeNode.textContent = childNode.textContent.slice(0, screenshotResult.index);
          const afterNode = childNode.textContent.length > screenshotResult.index + offset ? document.createTextNode('') : null;
          if (afterNode)
            afterNode.textContent = childNode.textContent.slice(screenshotResult.index + offset);
          node.replaceChild(imageNode, childNode);
          if (beforeNode)
            node.insertBefore(beforeNode, imageNode);
          if (afterNode) {
            if (childNode !== node.childNodes[node.childElementCount - 1])
              node.insertBefore(afterNode, imageNode.nextSibling);
            else
              node.appendChild(afterNode);
          }
        
          return true;
        }
      } else if (tryEmbedScreenshot(childNode, uuid))
        return true;
    }
  } else if (node.nodeType === Node.TEXT_NODE && /\[t?\w{16}\]/.test(node.textContent)) {
    const newParentNode = document.createElement('span');
    newParentNode.appendChild(node);
    tryEmbedScreenshot(newParentNode, uuid);
  }

  return false;
}

(function () {
  addSessionCommandHandler('say', args => {
    const uuid = args[0];
    const msg = args[1];
    chatboxAddMessage(msg, MESSAGE_TYPE.MAP, uuid)
  });

  addSessionCommandHandler('gsay', args => {
    const uuid = args[0];
    const mapId = args[1];
    const prevMapId = args[2];
    const prevLocationsStr = args[3];
    const x = parseInt(args[4]);
    const y = parseInt(args[5]);
    const msg = args[6];
    const msgId = args[7]
    chatboxAddMessage(msg, MESSAGE_TYPE.GLOBAL, uuid, false, mapId, prevMapId, prevLocationsStr, x, y, msgId);
  });

  addSessionCommandHandler('psay', args => {
    const uuid = args[0];
    const msg = args[1];
    const msgId = args[2];
    
    let partyMember = joinedPartyCache ? joinedPartyCache.members.find(m => m.uuid === uuid) : null;
    if (partyMember)
      chatboxAddMessage(msg, MESSAGE_TYPE.PARTY, partyMember, false, partyMember.mapId, partyMember.prevMapId, partyMember.prevLocations, partyMember.x, partyMember.y, msgId);
    else {
      updateJoinedParty(() => {
        partyMember = joinedPartyCache.members.find(m => m.uuid === uuid);
        chatboxAddMessage(msg, MESSAGE_TYPE.PARTY, partyMember, false, partyMember.mapId, partyMember.prevMapId, partyMember.prevLocations, partyMember.x, partyMember.y, msgId);
      });
    }
  });
})();

(function() {
  async function sleep(milliseconds) {
    return await new Promise(r => setTimeout(r, milliseconds));
  }

  (async () => {
    for (; !window.fastdom; await sleep(100));

    function isWindowInactive() {
      return document.hidden || (document.hasFocus && !document.hasFocus());
    }

    fastdom.constructor.prototype.raf = callback => {
      return isWindowInactive() ? setTimeout(callback, 0) : requestAnimationFrame(callback);
    };

    const seen = new Set();
    for (let fd = window.fastdom; fd && !seen.has(fd); fd = fd.fastdom) {
      seen.add(fd);
      if (Object.prototype.hasOwnProperty.call(fd, 'raf')) delete fd.raf;
    }
  })();
})();