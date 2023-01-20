Module["onRuntimeInitialized"] = initChat;
if (typeof ENV === "undefined")
  initChat();

const MESSAGE_TYPE = {
  SYSTEM: 0,
  MAP: 1,
  GLOBAL: 2,
  PARTY: 3
};

function chatboxAddMessage(msg, type, player, ignoreNotify, mapId, prevMapId, prevLocationsStr, x, y, msgId, timestamp) {
  const messages = document.getElementById("messages");

  if (msgId && messages.querySelector(`.messageContainer[data-msg-id="${msgId}"]`))
    return null;
  
  const shouldScroll = Math.abs((messages.scrollHeight - messages.scrollTop) - messages.clientHeight) <= 20;

  const msgContainer = document.createElement("div");
  msgContainer.classList.add("messageContainer");
  
  const message = document.createElement("span");
  message.classList.add("message");

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

  if (!system) {
    let rankIcon;
    let chatTypeIcon;

    const msgHeader = document.createElement("div");
    msgHeader.classList.add("messageHeader");

    if (global || party) {
      const showLocation = (mapId || "0000") !== "0000" && (localizedMapLocations || gameId === "2kki");

      msgContainer.classList.add(global ? "global" : "party");
      msgContainer.dataset.msgId = msgId;

      if (showLocation) {
        const playerLocation = document.createElement("small");

        if (gameId === "2kki" && (!localizedMapLocations || !localizedMapLocations.hasOwnProperty(mapId))) {
          const prevLocations = prevLocationsStr && prevMapId !== "0000" ? decodeURIComponent(window.atob(prevLocationsStr)).split("|").map(l => { return { title: l }; }) : null;
          set2kkiGlobalChatMessageLocation(playerLocation, mapId, prevMapId, prevLocations);
        } else {
          const locationsHtml = getLocalizedMapLocationsHtml(gameId, mapId, prevMapId, x, y, getInfoLabel("&nbsp;|&nbsp;"));
          playerLocation.innerHTML = locationsHtml;
        }

        playerLocation.classList.add("playerLocation");

        msgHeader.appendChild(playerLocation);
      } else
        msgHeader.appendChild(document.createElement('span'));

      if (global) {
        chatTypeIcon = getSvgIcon("global", true);
        addTooltip(chatTypeIcon, getMassagedLabel(localizedMessages.chat.globalMessage, true), true, true);
      } else {
        chatTypeIcon = getSvgIcon("party", true);
        if (joinedPartyCache)
          addTooltip(chatTypeIcon, getPartyName(joinedPartyCache, false, true), true, true);
      }
      message.appendChild(chatTypeIcon);
    } else
      msgHeader.appendChild(document.createElement('span'));

    const defaultDate = !timestamp;
    if (defaultDate)
      timestamp = new Date();

    const msgTimestamp = document.createElement("small");

    msgTimestamp.classList.add('messageTimestamp');
    msgTimestamp.dataset.time = timestamp.getTime();

    msgTimestamp.innerHTML = getChatMessageTimestampLabel(timestamp, defaultDate);

    msgHeader.appendChild(msgTimestamp);
    msgContainer.appendChild(msgHeader);

    const name = document.createElement("span");
    name.classList.add("nameText");

    name.innerText = getPlayerName(player);
    const nameBeginMarker = document.createElement("span");
    nameBeginMarker.classList.add("nameMarker");
    nameBeginMarker.textContent = player?.account ? "[" : "<";
    const nameEndMarker = document.createElement("span");
    nameEndMarker.classList.add("nameMarker");
    nameEndMarker.textContent = player?.account ? "]" : ">";
    message.appendChild(nameBeginMarker);
    message.appendChild(name);

    if (playerData?.rank > player?.rank)
      addAdminContextMenu(name, player, uuid);

    if (player?.rank) {
      const rank = Math.min(player.rank, 2);
      rankIcon = getSvgIcon(rank === 1 ? "mod" : "dev", true);
      rankIcon.classList.add("rankIcon");
      addTooltip(rankIcon, getMassagedLabel(localizedMessages.roles[Object.keys(localizedMessages.roles)[rank - 1]], true), true, true);
      message.appendChild(rankIcon);
    }

    if (party) {
      let partyOwnerIcon;
      if (joinedPartyCache && player?.uuid === joinedPartyCache.ownerUuid) {
        partyOwnerIcon = getSvgIcon("partyOwner", true);
        addTooltip(partyOwnerIcon, getMassagedLabel(localizedMessages.parties.partyOwner, true), true, true);
        message.appendChild(partyOwnerIcon);
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
      badgeEl.classList.add('badge');
      badgeEl.classList.add('nameBadge');

      if (localizedBadges) {
        const badgeGame = Object.keys(localizedBadges).find(game => {
          return Object.keys(localizedBadges[game]).find(b => b === player.badge);
        });
        if (badgeGame) {
          const badgeTippy = addTooltip(badgeEl, getMassagedLabel(localizedBadges[badgeGame][player.badge].name, true), true, true);
          if (!badge || badge.hidden)
            badgeTippy.popper.querySelector('.tooltipContent').classList.add('altText');
        }
      }
      if (player.name) {
        addOrUpdatePlayerBadgeGalleryTooltip(badgeEl, player.name, (systemName || getDefaultUiTheme()).replace(/'/g, ''), mapId, prevMapId, prevLocationsStr);
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

          badgeOverlay2El.classList.add('badgeOverlay');
          badgeOverlay2El.classList.add('badgeOverlay2');
          if (badge.overlayType & BadgeOverlayType.MULTIPLY)
            badgeOverlay2El.classList.add('badgeOverlayMultiply');

          badgeEl.appendChild(badgeOverlay2El);

          badgeOverlay2El.setAttribute('style', `-webkit-mask-image: url('${badgeMask2Url}'); mask-image: url('${badgeMask2Url}');`);
        }
      }
    }

    if (systemName) {
      systemName = systemName.replace(/'/g, "");
      const parsedSystemName = systemName.replace(" ", "_");
      initUiThemeContainerStyles(systemName, false, () => {
        initUiThemeFontStyles(systemName, 0, false, () => {
          name.setAttribute("style", `color: rgb(var(--base-color-${parsedSystemName})); background-image: var(--base-gradient-${parsedSystemName}) !important; filter: drop-shadow(1.5px 1.5px rgb(var(--shadow-color-${parsedSystemName})));`);
          if (rankIcon)
            rankIcon.querySelector("path").setAttribute("style", `fill: var(--svg-base-gradient-${parsedSystemName}); filter: var(--svg-shadow-${parsedSystemName});`);
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
            if (gameId === '2kki' && badge.overlayType & BadgeOverlayType.LOCATION)
              handle2kkiBadgeOverlayLocationColorOverride(badgeOverlayEl, badgeOverlay2El, null, player?.name, mapId, prevMapId, prevLocationsStr);
          }
        });
      });
    }

    if (badgeEl)
      message.appendChild(badgeEl);
    
    message.appendChild(nameEndMarker);
    message.appendChild(document.createTextNode(" "));
  }

  if (playerName && new RegExp(`(^|[^a-z\d])@${playerName}($|[^a-z\d])`, 'i').test(msg))
    msgContainer.classList.add("highlight");
  
  populateMessageNodes(parseMessageTextForMarkdown(msg), messageContents, system);
  wrapMessageEmojis(messageContents);

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
  
  message.appendChild(messageContents);
  msgContainer.appendChild(message);
  messages.appendChild(msgContainer);

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
      const unreadMessageCountLabel = document.getElementById("unreadMessageCountLabel");
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
      tabMessages = [...document.querySelectorAll('.messageContainer.global')];
    else if (party)
      tabMessages = [...document.querySelectorAll('.messageContainer.party')];
    else
      tabMessages = [...document.querySelectorAll('.messageContainer:not(.global):not(.party)')];
    while (tabMessages.length > tabMessagesLimit)
      tabMessages.shift().remove();
  }

  if (shouldScroll)
    messages.scrollTop = messages.scrollHeight;

  return msgContainer;
}

function chatInputActionFired() {
  const chatInput = document.getElementById("chatInput");
  if (!chatInput?.value.trim().length)
    return;
  const htmlTextEl = document.createElement("span");
  htmlTextEl.innerHTML = parseMessageTextForMarkdown(chatInput.value);
  if (!htmlTextEl.innerText.trim().length)
    return;
  if (loginToken && (chatInput.dataset.global || document.getElementById("chatbox").classList.contains("partyChat"))) {
    if (connStatus === 3)
      return;
  } else if (connStatus !== 1)
    return;
  if (chatInput.dataset.global && chatInput.dataset.blockGlobal)
    return;
  const chatTab = document.querySelector(".chatboxTab[data-tab-section='chat']");
  if (!chatTab.classList.contains("active"))
    chatTab.click();
  if (!chatInput.dataset.global) {
    if (!joinedPartyId || !document.getElementById("chatbox").classList.contains("partyChat")) {
      const msgPtr = Module.allocate(Module.intArrayFromString(chatInput.value.trim()), Module.ALLOC_NORMAL);
      Module._SendChatMessageToServer(msgPtr);
      Module._free(msgPtr);
    } else
      sendSessionCommand("psay", [ chatInput.value.trim() ]);
  } else {
    const chatInputContainer = document.getElementById("chatInputContainer");
    if (!chatInputContainer.classList.contains("globalCooldown")) {
      sendSessionCommand("gsay", [ chatInput.value.trim(), !config.hideOwnGlobalMessageLocation ? 1 : 0 ]);
      chatInput.dataset.blockGlobal = true;
      chatInputContainer.classList.add("globalCooldown");
      window.setTimeout(function () {
        chatInputContainer.classList.remove("globalCooldown");
        delete chatInput.dataset.blockGlobal;
      }, 5000);
    }
  }
  chatInput.value = "";
  document.getElementById("ynomojiContainer").classList.add("hidden");
}

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
    addOrUpdatePlayerListEntry(null, systemName, playerName, defaultUuid, false, true);
    if (!loginToken)
      sendSessionCommand('name', [ playerName ]);
  }
}

