Module['onRuntimeInitialized'] = initChat;
ENV.SDL_EMSCRIPTEN_KEYBOARD_ELEMENT = "#canvas";

function chatboxAddMessage(systemName, msg) {
  const messages = document.getElementById("messages");
  
  const shouldScroll = Math.abs((messages.scrollHeight - messages.scrollTop) - messages.clientHeight) <= 20;

  const msgContainer = document.createElement("div");
  msgContainer.classList.add("messageContainer");
  
  const message = document.createElement("span");
  message.classList.add("message");

  const msgTextResult = /^<(.*?)> (.*)/.exec(msg);
  const nameText = msgTextResult ? msgTextResult[1] : null;
  const msgText = msgTextResult ? msgTextResult[2] : msg;

  if (nameText) {
    const nameContainer = document.createElement("span");
    const name = document.createElement("span");
    nameContainer.classList.add("nameText");
    name.classList.add("nameText");
    if (messages.dataset.useSystemForName) {
      name.setAttribute("style", `background-image: url('images/ui/${gameId}/${systemName}/font1.png') !important`);
      getFontShadow(systemName, function (shadow) {
        name.style.filter = `drop-shadow(1.5px 1.5px ${shadow})`;
      });
    }
    name.innerText = nameText;
    nameContainer.appendChild(document.createTextNode('<'));
    nameContainer.appendChild(name);
    nameContainer.appendChild(document.createTextNode('>'));
    message.appendChild(nameContainer);
    message.appendChild(document.createTextNode(' '));
  }
  
  populateMessageNodes(parseMessageTextForMarkdown(msgText), message);
  wrapMessageEmojis(message);

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
    if (!unreadMessageCount || unreadMessageCount < 9) {
      unreadMessageCountLabel.textContent = ++unreadMessageCount < 9 ? unreadMessageCount : `${unreadMessageCount}+`;
    }
  }

  if (shouldScroll) {
    messages.scrollTop = messages.scrollHeight;
  }
}

function addOrUpdatePlayerListEntry(systemName, name, id) {
  const playerList = document.getElementById("playerList");

  let playerListEntry = document.querySelector(`.playerListEntry[data-id="${id}"]`);

  const nameText = playerListEntry ? playerListEntry.childNodes[0] : document.createElement("span");

  if (!playerListEntry) {
    playerListEntry = document.createElement("div");
    playerListEntry.classList.add("playerListEntry");
    playerListEntry.dataset.id = id;

    nameText.classList.add("nameText");
    playerListEntry.appendChild(nameText);

    playerList.appendChild(playerListEntry);
  }

  if (name || !nameText.innerText) {
    nameText.innerText = name || localizedMessages.playerList.unnamed;
    if (name)
      delete playerListEntry.dataset.unnamed;
    else
      playerListEntry.dataset.unnamed = 'unnamed';
  }

  if (systemName && messages.dataset.useSystemForName) {
    if (gameUiThemes.indexOf(systemName) === -1)
      systemName = getDefaultUiTheme();
    playerListEntry.setAttribute("style", `background-image: url('images/ui/${gameId}/${systemName}/containerbg.png') !important; border-image: url('images/ui/${gameId}/${systemName}/border.png') 8 repeat !important;`);
    nameText.setAttribute("style", `background-image: url('images/ui/${gameId}/${systemName}/font1.png') !important`);
    getFontShadow(systemName, function (shadow) {
      nameText.style.filter = `drop-shadow(1.5px 1.5px ${shadow})`;
    });
  }

  if (playerList.childElementCount > 1) {
    const playerListEntries = document.getElementsByClassName("playerListEntry");

    const entries = [].slice.call(playerListEntries).sort(function (a, b) {
      if (a.dataset.unnamed)
        return b.dataset.unnamed ? 0 : 1;
      else if (b.dataset.unnamed)
        return -1;
      const nameA = a.dataset.id > -1 ? a.innerText : ' ';
      const nameB = b.dataset.id > -1 ? b.innerText : ' ';
      return nameA.localeCompare(nameB);
    });

    entries.forEach(function (ple) {
        playerList.appendChild(ple);
    });
  }
}

function removePlayerListEntry(id) {
  const playerListEntry = document.querySelector(`.playerListEntry[data-id="${id}"]`);
  if (playerListEntry)
    playerListEntry.remove();
}

function clearPlayerList() {
  const playerList = document.getElementById("playerList");
  playerList.innerHTML = "";
}

function chatInputActionFired() {
  const chatInput = document.getElementById("chatInput");
  if (chatInput.value === "") {
    return
  }
  const chatTab = document.querySelector('.chatboxTab[data-tab-section="messages"]');
  if (!chatTab.classList.contains('active'))
    chatTab.click();
  const sysPtr = Module.allocate(Module.intArrayFromString(chatInput.dataset.sys || ''), Module.ALLOC_NORMAL);
  const msgPtr = Module.allocate(Module.intArrayFromString(chatInput.value.trim()), Module.ALLOC_NORMAL);
  Module._SendChatMessageToServer(sysPtr, msgPtr);
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
  document.getElementById("chatInputContainer").style.display = "block";
  playerName = nameInput.value;
  onPlayerConnectedOrUpdated(null, playerName, -1);
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

//called from easyrpg player
function onChatMessageReceived(systemName, msg) {
  chatboxAddMessage(systemName, msg);
}

//called from easyrpg player
function onPlayerConnectedOrUpdated(systemName, name, id) {
  addOrUpdatePlayerListEntry(systemName, name, id);
}

//called from easyrpg player
function onPlayerDisconnected(id) {
  removePlayerListEntry(id);
}