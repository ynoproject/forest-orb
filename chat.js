Module['onRuntimeInitialized'] = initChat;

function chatboxAddMessage(systemName, msg, mapId, prevMapId, prevLocationsStr) {
  const messages = document.getElementById("messages");
  
  const shouldScroll = Math.abs((messages.scrollHeight - messages.scrollTop) - messages.clientHeight) <= 20;

  const msgContainer = document.createElement("div");
  msgContainer.classList.add("messageContainer");
  
  const message = document.createElement("span");
  message.classList.add("message");

  const messageContents = document.createElement("span");
  messageContents.classList.add("messageContents");

  const msgTextResult = /^<(.*?)> (.*)/.exec(msg);
  const nameText = msgTextResult ? msgTextResult[1] : null;
  const msgText = msgTextResult ? msgTextResult[2] : msg;

  if (mapId) {
    msgContainer.classList.add("global");
    msgContainer.appendChild(document.getElementsByTagName("template")[0].content.cloneNode(true));

    if (mapId !== "0000" && (localizedMapLocations || gameId === "2kki")) {
      const globalMessageIcon = msgContainer.children[0];
      const globalMessageLocation = document.createElement("small");

      if (gameId === "2kki") {
        const prevLocations = prevLocationsStr && prevMapId !== "0000" ? decodeURIComponent(window.atob(prevLocationsStr)).split('|').map(l => { return { title: l }; }) : null;
        set2kkiGlobalChatMessageLocation(globalMessageIcon, globalMessageLocation, mapId, prevMapId, prevLocations);
      } else {
        globalMessageIcon.title = getLocalizedMapLocations(mapId, prevMapId);
        globalMessageLocation.innerHTML = getLocalizedMapLocationsHtml(mapId, prevMapId, getInfoLabel('&nbsp;|&nbsp;'));
      }

      msgContainer.appendChild(globalMessageLocation);

      globalMessageIcon.classList.add("pointer");

      globalMessageIcon.onclick = function () {
        const locationLabel = this.nextElementSibling;
        locationLabel.classList.toggle("hidden");
        config.showGlobalMessageLocation = !locationLabel.classList.contains("hidden");
        updateConfig(config);
      };
    }
  }

  if (nameText) {
    const name = document.createElement("span");
    name.classList.add("nameText");
    if (systemName) {
      systemName = systemName.replace(/'/g, '');
      getFontColors(systemName, 0, colors => name.setAttribute("style", `background-image: linear-gradient(to bottom, ${getGradientText(colors)}) !important`));
      getFontShadow(systemName, shadow => name.style.filter = `drop-shadow(1.5px 1.5px ${shadow})`);
    }
    name.innerText = nameText;
    const nameBeginMarker = document.createElement("span");
    nameBeginMarker.classList.add("nameMarker");
    nameBeginMarker.textContent = "<";
    const nameEndMarker = document.createElement("span");
    nameEndMarker.classList.add("nameMarker");
    nameEndMarker.textContent = ">";
    message.appendChild(nameBeginMarker);
    message.appendChild(name);
    message.appendChild(nameEndMarker);
    message.appendChild(document.createTextNode(" "));
  }
  
  populateMessageNodes(parseMessageTextForMarkdown(msgText), messageContents);
  wrapMessageEmojis(messageContents);
  
  message.appendChild(messageContents);
  msgContainer.appendChild(message);
  messages.appendChild(msgContainer);

  if (!document.querySelector(".chatboxTab.active[data-tab-section='messages']")) {
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
}

function chatInputActionFired() {
  const chatInput = document.getElementById("chatInput");
  if (chatInput.value === "")
    return;
  const chatTab = document.querySelector(".chatboxTab[data-tab-section='messages']");
  if (!chatTab.classList.contains("active"))
    chatTab.click();
  const sysPtr = Module.allocate(Module.intArrayFromString(chatInput.dataset.sys || ''), Module.ALLOC_NORMAL);
  const msgPtr = Module.allocate(Module.intArrayFromString(chatInput.value.trim()), Module.ALLOC_NORMAL);
  if (!chatInput.dataset.global || document.getElementById("chatboxContainer").classList.contains("hideGlobal"))
    Module._SendChatMessageToServer(sysPtr, msgPtr);
  else {
    const chatInputContainer = document.getElementById("chatInputContainer");
    if (!chatInputContainer.classList.contains("globalCooldown")) {
      const prevLocationsStr = cachedPrevLocations && cachedPrevLocations.length ? window.btoa(encodeURIComponent(cachedPrevLocations.map(l => l.title).join("|"))) : "";

      const mapIdPtr = Module.allocate(Module.intArrayFromString(cachedMapId || "0000"), Module.ALLOC_NORMAL);
      const prevMapIdPtr = Module.allocate(Module.intArrayFromString(cachedPrevMapId || "0000"), Module.ALLOC_NORMAL);
      const prevLocationsPtr = Module.allocate(Module.intArrayFromString(prevLocationsStr), Module.ALLOC_NORMAL);
      Module._SendGChatMessageToServer(mapIdPtr, prevMapIdPtr, prevLocationsPtr, sysPtr, msgPtr);
      chatInput.disabled = true;
      chatInput.blur();
      chatInputContainer.classList.add("globalCooldown");
      window.setTimeout(function () {
        chatInputContainer.classList.remove("globalCooldown");
        chatInput.disabled = false;
      }, 60000);

      Module._free(mapIdPtr);
      Module._free(prevMapIdPtr);
      Module._free(prevLocationsPtr);
    }
  }
  Module._free(sysPtr);
  Module._free(msgPtr);
  chatInput.value = "";
}

function chatNameCheck() {
  const nameInput = document.getElementById("nameInput");
  if (nameInput.value == "") return;
  if (!(/^[A-Za-z0-9]+$/.test(nameInput.value)))
    return;
  document.getElementById("enterNameContainer").style.display = "none";
  document.getElementById("chatInput").disabled = false;
  document.getElementById("chatInputContainer").setAttribute("style", "");
  playerName = nameInput.value;
  addOrUpdatePlayerListEntry(systemName, playerName, -1);
  ptr = Module.allocate(Module.intArrayFromString(playerName), Module.ALLOC_NORMAL);
  Module._ChangeName(ptr);
  Module._free(ptr);
  nameInput.value = "";
}

function initChat() {
  document.getElementById("chatboxContainer").style.display = "table-cell";
}

function parseMessageTextForMarkdown(msg) {
  const replacements = [
    { p: /<\/?[bisu] *>/ig, r: '' },
    { p: /(\*{3,})([^\*\_\~]+)\1/g, r: '<b><i>$2</i></b>' },
    { p: /(\*{2})([^\*\_\~]+)\1/g, r: '<b>$2</b>' },
    { p: /\*([^\*\_\~]+)\*/g, r: '<i>$1</i>' },
    { p: /(\_{3,})([^\*\_\~]+)\1(?= |$)/g, r: '<u><i>$2</i></u>' },
    { p: /(\_{2})([^\*\_\~]+)\1(?= |$)/g, r: '<u>$2</u>' },
    { p: /\_([^\*\_\~]+)\_(?= |$)/g, r: '<i>$1</i>' },
    { p: /(\~{2,})([^\*\_\~]+)\1/g, r: '<s>$2</s>' },
  ];
  for (let e of replacements)
    msg = msg.replace(e.p, e.r);

  return msg;
}

function populateMessageNodes(msg, node) {
  const tagPattern = /<([bisu])>(.*?)<\/\1>/;
  let cursor = 0;
  let result;

  while ((result = tagPattern.exec(msg.slice(cursor)))) {
    if (result.index) {
      const textNode = document.createTextNode(msg.slice(cursor, cursor + result.index));
      node.appendChild(textNode);
    }
    const childNode = document.createElement(result[1]);
    const innerMsg = msg.substr(cursor + result.index + 3, result[2].length);
    populateMessageNodes(innerMsg, childNode);
    node.appendChild(childNode);
    cursor += result.index + result[2].length + 7;
  }

  if (cursor < msg.length) {
    const textNode = document.createTextNode(msg.slice(cursor));
    node.appendChild(textNode);
  }
}

function wrapMessageEmojis(node, force) {
  if (node.childNodes.length && !force) {
    for (let childNode of node.childNodes) {
      if (/\p{Extended_Pictographic}/u.test(childNode.textContent)) {
        if (childNode.nodeType === Node.TEXT_NODE) {
          const newChildNode = document.createElement('span');
          newChildNode.innerText = childNode.textContent;
          node.replaceChild(newChildNode, childNode);
          wrapMessageEmojis(newChildNode, true)
        } else
          wrapMessageEmojis(childNode);
      }
    }
  } else
    node.innerHTML = node.innerHTML.replace(/(\p{Extended_Pictographic}+)/ug, '<span class="emoji">$1</span>');
}

// EXTERNAL
function onChatMessageReceived(systemName, msg) {
  chatboxAddMessage(systemName, msg);
}

// EXTERNAL
function onGChatMessageReceived(mapId, prevMapId, prevLocationsStr, systemName, msg) {
  chatboxAddMessage(systemName, msg, mapId, prevMapId, prevLocationsStr);
}