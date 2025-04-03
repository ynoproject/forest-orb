const preventNativeKeys = ['ArrowUp', 'ArrowDown', 'ArrowRight', 'ArrowLeft', ' ', 'F12'];
const keys = new Map();
const keysDown = new Map();
const canvas = document.getElementById('canvas');
const gameContainer = document.getElementById('gameContainer');
let lastTouchedId;

function resetCanvas() {
  return easyrpgPlayer.api.resetCanvas();
}

// Make EasyRPG player embeddable
canvas.addEventListener('mouseenter', () => canvas.focus());
canvas.addEventListener('click', () => canvas.focus());
canvas.addEventListener('webglcontextrestored', async () => {
  for (let tries = 0; tries < 5; tries++) {
    try {
      if (resetCanvas()) return;
    } catch (err) {
      console.warn(err);
    }
    await new Promise(resolve => setTimeout(resolve, Math.pow(2, tries) * 200));
  }
  alert('Failed to restore WebGL context after 5 attempts. The page needs to be refreshed.');
});

// Handle clicking on the fullscreen button
document.getElementById('controls-fullscreen').addEventListener('click', () => {
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
  onResize();
});

{
  const layout = document.getElementById('layout');
  if (!(layout.requestFullscreen || layout.webkitRequestFullscreen) || inWebview) {
    document.getElementById('controls-fullscreen').classList.add('hidden');
  }
}

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
    if (event.cancelable)
      event.preventDefault();
    simulateKeyboardEvent('keydown', key, keyCode);
    keysDown.set(event.target.id, node.id);
    node.classList.add('active');
  });

  node.addEventListener('touchend', event => {
    if (event.cancelable)
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
const haveEvents = 'ongamepadconnected' in window;

function addGamepad(gamepad) {
  if (gamepad == undefined)
    return;
  gamepads[gamepad.index] = gamepad;
  updateTouchControlsVisibility();
}

function removeGamepad(gamepad) {
  if (gamepad == undefined)
    return;
  delete gamepads[gamepad.index];
  updateTouchControlsVisibility();
}

/** @returns {Gamepad[]} */
function getGamepads() {
  return navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
}

function scanGamePads() {
  const pads = getGamepads();
  for (let i = 0; i < pads.length; i++) {
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

  // Setup for the floating controls
  // These controls are only available in landscape fullscreen mode.
  /** @type {Touch} */
  let anchor;
  /** @type {Touch} */
  let compass;
  let lastDirection;

  const directions = [
    { key: 'ArrowUp', code: 38, button: document.getElementById('joystickUp') },
    { key: 'ArrowRight', code: 39, button: document.getElementById('joystickRight') },
    { key: 'ArrowDown', code: 40, button: document.getElementById('joystickDown') },
    { key: 'ArrowLeft', code: 37, button: document.getElementById('joystickLeft') },
  ];
  const joystick = document.getElementById('joystick');
  /** @type {SVGCircleElement} */
  const insetCircle = document.getElementById('insetCircle');
  const joystickCircle = document.getElementById('joystickCircle');
  const dpadCircle = document.getElementById('dpadCircle');
  const canvasContainer = document.getElementById('canvasContainer');
  const extent = 10;
  const deadzone = 0.5;
  canvasContainer.addEventListener('touchstart', ev => {
    if (ev.targetTouches.length !== 1 || !document.fullscreenElement) return;
    canvas.focus();

    let radius;
    switch (availableControlType) {
      case 'joystick': radius = joystickCircle.getBoundingClientRect().width / 2; break;
      case 'dpad': radius = dpadCircle.getBoundingClientRect().width / 2; break;
      case 'default':
      default:
        return;
    }
    joystick.classList.remove('fadeOut');
    anchor = ev.targetTouches[0];

    joystick.style.top = `${anchor.clientY - radius}px`;
    joystick.style.left = `${anchor.clientX - radius}px`;
    requestAnimationFrame(function driveControls() {
      let direction;
      if (direction = directions[lastDirection])
        simulateKeyboardEvent('keyup', direction.key, direction.code);
      
      if (anchor && compass) {
        let dx = compass.clientX - anchor.clientX;
        let dy = compass.clientY - anchor.clientY;

        const angle = Math.atan2(dy, dx);
        let deg = angle * (180 / Math.PI);
        // 90 degrees to counteract the top-left origin
        deg = (deg + 360 + 90) % 360;

        if (deg >= 315 || deg < 45) {
          lastDirection = 0;
        } else if (deg >= 45 && deg < 135) {
          lastDirection = 1;
        } else if (deg >= 135 && deg < 225) {
          lastDirection = 2;
        } else if (deg >= 225 && deg < 315) {
          lastDirection = 3;
        }
        if (Math.sqrt(dx * dx + dy * dy) >= deadzone && (direction = directions[lastDirection])) { 
          simulateKeyboardEvent('keydown', direction.key, direction.code);

          // Process visual changes for the controls
          switch (availableControlType) {
            case 'dpad':
              for (const { button } of Object.values(directions))
                button.classList.remove('active');
              direction.button.classList.add('active');
              break;
            case 'joystick': {
              dx = Math.max(Math.min(dx, extent), -extent);
              dy = Math.max(Math.min(dy, extent), -extent);
              const magnitude = Math.sqrt(dx * dx + dy * dy);
              if (magnitude > extent) {
                const scale = extent / magnitude;
                dx *= scale;
                dy *= scale;
              }
              insetCircle.setAttribute('cx', 25 + dx);
              insetCircle.setAttribute('cy', 25 + dy);
              break;
            }
          }
        }
      } else if (!anchor) return;
      requestAnimationFrame(driveControls);
    });
  });

  canvasContainer.addEventListener('touchmove', ev => {
    if (!anchor && ev.targetTouches.length) {
      anchor = ev.targetTouches[0];
      return;
    }
    compass = ev.targetTouches[0];
  });

  canvasContainer.addEventListener('touchend', () => {
    anchor = compass = undefined;
    joystick.classList.add('fadeOut');
    switch (availableControlType) {
      case 'joystick':
        insetCircle.setAttribute('cx', 25);
        insetCircle.setAttribute('cy', 25);
        break;
      case 'dpad':
        for (const { button } of Object.values(directions))
          button.classList.remove('active');
        break;
    }
  });
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
    } else {
      const keyLc = event.key.toLowerCase();
      if (globalConfig.gameChat && (keyLc === 't' || keyLc === 'm'
        || (keyLc === 'g' && globalConfig.gameChatGlobal)
        || (keyLc === 'p' && globalConfig.gameChatParty && joinedPartyId))) {
        const gameChatInput = document.getElementById('gameChatInput');
        switch (keyLc) {
          case 'm':
            setGameChatMode(0);
            break;
          case 'g':
            setGameChatMode(1);
            break;
          case 'p':
            setGameChatMode(2);
            break;
        }
        setTimeout(() => {
          gameChatInput.onfocus();
          gameChatInput.focus();
        }, 0);
      }
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
