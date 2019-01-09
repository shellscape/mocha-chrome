const unmirror = require('chrome-unmirror');

/*
 * Pipes chrome console messages to stdout
 */
module.exports = function chromeOut(log, options, Runtime) {
  Runtime.exceptionThrown((exception) => {
    if (!options.ignoreExceptions) {
      log.error('[chrome-exception]', exception);
    }
  });

  Runtime.consoleAPICalled(({ type, args }) => {
    if (options.ignoreConsole) {
      return;
    }

    if (type === 'warning') {
      // eslint-disable-next-line no-param-reassign
      type = 'warn';
    }

    // `[chrome-${type}]`
    const data = [];
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

    for (const arg of args) {
      if (arg.type === 'string') {
        data.push(arg.value);
      } else {
        data.push(unmirror(arg));
      }
    }

    if (unknownTypes.includes(type)) {
      // eslint-disable-next-line no-param-reassign
      type = 'log';
    }

    // eslint-disable-next-line no-console
    console[type].apply(this, data);
  });
};
