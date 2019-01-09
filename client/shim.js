(function shim() {
  Object.defineProperty(window, 'mocha', {
    get() {
      return undefined;
    },
    set(m) {
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
    get() {
      return undefined;
    },
    set(m) {
      delete window.Mocha;
      window.Mocha = m;

      m.process.stdout._write = function mwrite(chunks, encoding, cb) {
        const output = chunks.toString ? chunks.toString() : chunks;

        window._eventbus.emit('mocha', output);

        m.process.nextTick(cb);
      };

      window._eventbus.emit('width');
    },
    configurable: true
  });

  function shimMocha(m) {
    const origRun = m.run;
    const origUi = m.ui;

    m.ui = function mui() {
      const retval = origUi.apply(mocha, arguments);
      m.reporter = () => {};
      return retval;
    };
    m.run = function mrun() {
      window._eventbus.emit('started', m.suite.suites.length);

      m.runner = origRun.apply(mocha, arguments);
      if (m.runner.stats && m.runner.stats.end) {
        window._eventbus.emit('ended', m.runner.stats);
      } else {
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
    const origError = console.error;

    const origLog = console.log;

    // stringify() and serizlier() from https://github.com/moll/json-stringify-safe
    function stringify(obj, replacer, spaces, cycleReplacer) {
      if (typeof replacer !== 'function') {
        replacer = null;
      }
      return JSON.stringify(obj, serializer(replacer, cycleReplacer), spaces);
    }

    function serializer(replacer, cycleReplacer) {
      const stack = [];
      const keys = [];

      if (cycleReplacer == null)
        cycleReplacer = function(key, value) {
          if (stack[0] === value) return '[Circular ~]';
          return `[Circular ~.${keys.slice(0, stack.indexOf(value)).join('.')}]`;
        };

      return function(key, value) {
        if (stack.length > 0) {
          const thisPos = stack.indexOf(this);
          ~thisPos ? stack.splice(thisPos + 1) : stack.push(this);
          ~thisPos ? keys.splice(thisPos, Infinity, key) : keys.push(key);
          if (~stack.indexOf(value)) value = cycleReplacer.call(this, key, value);
        } else stack.push(value);

        return replacer == null ? value : replacer.call(this, key, value);
      };
    }

    console.format = function(f) {
      if (typeof f !== 'string') {
        return Array.prototype.map.call(arguments, stringify).join(' ');
      }
      let i = 1;

      const args = arguments;

      const len = args.length;

      let str = String(f).replace(/%[sdj%]/g, (x) => {
        if (x === '%%') return '%';
        if (i >= len) return x;
        switch (x) {
          case '%s':
            return String(args[i++]);
          case '%d':
            return Number(args[i++]);
          case '%j':
            return stringify(args[i++]);
          default:
            return x;
        }
      });

      let x;
      for (x = args[i]; i < len; x = args[++i]) {
        if (x === null || typeof x !== 'object') {
          str += ` ${x}`;
        } else {
          str += ` ${stringify(x)}`;
        }
      }
      return str;
    };

    console.error = function() {
      origError.call(console, console.format(...arguments));
    };

    console.log = function() {
      origLog.call(console, console.format(...arguments));
    };
  }
})();
