#!/usr/bin/env node

/* eslint-disable global-require */

const debug = require('debug')('mocha-chrome');
const importLocal = require('import-local');

// Prefer the local installation of AVA
if (importLocal(__filename)) {
  debug('Using local install of mocha-chrome');
} else {
  // feel pity for folks whose sad IT departments keep them in the dark ages
  // here's to you, node v6 hermits 🍻
  if (process.argv.indexOf('--old-and-busted') >= 0) {
    require('@babel/register')({
      ignore: [/node_modules\/(?!mocha-chrome|chrome-launcher|lighthouse-logger)/]
    });
    require('@babel/polyfill');
  }

  require('./lib/cli');
}
