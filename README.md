[tests]: 	https://img.shields.io/circleci/project/github/shellscape/mocha-chrome.svg
[tests-url]: https://circleci.com/gh/shellscape/mocha-chrome

[size]: https://packagephobia.now.sh/badge?p=mocha-chrome
[size-url]: https://packagephobia.now.sh/result?p=mocha-chrome

[![tests][tests]][tests-url]
[![size][size]][size-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# mocha-chrome

:coffee: Run Mocha tests using headless Google Chrome

## Requirements

`mocha-chrome` requires Node v8.0.0 or higher.

`mocha-chrome` is a development tool, which means you can use tools like [NVM](https://github.com/creationix/nvm) and [nodenv](https://github.com/nodenv/nodenv) to manage your installed versions, and temporarily switch to v8+ to run tests on your machine. Most modern CI environments also support specifying the version of Node to run.

## Getting Started

To begin, you'll need to install `mocha-chrome`:

```console
$ npm install mocha-chrome --save-dev
```

Then you'll need a local npm install of mocha:

```console
$ npm install mocha --save-dev
```

To run the tests, you'll need an HTML file with some basics:

```html
<!doctype>
<html>
  <head>
    <title>Test</title>
    <meta charset="utf-8">
    <link rel="stylesheet" href="../../node_modules/mocha/mocha.css" />
    <script src="../../node_modules/mocha/mocha.js"></script>
    <script src="../../node_modules/chai/chai.js"></script>
  </head>
  <body>
    <div id="mocha"></div>
    <script>
      expect = chai.expect;

      // add tests here

      mocha.run();
    </script>
  </body>
</html>

```

You can then add your tests either through an external script file or inline within a `<script>` tag. Running the tests is easy, either with the CLI binary, or programmatically.

## CLI

```console
$ mocha-chrome --help

  Usage
    $ mocha-chrome <file.html> [options]

  Options
    --chrome-flags              A JSON string representing an array of flags to pass to Chrome
    --chrome-launcher           Chrome launcher options (see https://github.com/GoogleChrome/chrome-launcher#launchopts)
    --ignore-console            Suppress console logging
    --ignore-exceptions         Suppress exceptions logging
    --ignore-resource-errors    Suppress resource error logging
    --log-level                 Specify a log level; trace, debug, info, warn, error
    --mocha                     A JSON string representing a config object to pass to Mocha
    --no-colors                 Disable colors in Mocha's output
    --reporter                  Specify the Mocha reporter to use
    --timeout                   Specify the test startup timeout to use
    --version

  Examples
  $ mocha-chrome test.html --no-colors
  $ mocha-chrome test.html --reporter dot
  $ mocha-chrome test.html --mocha '\{"ui":"tdd"\}'
  $ mocha-chrome test.html --chrome-flags '["--some-flag", "--and-another-one"]'
  $ mocha-chrome test.html --chrome-launcher.maxConnectionRetries=10
```

## Events

`mocha-chrome` is technically an event emitter. Due to the asynchronous nature of nearly every interaction with headless Chrome, a simple event bus is used to handle actions from the browser. You have access to those events if running `mocha-chrome` programatically.

Example usage can be found in both [test.js](test/test.js) and [bin/mocha-chrome](bin/mocha-chrome).

#### `config`

  Fired to indicate that `mocha-chrome` should configure mocha.

#### `ended`

  Fired when all tests have ended.

##### Parameters
  `stats` : `object` - A Mocha stats object. eg:

  ```js
  {
    suites: 1,
    tests: 1,
    passes: 1,
    pending: 0,
    failures: 0,
    start: '2017-08-03T02:12:02.007Z',
    end: '2017-08-03T02:12:02.017Z',
    duration: 10
  }
  ```

#### `ready`

  Fired to indicate that the mocha script in the client has been loaded.

#### `resourceFailed`

  Fired when a resource fails to load.

  ##### Parameters
  `data` : `object` - An object containing information about the resource. eg:

  ```js
  { url, method, reason }
  ```

#### `started`

  Fired when a resource fails to load.

  ##### Parameters
  `tests` : `number` - The number of tests being run.

#### `width`

  Fired to indicate that `mocha-chrome` should inform mocha of the width of the current console/terminal.

## Limitations

### Reporters

Reporters are limited to those which don't use `process.stdout.write` to manipulate terminal output. eg. `spec`, `xunit`, etc. Examples of reporters which don't presently produce expected output formatting include `dot` and `nyan`. The cause of this limitation is the lack of a good means to pipe Mocha's built-in `stdout.write` through the Chrome Devtools Protocol to `mocha-chrome`.

### Third-Party Reporters

Third party reporters are not currently supported, but support is planned. Contribution on that effort is of course welcome.

### Cookies and the `file://` Protocol

Chrome has long-since disabled cookies for files loaded via the `file://` protocol. The once-available `--enable-file-cookies` has been removed and we're left with few options. If you're in need of cookie support for your local-file test, you may use the following snippet, which will shim `document.cookie` with _very basic_ support:

```js
  Object.defineProperty(document, 'cookie', {
    get: function () {
      return this.value || '';
    },
    set: function (cookie) {
      cookie = cookie || '';

      const cutoff = cookie.indexOf(';');
      const pair = cookie.substring(0, cutoff >= 0 ? cutoff : cookie.length);
      const cookies = this.value ? this.value.split('; ') : [];

      cookies.push(pair);

      return this.value = cookies.join('; ');
    }
  });
```

## Continuous Integration

### Circle CI

Running on Circle CI requires that Chrome is installed and running in the container your tests are running within. Please refer to this article for details: https://discuss.circleci.com/t/installing-chrome-inside-of-your-docker-container/9067. Alternatively, you can use a pre-built CircleCI image with browsers installed. You'll have to choose a tag with the `-browsers` suffix from the [full tag list](https://circleci.com/docs/2.0/docker-image-tags.json).

### Travis CI

Please refer to the _"Running it all on Travis CI"_ portion of the guide on [Automated testing with Headless Chrome](https://developers.google.com/web/updates/2017/06/headless-karma-mocha-chai) from
Google. Though the article primarily addresses Karma, the setup for Travis CI is
identical.

As of January 8th, 2018, Travis CI has upgraded from Trusty -> Xenial to address the [Meltdown](https://en.wikipedia.org/wiki/Meltdown_(security_vulnerability)) security vulnerability. There are issues with Chrome in Xenial that can currently be worked around with `sudo: required`. At some point this workaround may be removable. For the near term, please add `sudo: required` to Travis CI configuration files. See [travis-ci/travis-ci#8836](travis-ci/travis-ci#8836). Credit: [@smalls](https://github.com/shellscape/mocha-chrome/pull/21).



## Testing mocha-chrome

```console
$ npm test
```

Yep, that's it.

## Contributing

We welcome your contributions! Please have a read of [CONTRIBUTING](.github/CONTRIBUTING.md).

## Attribution

I'd like to thank @nathanboktae for his work on [mocha-phantomjs](https://github.com/nathanboktae/mocha-phantomjs) and [mocha-phantomjs-core](https://github.com/nathanboktae/mocha-phantomjs-core); two projects I've used extensively over the years, and from which the inspiration for this module originates. Many of the nuances of working with mocha in a hosted or connected browser environment were solved within `mocha-phantomjs-core` and I am personally grateful.