function initChat() {
  document.getElementById("chatboxContainer").style.display = "table-cell";
}

function addChatTip() {
  const tips = localizedMessages.chatTips.tips;
  if (++globalConfig.chatTipIndex >= Object.keys(tips).length)
    globalConfig.chatTipIndex = 0;
  const tipIndex = globalConfig.chatTipIndex;
  chatboxAddMessage(getMassagedLabel(localizedMessages.chatTips.template.replace("{CONTENT}", tips[Object.keys(tips)[tipIndex]])), null, null, true);
  updateConfig(globalConfig, true);
}

function addChatMapLocation(locations) {
  const locationHtml = cached2kkiLocations
    ? getLocalized2kkiLocations(cached2kkiLocations, "&nbsp;|&nbsp;")
    : getLocalizedMapLocations(gameId, cachedMapId, cachedPrevMapId, tpX, tpY, "&nbsp;|&nbsp;");

  if (is2kki)
    getOrQuery2kkiLocationColors(locations)
      .then(colors => updateLocationDisplay(
        cached2kkiLocations
          ? getLocalized2kkiLocations(cached2kkiLocations, "&nbsp;/&nbsp;", true)
          : getLocalizedMapLocations(gameId, cachedMapId, cachedPrevMapId, tpX, tpY, "&nbsp;/&nbsp;", true),
        Array.isArray(colors) && colors.length === 2 ? colors : null)
      );
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

  const locMessage = chatboxAddMessage(locationHtml, null, null, true);
  if (locMessage) {
    locMessage.classList.add("locMessage");
    locMessage.classList.add("map");
    locMessage.classList.add("hidden");
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

function syncChatHistory() {
  return new Promise((resolve, reject) => {
    const messages = document.getElementById("messages");
    const idMessages = messages.querySelectorAll('.messageContainer[data-msg-id]');
    const lastMessageId = idMessages.length ? idMessages[idMessages.length - 1].dataset.msgId : null;

    updateChatMessageTimestamps();

    apiFetch(`chathistory?globalMsgLimit=${globalConfig.globalChatHistoryLimit}&partyMsgLimit=${globalConfig.partyChatHistoryLimit}${lastMessageId ? `&lastMsgId=${lastMessageId}` : ''}`)
      .then(response => {
        if (!response.ok)
          reject(response.statusText);
        return response.json();
      })
      .then(chatHistory => {
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
          for (let message of chatHistory.messages)
            chatboxAddMessage(message.contents, message.party ? MESSAGE_TYPE.PARTY : MESSAGE_TYPE.GLOBAL, message.uuid, true, message.mapId, message.prevMapId, message.prevLocations, message.x, message.y, message.msgId, new Date(message.timestamp));
        }

        resolve();
      })
      .catch(err => reject(err));
  });
}

function parseMessageTextForMarkdown(msg) {
  const replacements = [
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
  for (let e of replacements)
    msg = msg.replace(e.p, e.r);

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

function showRules() {
  openModal('rulesModal');
  document.getElementById('chatInput').removeEventListener('click', showRules);
  if (!globalConfig.rulesReviewed) {
    globalConfig.rulesReviewed = true;
    updateConfig(globalConfig, true);
  }
}

document.getElementById('chatInput').addEventListener('click', showRules);

// EXTERNAL
function onChatMessageReceived(msg, id) {
  chatboxAddMessage(msg, MESSAGE_TYPE.MAP, playerUuids[id]);
}

(function () {
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