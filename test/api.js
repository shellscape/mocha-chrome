/* eslint-disable func-names, no-param-reassign, no-console */
const path = require('path');

const deepAssign = require('deep-assign');
const chai = require('chai');

const MochaChrome = require('../index');

const { expect } = chai;

function test(options) {
  const url = `file://${path.join(__dirname, '/html', `${options.file}.html`)}`;

  options = deepAssign(
    (options = {
      url,
      mocha: { colors: false },
      ignoreConsole: true,
      ignoreExceptions: true,
      ignoreResourceErrors: true
    }),
    options
  );

  const runner = new MochaChrome(options);
  const result = new Promise((resolve, reject) => {
    runner.on('ended', (stats) => {
      resolve(stats);
    });

    runner.on('failure', (message) => {
      reject(message);
    });
  });

  (async function() {
    await runner.connect();
    await runner.run();
  })();

  return result;
}

describe('MochaChrome', () => {
  it("fails if mocha isn't loaded", () =>
    test({ file: 'no-mocha' }).catch((message) => {
      expect(message).to.equal(
        'mocha was not found in the page within 1000ms of the page loading.'
      );
    }));

  it("fails if mocha.run isn't called", () =>
    test({ file: 'no-run' }).catch((message) => {
      expect(message).to.equal('mocha.run() was not called within 1000ms of the page loading.');
    }));

  it('runs a test', () =>
    test({ file: 'test' }).then(({ passes, failures }) => {
      expect(passes).to.equal(1);
      expect(failures).to.equal(0);
    }));

  it('reports a failure', () =>
    test({ file: 'fail' }).then(({ failures }) => {
      expect(failures).to.equal(1);
    }));

  it('allows runner modification', () =>
    test({ file: 'runner-mod' }).then(({ passes, failures }) => {
      expect(passes).to.equal(1);
      expect(failures).to.equal(1);
    }));

  it('supports different reporters', () =>
    test({
      file: 'reporter',
      mocha: {
        reporter: 'xunit'
      }
    }).then(({ passes, failures }) => {
      expect(passes).to.equal(1);
      expect(failures).to.equal(0);
    }));

  it('supports mixed tests', () =>
    test({
      file: 'mixed',
      mocha: {
        reporter: 'dot'
      }
    }).then(({ passes, failures }) => {
      expect(passes).to.equal(6);
      expect(failures).to.equal(6);
    }));

  it('reports async failures', () =>
    test({ file: 'fail-async' }).then(({ failures }) => {
      expect(failures).to.equal(3);
    }));

  it('supports test using and clearing localStorage', () =>
    test({ file: 'local-storage' }).then(({ passes, failures }) => {
      expect(passes).to.equal(2);
      expect(failures).to.equal(1);
    }));

  it('handles circular structures in console.log', () =>
    test({ file: 'circular' }).then(({ passes, failures }) => {
      expect(passes).to.equal(1);
      expect(failures).to.equal(0);
    }));
});
