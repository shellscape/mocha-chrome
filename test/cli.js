'use strict';

const chai = require('chai');
const execa = require('execa');
const path = require('path');

const cli = (args, opts) => execa(path.join(cwd, 'bin/mocha-chrome'), args, opts);
const cwd = path.dirname(__dirname);
const expect = chai.expect;
const pkg = require(path.join(cwd, 'package.json'));

describe('mocha-chrome', () => {

  it('should report version', async () => {
    const { stdout } = await cli(['--version'], {cwd});

    expect(stdout).to.equal(pkg.version);
  });

  it('should run a successful test', async () => {
    const { code } = await cli(['test/html/test.html'], {cwd});
    expect(code).to.equal(0);
  });

  it('should run a failing test', (done) => {
    cli(['test/html/fail.html'], {cwd}).catch(err => {
      expect(err.code).to.equal(1);
      expect(err.stdout).to.match(/1 failing/);
      done();
    });
  });

});
