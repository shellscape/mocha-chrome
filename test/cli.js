const path = require('path');

const chai = require('chai');
const execa = require('execa');

const cwd = path.dirname(__dirname);
const { expect } = chai;
// eslint-disable-next-line import/no-dynamic-require
const pkg = require(path.join(cwd, 'package.json'));
const cli = (args, opts) => {
  const cliPath = path.join(cwd, 'cli');
  const params = [cliPath].concat(args);

  return execa(process.execPath, params, opts || { cwd }).catch((e) => e);
};

describe('mocha-chrome binary', () => {
  it('should report version', async () => {
    const { stdout } = await cli(['--version']);

    expect(stdout).to.equal(pkg.version);
  });

  it('should run a successful test', async () => {
    const { exitCode } = await cli(['test/html/test.html']);
    expect(exitCode).to.equal(0);
  });

  it('should run a failing test', async () => {
    const { stdout, exitCode } = cli(['test/html/fail.html']);
    expect(exitCode).to.equal(1);
    expect(stdout).to.match(/1 failing/);
  });

  it('should default to "spec" reporter', async () => {
    const { stdout } = await cli(['test/html/test.html']);
    expect(stdout).to.match(/✓/);
  });

  it('should honor --spec parameter', async () => {
    const { stdout } = await cli(['--reporter', 'tap', 'test/html/test.html']);
    expect(stdout).to.match(/ok/);
    expect(stdout).not.to.match(/✓/);
  });

  it('should allow use of --chrome-flags', async () => {
    const chromeFlags = JSON.stringify(['--allow-file-access-from-files']);
    const { exitCode } = await cli(['test/html/test.html', '--chrome-flags', chromeFlags]);
    expect(exitCode).to.equal(0);
  });

  it('should allow use of --chrome-launcher', async () => {
    const { exitCode } = await cli(
      [
        'test/html/test.html',
        '--chrome-launcher.connectionPollInterval=1500',
        '--chrome-launcher.maxConnectionRetries=10'
      ],
      {
        cwd
      }
    );
    expect(exitCode).to.equal(0);
  });

  it('should use the --timeout flag value', async () => {
    const { stdout } = await cli(['--timeout', '2000', 'test/html/mocha-run-timeout-1500.html']);
    expect(stdout).to.match(/✓/);
  });

  it('should not fail tests with resource errors if --ignore-resource-errors is provided', async () => {
    const { exitCode, stderr } = await cli(['test/html/resource-error.html']);
    expect(exitCode).to.equal(1);
    expect(stderr).to.contain('The following resources failed to load on the page');
    expect(stderr).to.contain('non-existant.css');
  });

  it('should not fail tests with resource errors if --ignore-resource-errors is provided', async () => {
    const { exitCode } = await cli(['test/html/resource-error.html', '--ignore-resource-errors']);
    expect(exitCode).to.equal(0);
  });
});
