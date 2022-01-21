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

  if (shouldScroll) {
    messages.scrollTop = messages.scrollHeight;
  }
}

function chatInputActionFired() {
  const chatInput = document.getElementById("chatInput");
  if (chatInput.value === "") {
    return
  }
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
  if (!(/^[A-Za-z0-9]+$/.test(nameInput.value))) return;
  document.getElementById("enterNameContainer").style.display = "none";
  document.getElementById("chatInput").disabled = false;
  document.getElementById("chatInputContainer").style.display = "block";
  ptr = Module.allocate(Module.intArrayFromString(nameInput.value), Module.ALLOC_NORMAL);
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