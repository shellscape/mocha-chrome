'use strict';

const CDP = require('chrome-remote-interface');
const fs = require('fs');
const path = require('path');

module.exports = async function connectClient (instance, log, options) {

  function fetch (fileName) {
    const filePath = path.join(__dirname, '../client', fileName);
    return fs.readFileSync(filePath, 'utf-8');
  }

  const client = await CDP({port: instance.port});
  const { DOM, DOMStorage, Console, Network, Page, Runtime } = client;
  const mochaOptions = `window.mochaOptions = ${JSON.stringify(options.mocha)}`;

  await Promise.all([
    DOM.enable(),
    DOMStorage.enable(),
    Network.enable(),
    Page.enable(),
    Runtime.enable(),
    Console.enable()
  ]);

  log.info('CDP Client Connected');

  await Page.addScriptToEvaluateOnLoad({ scriptSource: mochaOptions });
  await Page.addScriptToEvaluateOnLoad({ scriptSource: fetch('event-bus.js') });
  await Page.addScriptToEvaluateOnLoad({ scriptSource: fetch('shim.js') });

  return client;
};
