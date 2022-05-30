let sessionWs;

const wsDelim = '\uffff';
let sessionCommandHandlers = {};
let sessionCommandCallbackQueue = {};

function initSessionWs(attempt) {
  return new Promise(resolve => {
    let url = `wss://${location.host}/connect/${ynoGameId}/session`;
    if (loginToken)
      url += `?token=${loginToken}`;
    if (sessionWs)
      closeSession(sessionWs);
    sessionWs = new WebSocket(url);
    sessionWs.onclose = () => {
      if (!attempt)
        attempt = 1;
      const delay = Math.min(attempt * 5000, 30000);
      setTimeout(() => initSessionWs(attempt + 1).then(() => resolve()), delay);
    };
    sessionWs.onopen = () => {
      sessionWs.onclose = () => {
        setTimeout(() => initSessionWs(1), 5000);
      };
      resolve();
    };
    sessionWs.onmessage = event => {
      const args = event.data.split(wsDelim);
      const command = args[0];
      if (sessionCommandHandlers.hasOwnProperty(command)) {
        const params = args.slice(1);
        sessionCommandHandlers[command](params);
        while (sessionCommandCallbackQueue[command].length)
          sessionCommandCallbackQueue[command].shift()(params);
      }
    };
  });
}

function closeSession() {
  if (sessionWs) {
    sessionWs.onclose = null;
    sessionWs.close();
    sessionWs = null;
  }
}

function addSessionCommandHandler(command, handler) {
  sessionCommandHandlers[command] = handler;
  sessionCommandCallbackQueue[command] = [];
}

function sendSessionCommand(command, commandParams, callbackCommand, callbackFunc) {
  if (!sessionWs)
    return;

  let args = [ command ];
  if (commandParams?.length)
    args = args.concat(commandParams);

  if (callbackCommand && callbackFunc && sessionCommandCallbackQueue.hasOwnProperty(callbackCommand))
    sessionCommandCallbackQueue[callbackCommand].push(callbackFunc);

  sessionWs.send(args.join(wsDelim));
}