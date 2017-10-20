'use strict';

const createInstance = require('./lib/instance');
const connectClient = require('./lib/client');
const EventBus = require('./lib/event-bus');
const chromeOut = require('./lib/chrome-out');
const network = require('./lib/network');

const deepAssign = require('deep-assign');
const log = require('loglevel');
const unmirror = require('chrome-unmirror');

process.on('unhandledRejection', error => {
  // this should always output to console.error, regardless of loglevel
  console.error('Promise Rejection: ', error);
});

class MochaChrome {
  constructor (options) {
    options = deepAssign({
      chromeFlags: [],
      loadTimeout: 1000,
      logLevel: 'error',
      ignoreExceptions: false,
      ignoreConsole: false,
      ignoreResourceErrors: false,
      mocha: {
        reporter: 'spec',
        ui: 'bdd',
        useColors: true
      }
    }, options);

    log.setDefaultLevel('error');
    log.setLevel(options.logLevel);

    const bus = new EventBus(log);

    if (!options.url) {
      this.fail('`options.url` must be specified to run tests');
    }

    bus.on('ready', content => {
      this.client.Runtime.evaluate({ expression: `mocha.setup({ reporter: 'spec' })`});
    });

    bus.on('mocha', content => {
      process.stdout.write(content);
    });

    bus.on('width', content => {
      const columns = parseInt(process.env.COLUMNS || process.stdout.columns) * .75 | 0;
      const expression = `Mocha.reporters.Base.window.width = ${columns};`;

      this.client.Runtime.evaluate({ expression });
    });

    bus.on('config', content => {
      const config = JSON.stringify(options.mocha);
      const expression = `mocha.setup(${config})`;

      this.client.Runtime.evaluate({ expression });
    });

    bus.on('started', (tests) => {
      this.started = true;
      log.info(`Test Run Started - Running ${tests} Tests\n`);

      if (tests === 0) {
        this.fail('mocha.run() was called with no tests');
      }

    });

    bus.on('ended', stats => {
      this.ended = true;
      this.exit(stats.failures);
    });

    bus.on('resourceFailed', data => {
      this.loadError = true;
    });

    this.bus = bus;
    this.options = options;
    this.loadError = false;
  }

  connect () {
    return new Promise((resolve, reject) => {
      createInstance(log, this.options).then((instance) => {
        connectClient(instance, log, this.options)
          .then((client) => {
            const {DOMStorage, Network, Runtime} = client;

            if (!client) {
              fail('CDP Client could not connect');
              return;
            }

            this.bus.watch(DOMStorage);

            chromeOut(log, this.options, Runtime);
            network(this.bus, log, Network, this.options.ignoreResourceErrors);

            this.client = client;
            this.instance = instance;

            resolve();
          })
          .catch(reject);
      }).catch(reject);
    });
  }

  run () {
    this.client.Page.loadEventFired(() => {
      if (this.closed) {
        return;
      }

      if (this.loadError) {
        this.fail('Failed to load the page. Check the url: ' + this.options.url);
        return;
      }

      setTimeout(() => {
        if (this.closed) {
          return;
        }

        const expression = '(function () { return !!window.mocha; })()';
        this.client.Runtime.evaluate({ expression }).then((res)=>{
          if (!unmirror(res.result)) {
            this.fail(`mocha was not found in the page within ${this.options.loadTimeout}ms of the page loading.`);
          }

          if (!this.started) {
            this.fail(`mocha.run() was not called within ${this.options.loadTimeout}ms of the page loading.`);
          }
        });


      }, this.options.loadTimeout);

    });

    return this.client.Page.navigate({ url: this.options.url });
  }

  on (name, fn) {
    this.bus.on(name, fn);
  }

  fail (message) {
    log.error('Mocha-Chrome Failed:', message || '');

    if (this.bus) {
      this.bus.emit('failure', message);
    }

    this.exit(1);
  }

  exit (code) {
    this.closed = true;
    this.client.close().then(() => {
      return this.instance.kill();
    }).then(() => {
      this.bus.emit('exit', 1);
    });


  }

}


module.exports = MochaChrome;
