#!/usr/bin/env node

import { fileURLToPath } from 'url'

import importLocal from 'import-local'

import debug from 'debug'

import { run } from './lib/cli.js'

const nsDebug = debug('mocha-chrome')

const __filename = fileURLToPath(import.meta.url)

// Prefer the local installation of AVA
if (importLocal(__filename)) {
  nsDebug('Using local install of mocha-chrome')
} else {
  // eslint-disable-next-line global-require
  run()
}
