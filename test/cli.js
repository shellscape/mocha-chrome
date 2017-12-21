'use strict';

const chai = require('chai');
const execa = require('execa');
const path = require('path');

const cli = (args, opts) => {
  const cliPath = path.join(cwd, 'cli');
  const params = [cliPath].concat(args);

  if (/v4|v6/.test(process.version)) {
    params.push('--old-and-busted');
  }

  return execa(process.execPath, params, opts);
};
const cwd = path.dirname(__dirname);
const expect = chai.expect;
const pkg = require(path.join(cwd, 'package.json'));

describe('mocha-chrome binary', () => {

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

  it('should default to "spec" reporter', async () => {
    const { code, stdout } = await cli(['test/html/test.html'], {cwd});
    expect(stdout).to.match(/✓/);
  });

  it('should honor --spec parameter', async () => {
    const { code, stdout } = await cli(['--reporter', 'tap', 'test/html/test.html'], {cwd});
    expect(stdout).to.match(/ok/);
    expect(stdout).not.to.match(/✓/);
  });

  it('should allow use of --chrome-flags', async () => {
    const chromeFlags = JSON.stringify(['--allow-file-access-from-files']);
    const { code, stdout } = await cli(['test/html/test.html', '--chrome-flags', chromeFlags], {cwd});
    expect(code).to.equal(0);
  });

  it('should use the --timeout flag value', async () => {
    const { code, stdout } = await cli(['--timeout', '2000', 'test/html/mocha-run-timeout-1500.html'], {cwd});
    expect(stdout).to.match(/✓/);
  });
});
