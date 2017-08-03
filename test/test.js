'use strict';

const chai = require('chai');
const deepAssign = require('deep-assign');
const fs = require('fs');
const path = require('path');
const url = require('url');

const MochaChrome = require('../index');
const expect = chai.expect;

function test (options) {
  const url = 'file://' + path.join(__dirname, '/html', options.file + '.html');

  options = deepAssign(options = {
    url,
    mocha: { useColors: false }
  }, options);

  const runner = new MochaChrome(options);
  const result = new Promise((resolve, reject) => {
    runner.on('ended', stats => {
      resolve(stats);
    });

    runner.on('failure', message => {
      reject(message);
    });
  });

  (async function () {
    await runner.connect();
    await runner.run();
  })();

  return result;
}

describe('MochaChrome', () => {

  it('fails if mocha isn\'t loaded', () => {
    return test({ file: 'no-mocha' }).catch(message => {
      expect(message).to.equal('mocha was not found in the page within 1000ms of the page loading.');
    });
  });

  it('fails if mocha.run isn\'t called', () => {
    return test({ file: 'no-run' }).catch(message => {
      expect(message).to.equal('mocha.run() was not called within 1000ms of the page loading.');
    });
  });

  it('runs a test', () => {
    return test({ file: 'test' }).then(({passes, failures}) => {
      expect(passes).to.equal(1);
      expect(failures).to.equal(0);
    });
  });

  it('reports a failure', () => {
    return test({ file: 'fail' }).then(({passes, failures}) => {
      expect(failures).to.equal(1);
    });
  });

  it('allows runner modification', () => {
    return test({ file: 'runner-mod' }).then(({passes, failures}) => {
      expect(passes).to.equal(1);
      expect(failures).to.equal(1);
    });
  });

  it('supports different reporters', () => {
    return test({ file: 'reporter',
      mocha: {
        reporter: 'xunit'
      }
    }).then(({passes, failures}) => {
      expect(passes).to.equal(1);
      expect(failures).to.equal(0);
    });
  });

  it('supports mixed tests', () => {
    return test({ file: 'mixed',
      mocha: {
        reporter: 'dot'
      }
    }).then(({passes, failures}) => {
      expect(passes).to.equal(6);
      expect(failures).to.equal(6);
    });
  });

  it('reports async failures', () => {
    return test({ file: 'fail-async' }).then(({passes, failures}) => {
      expect(failures).to.equal(3);
    });
  });

});
