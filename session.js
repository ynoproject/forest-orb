let sessionWs;

const wsDelim = '\uffff';
let sessionCommandHandlers = {};
let sessionCommandCallbackQueue = {};

let hasConnected;

function initSessionWs(attempt) {
  return new Promise(resolve => {
    if (sessionWs)
      closeSessionWs();
    if (config.singlePlayer) {
      resolve();
      return;
    }
    let url = `wss://connect.ynoproject.net/${ynoGameId}/session`;
    sessionWs = new WebSocket(url);
    sessionWs.onclose = e => {
      if (e.code === 1028)
        return;
      if (!attempt)
        attempt = 1;
      const delay = Math.min(attempt * 5000, 30000);
      setTimeout(() => initSessionWs(attempt + 1).then(() => resolve()), delay);
    };
    sessionWs.onopen = () => {
      sessionWs.onclose = e => {
        if (e.code === 1028)
          return;
        setTimeout(() => initSessionWs(1), 5000);
      };
      easyrpgPlayer.api.sessionReady();
      if (config.privateMode)
        sendSessionCommand('pr', [ config.singleplayerMode ? 2 : 1 ]);
      if (config.hideLocation)
        sendSessionCommand('hl', [ 1 ]);
      if (config.hideUnnamedPlayers)
        sendSessionCommand('hunp', [ config.hideUnnamedPlayers ? 1 : 0 ]);
      if (!hasConnected) {
        syncChatHistory()
          .catch(err => console.error(err))
          .finally(addChatTip);
        hasConnected = true;
      } else
        syncChatHistory()
          .catch(err => console.error(err));
      resolve();
    };
    sessionWs.onmessage = event => {
      const args = event.data.split(wsDelim);
      const command = args[0];
      if (command in sessionCommandHandlers) {
        const params = args.slice(1);
        if (sessionCommandHandlers[command])
          sessionCommandHandlers[command](params);
        while (sessionCommandCallbackQueue[command].length)
          sessionCommandCallbackQueue[command].shift()(params);
      }
    };
  });
}

function closeSessionWs() {
  if (!sessionWs)
    return;
  sessionWs.onclose = null;
  sessionWs.close();
  sessionWs = null;
}

function addSessionCommandHandler(command, handler) {
  sessionCommandHandlers[command] = handler;
  sessionCommandCallbackQueue[command] = [];
}

function sendSessionCommand(command, commandParams, callbackFunc, callbackCommand) {
  if (!sessionWs)
    return;

  let args = [ command ];
  if (commandParams?.length)
    args = args.concat(commandParams);

  if (callbackFunc) {
    if (!callbackCommand)
      callbackCommand = command;
    if (sessionCommandCallbackQueue.hasOwnProperty(callbackCommand))
      sessionCommandCallbackQueue[callbackCommand].push(callbackFunc);
  }

  sessionWs.send(args.join(wsDelim));
}
