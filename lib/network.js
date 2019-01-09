module.exports = function network(bus, log, Network, ignoreResourceErrors) {
  const requests = {};
  const mochaReceived = false;

  Network.requestWillBeSent((data) => {
    requests[data.requestId] = data.request;
  });

  Network.responseReceived(async (data) => {
    if (!mochaReceived) {
      if (data.response.url.match(/mocha\.js$/i)) {
        bus.emit('ready');
      }
    }
  });

  Network.loadingFailed((info) => {
    const request = requests[info.requestId];
    const { url, method } = request;
    const data = { url, method, reason: info.errorText };
    if (!ignoreResourceErrors) {
      log.error('Resource Failed to Load:', data);
    }
    bus.emit('resourceFailed', data);
  });
};
