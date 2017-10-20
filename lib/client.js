'use strict';

const CDP = require('chrome-remote-interface');
const fs = require('fs');
const path = require('path');

module.exports = connectClient;

function connectClient (instance, log, options) {

  function fetch (fileName) {
    const filePath = path.join(__dirname, '../client', fileName);
    return fs.readFileSync(filePath, 'utf-8');
  }

  return new Promise((resolve, reject) => {
    CDP({port: instance.port}).then((client) => {
      const {DOM, DOMStorage, Console, Network, Page, Runtime} = client;
      const mochaOptions = `window.mochaOptions = ${JSON.stringify(options.mocha)}`;

      Promise
        .all([
          DOM.enable(),
          DOMStorage.enable(),
          Network.enable(),
          Page.enable(),
          Runtime.enable(),
          Console.enable()
        ])
        .then(() => {
          log.info('CDP Client Connected');

          return Promise.all([
            Page.addScriptToEvaluateOnLoad({scriptSource: mochaOptions}),
            Page.addScriptToEvaluateOnLoad({scriptSource: fetch('event-bus.js')}),
            Page.addScriptToEvaluateOnLoad({scriptSource: fetch('shim.js')})
          ]);
        })
        .then(() => {
          resolve(client);
        })
        .catch((e) => {
          reject(e);
        });
    });
  });
}
