/* eslint-disable global-require */
if (/v6|v4/.test(process.version)) {
  require('@babel/register')({
    ignore: [/node_modules\/(?!mocha-chrome|chrome-launcher|lighthouse-logger)/]
  });
  require('@babel/polyfill');
}

require('./api');
require('./cli');
