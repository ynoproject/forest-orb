Module["onRuntimeInitialized"] = initChat;
if (typeof ENV === "undefined")
  initChat();

const MESSAGE_TYPE = {
  SYSTEM: 0,
  MAP: 1,
  GLOBAL: 2,
  PARTY: 3
};

function chatboxAddMessage(msg, type, player, mapId, prevMapId, prevLocationsStr, x, y) {
  const messages = document.getElementById("messages");
  
  const shouldScroll = Math.abs((messages.scrollHeight - messages.scrollTop) - messages.clientHeight) <= 20;

  const msgContainer = document.createElement("div");
  msgContainer.classList.add("messageContainer");
  
  const message = document.createElement("span");
  message.classList.add("message");

  const messageContents = document.createElement("span");
  messageContents.classList.add("messageContents");

  const system = !type;
  const map = type === MESSAGE_TYPE.MAP;
  const global = type === MESSAGE_TYPE.GLOBAL;
  const party = type === MESSAGE_TYPE.PARTY;

  if (!system) {
    let rankIcon;
    let partyIcon;

    if (global || party) {
      const showLocation = (mapId || "0000") !== "0000" && (localizedMapLocations || gameId === "2kki");

      msgContainer.classList.add(global ? "global" : "party");
      if (global || showLocation)
        msgContainer.appendChild(getSvgIcon("playerLocation"));

      if (showLocation) {
        const playerLocationIcon = msgContainer.children[0];
        const playerLocation = document.createElement("small");

        if (gameId === "2kki" && (!localizedMapLocations || !localizedMapLocations.hasOwnProperty(mapId))) {
          const prevLocations = prevLocationsStr && prevMapId !== "0000" ? decodeURIComponent(window.atob(prevLocationsStr)).split("|").map(l => { return { title: l }; }) : null;
          set2kkiGlobalChatMessageLocation(playerLocationIcon, playerLocation, mapId, prevMapId, prevLocations);
        } else {
          const locationsHtml = getLocalizedMapLocationsHtml(gameId, mapId, prevMapId, x, y, getInfoLabel("&nbsp;|&nbsp;"));
          addTooltip(playerLocationIcon, locationsHtml, true, false, true);
          playerLocation.innerHTML = locationsHtml;
        }

        playerLocation.classList.add("playerLocation");
        if (!config.showGlobalMessageLocation)
          playerLocation.classList.add("hidden");

        msgContainer.appendChild(playerLocation);

        playerLocationIcon.classList.add("pointer");

        playerLocationIcon.onclick = function () {
          const locationLabel = this.nextElementSibling;
          locationLabel.classList.toggle("hidden");
          config.showGlobalMessageLocation = !locationLabel.classList.contains("hidden");
          updateConfig(config);
        };
      }
    }

    if (party) {
      partyIcon = getSvgIcon("party", true);
      if (joinedPartyCache)
        addTooltip(partyIcon, getPartyName(joinedPartyCache, false, true), true, true);
      message.appendChild(partyIcon);
    }

    const name = document.createElement("span");
    name.classList.add("nameText");

    name.innerText = getPlayerName(player);
    const nameBeginMarker = document.createElement("span");
    nameBeginMarker.classList.add("nameMarker");
    nameBeginMarker.textContent = player.account ? "[" : "<";
    const nameEndMarker = document.createElement("span");
    nameEndMarker.classList.add("nameMarker");
    nameEndMarker.textContent = player.account ? "]" : ">";
    message.appendChild(nameBeginMarker);
    message.appendChild(name);
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
      if (joinedPartyCache.systemName) {
        const parsedPartySystemName = joinedPartyCache.systemName.replace(" ", "_");
        const iconStyle = `fill: var(--svg-base-gradient-${parsedPartySystemName}); filter: var(--svg-shadow-${parsedPartySystemName});`;
        partyIcon.querySelector("path").setAttribute("style", iconStyle);
        if (partyOwnerIcon)
          partyOwnerIcon.querySelector("path").setAttribute("style", iconStyle);
      }
    }

    let systemName = player?.systemName;

    const badge = player?.badge ? document.createElement('div') : null;
    const badgeOverlay = badge && overlayBadgeIds.indexOf(player.badge) > -1 ? document.createElement('div') : null;

    if (badge) {
      badge.classList.add('badge');
      badge.classList.add('nameBadge');

      if (localizedBadges) {
        const badgeGame = Object.keys(localizedBadges).find(game => {
          return Object.keys(localizedBadges[game]).find(b => b === player.badge);
        });
        if (badgeGame)
          addTooltip(badge, getMassagedLabel(localizedBadges[badgeGame][player.badge].name, true), true, true);
      }
      if (player?.name) {
        addOrUpdatePlayerBadgeGalleryTooltip(badge, player.name, systemName || getDefaultUiTheme());
        badge.classList.toggle('badgeButton', player.name);
      }

      const badgeUrl = `images/badge/${player.badge}.png`;
      badge.style.backgroundImage = `url('${badgeUrl}')`;

      if (badgeOverlay) {
        badge.classList.add('overlayBadge');

        badgeOverlay.classList.add('badgeOverlay');
        badgeOverlay.setAttribute('style', `-webkit-mask-image: url('${badgeUrl}'); mask-image: url('${badgeUrl}');`);
        badge.appendChild(badgeOverlay);
      }
    }

    if (systemName) {
      systemName = systemName.replace(/'/g, "");
      const parsedSystemName = systemName.replace(" ", "_");
      initUiThemeContainerStyles(systemName, false, () => {
        initUiThemeFontStyles(systemName, 0, false, () => {
          name.setAttribute("style", `color: var(--base-color-${parsedSystemName}); background-image: var(--base-gradient-${parsedSystemName}) !important; filter: drop-shadow(1.5px 1.5px var(--shadow-color-${parsedSystemName}));`);
          if (rankIcon)
            rankIcon.querySelector("path").setAttribute("style", `fill: var(--svg-base-gradient-${parsedSystemName}); filter: var(--svg-shadow-${parsedSystemName});`);
          if (badgeOverlay)
            badgeOverlay.style.backgroundImage = `var(--base-gradient-${parsedSystemName})`;
        });
      });
    }

    if (badge)
      message.appendChild(badge);
    
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

  if (shouldScroll)
    messages.scrollTop = messages.scrollHeight;

  return msgContainer;
}

function chatInputActionFired() {
  if (connStatus !== 1)
    return;
  const chatInput = document.getElementById("chatInput");
  if (chatInput.value === "")
    return;
  const chatTab = document.querySelector(".chatboxTab[data-tab-section='chat']");
  if (!chatTab.classList.contains("active"))
    chatTab.click();
  const msgPtr = Module.allocate(Module.intArrayFromString(chatInput.value.trim()), Module.ALLOC_NORMAL);
  if (!chatInput.dataset.global) {
    if (!joinedPartyId || !document.getElementById("chatbox").classList.contains("partyChat"))
      Module._SendChatMessageToServer(msgPtr);
    else
      Module._SendPChatMessageToServer(msgPtr);
  } else {
    const chatInputContainer = document.getElementById("chatInputContainer");
    if (!chatInputContainer.classList.contains("globalCooldown")) {
      Module._SendGChatMessageToServer(msgPtr);
      chatInput.disabled = true;
      chatInput.blur();
      chatInputContainer.classList.add("globalCooldown");
      window.setTimeout(function () {
        chatInputContainer.classList.remove("globalCooldown");
        chatInput.disabled = false;
      }, 15000);
    }
  }
  Module._free(msgPtr);
  chatInput.value = "";
  document.getElementById("ynomojiContainer").classList.add("hidden");
}

function chatNameCheck() {
  trySetChatName(document.getElementById("nameInput").value);
}

function trySetChatName(name) {
  if (name === "" || !(/^[A-Za-z0-9]+$/.test(name)))
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
    const ptr = Module.allocate(Module.intArrayFromString(playerName), Module.ALLOC_NORMAL);
    Module._ChangeName(ptr);
    Module._free(ptr);
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
  chatboxAddMessage(getMassagedLabel(localizedMessages.chatTips.template.replace("{CONTENT}", tips[Object.keys(tips)[tipIndex]])));
  updateConfig(globalConfig, true);
}

function addChatMapLocation() {
  const locationHtml = cached2kkiLocations
    ? getLocalized2kkiLocations(cached2kkiLocations, "&nbsp;|&nbsp;")
    : getLocalizedMapLocations(gameId, cachedMapId, cachedPrevMapId, "&nbsp;|&nbsp;");

  const locMessages = document.getElementById("messages").querySelectorAll(".messageContainer.locMessage");
  let lastLocMessage = locMessages.length ? locMessages[locMessages.length - 1] : null;
  if (lastLocMessage?.classList.contains("hidden")) {
    lastLocMessage.remove();
    lastLocMessage = locMessages.length > 1 ? locMessages[locMessages.length - 2] : null;
  }
  
  if (lastLocMessage && new DOMParser().parseFromString(locationHtml, "text/html").documentElement.textContent === lastLocMessage.innerText)
    return;

  const locMessage = chatboxAddMessage(locationHtml);
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

function parseMessageTextForMarkdown(msg) {
  const replacements = [
    { p: /<\/?[bisux] *>/ig, r: '' },
    { p: /(?:^|([^\\]))(\*{3,})([^\*\_\~\|\\]+)\2/g, r: '$1<b><i>$3</i></b>' },
    { p: /(?:^|([^\\]))(\*{2})([^\*\_\~\|\\]+)\2/g, r: '$1<b>$3</b>' },
    { p: /(?:^|([^\\]))\*([^\*\_\~\|\\]+)\*/g, r: '$1<i>$2</i>' },
    { p: /(?:^|([^\\]))(\_{3,})([^\*\_\~\|\\]+)\2(?= |$)/g, r: '$1<u><i>$3</i></u>' },
    { p: /(?:^|([^\\]))(\_{2})([^\*\_\~\|\\]+)\2(?= |$)/g, r: '$1<u>$3</u>' },
    { p: /(?:^|([^\\]))\_([^\*\_\~\|\\]+)\_(?= |$)/g, r: '$1<i>$2</i>' },
    { p: /(?:^|([^\\]))(\~{2,})([^\*\_\~\|\\]+)\2/g, r: '$1<s>$3</s>' },
    { p: /(?:^|([^\\]))(\|{2,})([^\*\_\~\|\\]+)\2/g, r: '$1<x>$3</x>' },
    { p: /\\\*/g, r: '*' },
    { p: /\\\_/g, r: '_' },
    { p: /\\\~/g, r: '~' },
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
      if (/\p{Extended_Pictographic}/u.test(childNode.textContent) || /:([a-z0-9\_\-]+):/i.test(childNode.textContent)) {
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
    const ynomojiPattern = /:([a-z0-9\_\-]+):/gi;
    let ynomojiMatch;
    while (ynomojiMatch = ynomojiPattern.exec(node.innerHTML)) {
      const ynomojiId = Object.keys(ynomojiConfig).find(id => id === ynomojiMatch[1]);
      if (ynomojiId)
        node.innerHTML = `${node.innerHTML.slice(0, ynomojiMatch.index)}<span class="ynomojiWrapper"><img src="${ynomojiUrlPrefix}${ynomojiConfig[ynomojiId]}" class="ynomoji" title="${ynomojiId}" /></span>${node.innerHTML.slice(ynomojiMatch.index + ynomojiId.length + 2)}`;
    }
  }
}

// EXTERNAL
function onChatMessageReceived(msg, id) {
  const uuid = playerUuids[id];
  const player = uuid ? globalPlayerData[uuid] : null;
  chatboxAddMessage(msg, MESSAGE_TYPE.MAP, player);
}

// EXTERNAL
function onGChatMessageReceived(uuid, mapId, prevMapId, prevLocationsStr, x, y, msg) {
  const player = globalPlayerData[uuid] || null;
  chatboxAddMessage(msg, MESSAGE_TYPE.GLOBAL, player, mapId, prevMapId, prevLocationsStr, x, y);
}

// EXTERNAL
function onPChatMessageReceived(uuid, msg) {
  let partyMember = joinedPartyCache ? joinedPartyCache.members.find(m => m.uuid === uuid) : null;
  if (partyMember)
    chatboxAddMessage(msg, MESSAGE_TYPE.PARTY, partyMember, partyMember.mapId, partyMember.prevMapId, partyMember.prevLocations, partyMember.x, partyMember.y);
  else
    updateJoinedParty(true, () => {
      partyMember = joinedPartyCache.members.find(m => m.uuid === uuid);
      chatboxAddMessage(msg, MESSAGE_TYPE.PARTY, partyMember, partyMember.mapId, partyMember.prevMapId, partyMember.prevLocations, partyMember.x, partyMember.y);
    });
}