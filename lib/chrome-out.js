'use strict';

const unmirror = require('chrome-unmirror');

/*
 * Pipes chrome console messages to stdout
 */
module.exports = function chromeOut (log, options, Runtime) {
  Runtime.exceptionThrown((exception) => {
    if (!options.ignoreExceptions) {
      log.error('[chrome-exception]', exception);
    }
  });

  Runtime.consoleAPICalled(({type, args}) => {
    if (options.ignoreConsole) {
      return;
    }

    if (type === 'warning') {
      type = 'warn';
    }

    const data = []; // `[chrome-${type}]`
    const unknownTypes = [
      'assert',
      'clear',
      'count',
      'dir',
      'dirxmnl',
      'endGroup',
      'profile',
      'profileEnd',
      'startGroup',
      'startGroupCollapsed',
      'table',
      'timeEnd',
      'trace'
    ];

    for (let arg of args) {
      if (arg.type === 'string') {
        let value = arg.value;
        if ('win32' == process.platform) {
          value = value.replace("âœ“", '\u221A');
          value = value.replace("✓", '\u221A');
        }
        else {
          value = value.replace("âœ“", '\u2713');
        }
        data.push(value);
      }
      else {
        data.push(unmirror(arg));
      }
    }

    if (unknownTypes.includes(type)) {
      type = 'log';
    }

    console[type].apply(this, data);
  });

};
