'use strict';

const unmirror = require('chrome-unmirror');

/*
 * Pipes chrome console messages to stdout
 */
module.exports = function chromeOut (log, Runtime) {

  Runtime.exceptionThrown((exception) => {
    log.error('[chrome-exception]', exception);
  });

  Runtime.consoleAPICalled(({type, args}) => {
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
        data.push(arg.value);
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
