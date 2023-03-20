import deepAssign from 'deep-assign'

import log from 'loglevel'
import unmirror from 'chrome-unmirror'

import { createInstance } from './lib/instance.js'
import { connectClient } from './lib/client.js'
import EventBus from './lib/event-bus.js'
import { chromeOut } from './lib/chrome-out.js'
import { network } from './lib/network.js'

const { setDefaultLevel, setLevel, info, error: _error } = log

process.on('unhandledRejection', (error) => {
  const { error: stderr } = console
  // this should always output to console.error, regardless of loglevel
  stderr('Promise Rejection: ', error)
})

export class MochaChrome {
  constructor (options) {
    // eslint-disable-next-line no-param-reassign
    options = deepAssign(
      {
        chromeFlags: [],
        chromeLauncher: {},
        loadTimeout: 1000,
        logLevel: 'error',
        ignoreExceptions: false,
        ignoreConsole: false,
        ignoreResourceErrors: false,
        mocha: {
          reporter: 'spec',
          ui: 'bdd',
          colors: true
        }
      },
      options
    )

    setDefaultLevel('error')
    setLevel(options.logLevel)

    const bus = new EventBus(log)

    if (!options.url) {
      this.fail('`options.url` must be specified to run tests')
    }

    bus.on('ready', (/* content */) => {
      this.client.Runtime.evaluate({
        expression: 'mocha.setup({ reporter: \'spec\' })'
      })
    })

    bus.on('mocha', (content) => {
      process.stdout.write(content)
    })

    bus.on('width', (/* content */) => {
      // eslint-disable-next-line no-bitwise
      const columns = (parseInt(process.env.COLUMNS || process.stdout.columns, 10) * 0.75) | 0
      const expression = `Mocha.reporters.Base.window.width = ${columns};`

      this.client.Runtime.evaluate({ expression })
    })

    bus.on('config', (/* content */) => {
      const config = JSON.stringify(options.mocha)
      const expression = `mocha.setup(${config})`

      this.client.Runtime.evaluate({ expression })
    })

    bus.on('started', (tests) => {
      this.started = true
      info(`Test Run Started - Running ${tests} Tests\n`)

      if (tests === 0) {
        this.fail('mocha.run() was called with no tests')
      }
    })

    bus.on('ended', (stats) => {
      this.ended = true
      this.exit(stats.failures)
    })

    bus.on('resourceFailed', (resource) => {
      this.failedResources.push(resource.url)
    })

    this.bus = bus
    this.options = options
    this.failedResources = []
  }

  async connect () {
    const instance = await createInstance(log, this.options)
    const client = await connectClient(instance, log, this.options)
    const { DOMStorage, Network, Runtime } = client

    if (!client) {
      this.fail('CDP Client could not connect')
      return
    }

    this.bus.watch(DOMStorage)

    chromeOut(log, this.options, Runtime)
    network(this.bus, log, Network, this.options.ignoreResourceErrors)

    this.client = client
    this.instance = instance
  }

  async run () {
    this.client.Page.loadEventFired(() => {
      if (this.closed) {
        return
      }

      if (this.failedResources.length && !this.options.ignoreResourceErrors) {
        this.fail(`The following resources failed to load on the page:

${this.failedResources.join('\n')}

You may supress these failures with --ignore-resource-errors`)
        return
      }

      setTimeout(async () => {
        if (this.closed) {
          return
        }

        const expression = '(function () { return !!window.mocha; })()'
        const res = await this.client.Runtime.evaluate({ expression })

        if (!unmirror(res.result)) {
          this.fail(
            `mocha was not found in the page within ${this.options.loadTimeout}ms of the page loading.`
          )
        }

        if (!this.started) {
          this.fail(
            `mocha.run() was not called within ${this.options.loadTimeout}ms of the page loading.`
          )
        }
      }, this.options.loadTimeout)
    })

    await this.client.Page.navigate({ url: this.options.url })
  }

  on (name, fn) {
    this.bus.on(name, fn)
  }

  fail (message) {
    _error('Mocha-Chrome Failed:', message || '')

    if (this.bus) {
      this.bus.emit('failure', message)
    }

    this.exit(1)
  }

  async exit (/* code */) {
    this.closed = true
    await this.client.close()
    await this.instance.kill()

    this.bus.emit('exit', 1)
  }
}

export default MochaChrome
