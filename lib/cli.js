#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const chalk = require('chalk');
const meow = require('meow');

const MochaChrome = require('../');

const cli = meow(chalk`{underline Usage}
  $ mocha-chrome <file.html> [options]


{underline Options}
  --chrome-flags              A JSON string representing an array of flags to pass to Chrome
  --chrome-launch.xxx=yyy     Options for chrome launcher except for chromeFlags and logLevel (see https://github.com/GoogleChrome/chrome-launcher#launchopts)
  --ignore-console            Suppress console logging
  --ignore-exceptions         Suppress exceptions logging
  --ignore-resource-errors    Suppress resource error logging
  --log-level                 Specify a log level; trace, debug, info, warn, error
  --mocha                     A JSON string representing a config object to pass to Mocha
  --no-colors                 Disable colors in Mocha's output
  --reporter                  Specify the Mocha reporter to use
  --timeout                   Specify the test startup timeout to use
  --version


{underline Examples}
  $ mocha-chrome test.html --no-colors
  $ mocha-chrome test.html --reporter dot
  $ mocha-chrome test.html --mocha '\{"ui":"tdd"\}'
  $ mocha-chrome test.html --chrome-flags '["--some-flag", "--and-another-one"]'
`);

if (
  !cli.input.length &&
  (!Object.getOwnPropertyNames(cli.flags).length || cli.flags.oldAndBusted)
) {
  cli.showHelp();
}

const [file] = cli.input;
const { flags } = cli;
const { log } = console;

let url = file;
let code = 0;

function fail(message) {
  log(message);
  process.exit(1);
}

if (!file && !file.length) {
  fail('You must specify a file to run');
}

if (!/^(file|http(s?)):\/\//.test(file)) {
  if (!fs.existsSync(file)) {
    url = `file://${path.resolve(path.join(process.cwd(), file))}`;
  }

  if (!fs.existsSync(file)) {
    fail('You must specify an existing file.');
  }

  url = `file://${fs.realpathSync(file)}`;
}

const useColors = !!flags.colors;
const reporter = flags.reporter || 'spec';
const mocha = Object.assign(JSON.parse(flags.mocha || '{}'), { useColors, reporter });
const chromeFlags = JSON.parse(flags.chromeFlags || '[]');
const { logLevel, ignoreExceptions, ignoreConsole, ignoreResourceErrors } = flags;
const loadTimeout = flags.timeout;
const options = {
  chromeFlags,
  chromeLaunch: flags.chromeLaunch || {},
  ignoreExceptions,
  ignoreConsole,
  ignoreResourceErrors,
  logLevel,
  mocha,
  url,
  loadTimeout
};
const runner = new MochaChrome(options);

runner.on('ended', (stats) => {
  code = stats.failures;
});

runner.on('failure', (/* message */) => {
  code = 1;
});

runner.on('exit', () => process.exit(code));

(async function run() {
  await runner.connect();
  await runner.run();
})();
