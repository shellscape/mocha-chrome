'use strict';

const chromeLauncher = require('chrome-launcher');
const deepAssign = require('deep-assign');

module.exports = async function createInstance (log, options) {
  let instance,
    flags = [
      '--disable-background-timer-throttling',
      '--disable-default-apps',
      '--disable-device-discovery-notifications',
      '--disable-gpu',
      '--disable-popup-blocking',
      '--disable-renderer-backgrounding',
      '--disable-translate',
      '--headless',
      '--no-default-browser-check',
      '--no-first-run'
    ].concat(options.chromeFlags || []);

  const opts = {
    chromeFlags: [ ...new Set(flags) ],
    logLevel: options.logLevel
  };

  instance = await chromeLauncher.launch(opts);

  log.info('Chrome Instance launched');

  return instance;
};
