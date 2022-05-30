let sessionWs;

const wsDelim = '\uffff';
let sessionCommandHandlers = {};
let sessionCommandCallbackQueue = {};

function initSessionWs() {
  let url = `wss://${location.host}/connect/${gameId}/session`;
  if (loginToken)
    url += `?token=${loginToken}`;
  if (sessionWs)
    sessionWs.close();
  sessionWs = new WebSocket(url);
  sessionWs.onmessage = function (event) {
    const args = event.data.split(wsDelim);
    const command = args[0];
    if (sessionCommandHandlers.hasOwnProperty(command)) {
      const params = args.slice(1);
      sessionCommandHandlers[command](params);
      while (sessionCommandCallbackQueue[command].length)
        sessionCommandCallbackQueue[command].shift()(params);
    }
  };
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