Module['onRuntimeInitialized'] = ChatInit
ENV.SDL_EMSCRIPTEN_KEYBOARD_ELEMENT = "#canvas"

function chatboxAddMessage(msg) {
  messages = document.getElementById("messages")
  
  scroll = (messages.scrollHeight - messages.scrollTop === messages.clientHeight)

  msgContainer = document.createElement("div")
  msgContainer.classList.add("messageContainer")
  
  message = document.createElement("span")
  message.classList.add("message")
  
  message.appendChild(document.createTextNode(msg))
  msgContainer.appendChild(message)
  messages.appendChild(msgContainer)

  if (scroll) {
    messages.scrollTop = messages.scrollHeight
  }
}

function chatInputActionFired() {
  if (chatInput.value === "") {
    return
  }
  chatInput = document.getElementById("chatInput")
  ptr = Module.allocate(Module.intArrayFromString(chatInput.value), Module.ALLOC_NORMAL)
  Module._SendChatMessageToServer(ptr)
  Module._free(ptr)
  chatInput.value = ""
}

function chatNameCheck() {
  if (nameInput.value == "") return;
  if (!(/^[A-Za-z0-9]+$/.test(nameInput.value))) return;
  document.getElementById("enterNameContainer").style.display = 'none';
  document.getElementById("messages").classList.add("expanded");
  document.getElementById("chatInput").disabled = false;
  nameInput = document.getElementById("nameInput")
  ptr = Module.allocate(Module.intArrayFromString(nameInput.value), Module.ALLOC_NORMAL)
  Module._ChangeName(ptr)
  Module._free(ptr)
  nameInput.value = ""
}

function ChatInit() {
  document.getElementById("chatbox").style.display = 'block'
}

//called from easyrpg player
function GotChatMsg(msg) {
  chatboxAddMessage(msg)
}