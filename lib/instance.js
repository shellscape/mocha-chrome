const chromeLauncher = require('chrome-launcher');

module.exports = async function createInstance(log, options) {
  const flags = [
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

  const opts = Object.assign({}, options.chromeLauncher, {
    chromeFlags: [...new Set(flags)],
    logLevel: options.logLevel
  });

  const instance = await chromeLauncher.launch(opts);

  log.info('Chrome Instance launched');

  return instance;
};
