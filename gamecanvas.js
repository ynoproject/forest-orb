if (typeof ENV !== 'undefined')
  ENV.SDL_EMSCRIPTEN_KEYBOARD_ELEMENT = '#canvas';

if (Module.postRun) {
  Module.postRun.push(() => {
    Module.INITIALIZED = true;
    document.getElementById('loadingOverlay').classList.add('loaded');
  });
  Module.postRun.push(onResize);
}

const preventNativeKeys = ['ArrowUp', 'ArrowDown', 'ArrowRight', 'ArrowLeft', ' ', 'F12'];
const keys = new Map();
const keysDown = new Map();
const canvas = document.getElementById('canvas');
const gameContainer = document.getElementById('gameContainer');
let lastTouchedId;

// Make EasyRPG player embeddable
gameContainer.addEventListener('mouseenter', () => canvas.focus());
gameContainer.addEventListener('click', () => canvas.focus());

// Handle clicking on the fullscreen button
document.querySelector('#controls-fullscreen').addEventListener('click', () => {
  const layout = document.getElementById('layout');
  if (layout.requestFullscreen) {
    if (!document.fullscreenElement) {
      layout.requestFullscreen();
      setFullscreenControlsHideTimer();
    } else
      document.exitFullscreen();
  } else if (layout.webkitRequestFullscreen) {
    if (!document.webkitFullscreenElement) {
      layout.webkitRequestFullscreen();
      setFullscreenControlsHideTimer();
    } else
      document.webkitExitFullscreen();
  }
});

/**
 * Simulate a keyboard event on the emscripten canvas
 *
 * @param {string} eventType Type of the keyboard event
 * @param {string} key Key to simulate
 * @param {number} keyCode Key code to simulate (deprecated)
 */
function simulateKeyboardEvent(eventType, key, keyCode) {
  const event = new Event(eventType, { bubbles: true });
  event.key = key;
  event.code = key;
  // Deprecated, but necessary for emscripten somehow
  event.keyCode = keyCode;
  event.which = keyCode;

  canvas.dispatchEvent(event);
}

/**
 * Simulate a keyboard input from `keydown` to `keyup`
 *
 * @param {string} key Key to simulate
 * @param {number} keyCode Key code to simulate (deprecated)
 */
function simulateKeyboardInput(key, keyCode) {
  simulateKeyboardEvent('keydown', key, keyCode);
  window.setTimeout(() => {
    simulateKeyboardEvent('keyup', key, keyCode);
  }, 100);
}

/**
 * Bind a node by a specific key to simulate on touch
 *
 * @param {*} node The node to bind a key to
 * @param {string} key Key to simulate
 * @param {number} keyCode Key code to simulate (deprecated)
 */
function bindKey(node, key, keyCode) {
  keys.set(node.id, { key, keyCode });

  node.addEventListener('touchstart', event => {
    event.preventDefault();
    simulateKeyboardEvent('keydown', key, keyCode);
    keysDown.set(event.target.id, node.id);
    node.classList.add('active');
  });

  node.addEventListener('touchend', event => {
    event.preventDefault();

    const pressedKey = keysDown.get(event.target.id);
    if (pressedKey && keys.has(pressedKey)) {
      const { key, keyCode } = keys.get(pressedKey);
      simulateKeyboardEvent('keyup', key, keyCode);
    }

    keysDown.delete(event.target.id);
    node.classList.remove('active');
  
    if (lastTouchedId) {
      document.getElementById(lastTouchedId).classList.remove('active');
    }
  });

  // Inspired by https://github.com/pulsejet/mkxp-web/blob/262a2254b684567311c9f0e135ee29f6e8c3613e/extra/js/dpad.js
  node.addEventListener('touchmove', event => {
    const { target, clientX, clientY } = event.changedTouches[0];
    const origTargetId = keysDown.get(target.id);
    const nextTargetId = document.elementFromPoint(clientX, clientY).id;
    if (origTargetId === nextTargetId) return;

    if (origTargetId) {
      const { key, keyCode } = keys.get(origTargetId);
      simulateKeyboardEvent('keyup', key, keyCode);
      keysDown.delete(target.id);
      document.getElementById(origTargetId).classList.remove('active');
    }

    if (keys.has(nextTargetId)) {
      const { key, keyCode } = keys.get(nextTargetId);
      simulateKeyboardEvent('keydown', key, keyCode);
      keysDown.set(target.id, nextTargetId);
      lastTouchedId = nextTargetId;
      document.getElementById(nextTargetId).classList.add('active');
    }
  })
}

/** @type {{[key: number]: Gamepad}} */
const gamepads = {};
const haveEvents = 'ongamepadonnected' in window;

function addGamepad(gamepad) {
  gamepads[gamepad.index] = gamepad;
  updateTouchControlsVisibility();
}

function removeGamepad(gamepad) {
  delete gamepads[gamepad.index];
  updateTouchControlsVisibility();
}

/** @returns {Gamepad[]} */
function getGamepads() {
  var pads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
  return pads;
}

function scanGamePads() {
  var pads = getGamepads();
  for (var i = 0; i < pads.length; i++) {
    if (pads[i]) {
      if (pads[i].index in gamepads)
        gamepads[pads[i].index] = pads[i];
      else
        addGamepad(pads[i]);
    }
  }
}

if (!haveEvents) {
  setInterval(scanGamePads, 500);
}

window.addEventListener('gamepadconnected', e => addGamepad(e.gamepad));

window.addEventListener('gamepaddisconnected', e => removeGamepad(e.gamepad));

function updateTouchControlsVisibility() {
  if (hasTouchscreen && !Object.keys(gamepads).length) {
    for (const elem of document.querySelectorAll('#dpad, #apad'))
      elem.style.display = '';
  } else {
    // If we don't have a touch screen, OR any gamepads are connected...
    for (const elem of document.querySelectorAll('#dpad, #apad'))
      elem.style.display = 'none'; // Hide the touch controls
  }
}

// Bind all elements providing a `data-key` attribute with the
// given key on touch-based devices
if (hasTouchscreen) {
  for (const button of document.querySelectorAll('[data-key]'))
    bindKey(button, button.dataset.key, button.dataset.keyCode);
} else {
  // Prevent scrolling when pressing specific keys
  canvas.addEventListener('keydown', event => {
    if (preventNativeKeys.includes(event.key))
      event.preventDefault();
    else if (globalConfig.tabToChat && event.key === 'Tab') {
      event.preventDefault();
      const chatInput = document.getElementById('chatInput');
      let input;
      if (chatInput.offsetWidth)
        input = chatInput;
      else {
        const nameInput = document.getElementById('nameInput');
        if (nameInput.offsetWidth)
          input = nameInput;
      }
      if (input)
        window.setTimeout(() => input.focus(), 0);
    }
  });

  const onTabInput = event => {
    if (globalConfig.tabToChat && event.key === 'Tab') {
      event.preventDefault();
      canvas.focus();
    }
  };

  document.getElementById('chatInput').addEventListener('keydown', onTabInput);
  document.getElementById('nameInput').addEventListener('keydown', onTabInput);

  canvas.addEventListener('contextmenu', event => {
    event.preventDefault();
  });
}

updateTouchControlsVisibility();

if (typeof ENV === 'undefined')
  document.getElementById('loadingOverlay').classList.add('loaded');