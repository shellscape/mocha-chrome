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

  async connect () {

    const instance = await createInstance(log, this.options);
    const client = await connectClient(instance, log, this.options);
    const { DOMStorage, Network, Runtime } = client;

    if (!client) {
      fail('CDP Client could not connect');
      return;
    }

    this.bus.watch(DOMStorage);

    chromeOut(log, Runtime);
    network(this.bus, log, Network);

    this.client = client;
    this.instance = instance;
  }

  async run () {
    this.client.Page.loadEventFired(() => {
      if (this.closed) {
        return;
      }

      if (this.loadError) {
        this.fail('Failed to load the page. Check the url: ' + this.options.url);
        return;
      }

      setTimeout(async () => {
        if (this.closed) {
          return;
        }

        const expression = '(function () { return !!window.mocha; })()';
        let res = await this.client.Runtime.evaluate({ expression });

        if (!unmirror(res.result)) {
          this.fail(`mocha was not found in the page within ${this.options.loadTimeout}ms of the page loading.`);
        }

        if (!this.started) {
          this.fail(`mocha.run() was not called within ${this.options.loadTimeout}ms of the page loading.`);
        }
      }, this.options.loadTimeout);

    });

    await this.client.Page.navigate({ url: this.options.url });
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

  async exit (code) {
    this.closed = true;
    await this.client.close();
    await this.instance.kill();

    this.bus.emit('exit', 1);
  }

}


module.exports = MochaChrome;
