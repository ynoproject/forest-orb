Module['onRuntimeInitialized'] = initChat;
ENV.SDL_EMSCRIPTEN_KEYBOARD_ELEMENT = "#canvas";

function chatboxAddMessage(msg) {
  const messages = document.getElementById("messages");
  
  const shouldScroll = Math.abs((messages.scrollHeight - messages.scrollTop) - messages.clientHeight) <= 20;

  const msgContainer = document.createElement("div");
  msgContainer.classList.add("messageContainer");
  
  const message = document.createElement("span");
  message.classList.add("message");
  
  populateMessageNodes(parseMessageTextForMarkdown(msg), message);

  msgContainer.appendChild(message);
  messages.appendChild(msgContainer);

  if (shouldScroll) {
    messages.scrollTop = messages.scrollHeight;
  }
}

function chatInputActionFired() {
  const chatInput = document.getElementById("chatInput")
  if (chatInput.value === "") {
    return
  }
  const ptr = Module.allocate(Module.intArrayFromString(chatInput.value), Module.ALLOC_NORMAL);
  Module._SendChatMessageToServer(ptr);
  Module._free(ptr);
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
    { p: /\*\*(.*?)\*\*/ig, r: '<b>$1</b>' },
    { p: /\*(.*?)\*/ig, r: '<i>$1</i>' },
    { p: /\_\_(.*?)\_\_/ig, r: '<u>$1</u>' },
    { p: /\_(.*?)\_/ig, r: '<i>$1</i>' },
    { p: /\~\~(.*?)\~\~/ig, r: '<s>$1</s>' },
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

//called from easyrpg player
function GotChatMsg(msg) {
  chatboxAddMessage(msg);
}