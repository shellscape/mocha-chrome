(function (){
  'use strict';

  Object.defineProperty(window, 'mocha', {
    get () {
      return undefined;
    },
    set (m) {
      shimMocha(m);
      delete window.mocha;
      window.mocha = m;

      // mochaOptions is injected in lib/client.js

      mochaOptions = mochaOptions || {
        ui: 'bdd',
        reporter: 'spec',
        useColors: true
      };

      mocha.setup(mochaOptions);
    },
    configurable: true
  });

  Object.defineProperty(window, 'Mocha', {
    get () {
      return undefined;
    },
    set (m) {
      delete window.Mocha;
      window.Mocha = m;

      m.process.stdout._write = function (chunks, encoding, cb) {
        var output = chunks.toString ? chunks.toString() : chunks;

        window._eventbus.emit('mocha', output);

        m.process.nextTick(cb);
      };

      window._eventbus.emit('width');
    },
    configurable: true
  });

  function shimMocha (m) {
    var origRun = m.run, origUi = m.ui;

    m.ui = function () {
      var retval = origUi.apply(mocha, arguments);
      m.reporter = () => {};
      return retval;
    };
    m.run = function () {
      window._eventbus.emit('started', m.suite.suites.length);

      m.runner = origRun.apply(mocha, arguments);
      if (m.runner.stats && m.runner.stats.end) {
        window._eventbus.emit('ended', m.runner.stats);
      }
      else {
        m.runner.on('end', () => {
          window._eventbus.emit('ended', m.runner.stats);
        });
      }
      return m.runner;
    };
  }

  // Mocha needs the formating feature of console.log so copy node's format function and
  // monkey-patch it into place. This code is copied from node's, links copyright applies.
  // https://github.com/joyent/node/blob/master/lib/util.js
  if (!console.format) {
    let origError = console.error,
      origLog = console.log;

    console.format = function (f) {
      if (typeof f !== 'string') {
        return Array.prototype.map.call(arguments, (arg) => {
          try {
            return JSON.stringify(arg);
          }
          catch (_) {
            return '[Circular]';
          }
        }).join(' ');
      }
      var i = 1,
        args = arguments,
        len = args.length,
        str = String(f).replace(/%[sdj%]/g, (x) => {
          if (x === '%%') return '%';
          if (i >= len) return x;
          switch (x) {
            case '%s': return String(args[i++]);
            case '%d': return Number(args[i++]);
            case '%j':
              try {
                return JSON.stringify(args[i++]);
              }
              catch (_) {
                return '[Circular]';
              }
            default:
              return x;
          }
        }),
        x;
      for (x = args[i]; i < len; x = args[++i]) {
        if (x === null || typeof x !== 'object') {
          str += ' ' + x;
        }
        else {
          str += ' ' + JSON.stringify(x);
        }
      }
      return str;
    };

    console.error = function (){
      origError.call(console, console.format.apply(console, arguments));
    };

    console.log = function (){
      origLog.call(console, console.format.apply(console, arguments));
    };
  }

})();
