'use strict';

module.exports = function network (bus, log, Network) {

  const requests = {};
  let mochaReceived = false;

  Network.requestWillBeSent(data => {
    requests[data.requestId] = data.request;
  });

  Network.responseReceived(async data => {
    if (!mochaReceived) {
      if (data.response.url.match(/mocha\.js$/i)) {
        bus.emit('ready');
      }
    }
  });

  Network.loadingFailed(info => {
    const request = requests[info.requestId];
    const { url, method } = request;
    const data = { url, method, reason: info.errorText };
    log.error('Resource Failed to Load:', data);
    bus.emit('resourceFailed', data);
  });

};
