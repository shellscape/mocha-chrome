#!/usr/bin/env node

const debug = require('debug')('mocha-chrome');
const importLocal = require('import-local');

// Prefer the local installation of AVA
if (importLocal(__filename)) {
  debug('Using local install of mocha-chrome');
} else {
  // eslint-disable-next-line global-require
  require('./lib/cli');
}
