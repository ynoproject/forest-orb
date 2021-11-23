Module['onRuntimeInitialized'] = initChat;
ENV.SDL_EMSCRIPTEN_KEYBOARD_ELEMENT = "#canvas";

function chatboxAddMessage(msg) {
  const messages = document.getElementById("messages");
  
  const scroll = (messages.scrollHeight - messages.scrollTop === messages.clientHeight);

  const msgContainer = document.createElement("div");
  msgContainer.classList.add("messageContainer");
  
  const message = document.createElement("span");
  message.classList.add("message");
  
  message.appendChild(document.createTextNode(msg));
  msgContainer.appendChild(message);
  messages.appendChild(msgContainer);

  if (scroll) {
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
  document.getElementById("messages").classList.add("expanded");
  document.getElementById("chatInput").disabled = false;
  document.getElementById("chatInputContainer").style.display = "block";
  ptr = Module.allocate(Module.intArrayFromString(nameInput.value), Module.ALLOC_NORMAL);
  Module._ChangeName(ptr);
  Module._free(ptr);
  nameInput.value = "";
}

function initChat() {
  document.getElementById("chatbox").style.display = "table-cell";
}

//called from easyrpg player
function GotChatMsg(msg) {
  chatboxAddMessage(msg);
}