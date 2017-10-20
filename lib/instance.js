'use strict';

const chromeLauncher = require('chrome-launcher');

module.exports = function createInstance (log, options) {
  let flags = [
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
    chromeFlags: [...new Set(flags)],
    logLevel: options.logLevel
  };

  return new Promise((resolve, reject) => {
    chromeLauncher.launch(opts)
      .then((instance) => {
        log.info('Chrome Instance launched');
        resolve(instance);
      })
      .catch((e) => {
        reject(e);
      });
  });
};
