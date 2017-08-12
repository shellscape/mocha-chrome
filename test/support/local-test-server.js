const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const express = require('express');


const DefaultOptions = {
  testFixturePath: path.resolve(__dirname, '../html'),
  testFixturePort: 0,
  testMountPoint: '/',
  useHttps: true,
  certPath: path.resolve(__dirname, 'ssl/insecure-cert.pem'),
  keyPath: path.resolve(__dirname, 'ssl/insecure-key.pem'),
  logLevel: 'error'
};


class LocalTestServer {
  constructor(options={}) {
    this._options = Object.assign({}, DefaultOptions, options);
    this._expressApp = express();
  }

  start() {
    const options = this._options;
    const app = this._expressApp;
    this.mountStatic('/', options.testFixturePath);

    if (this.isHttps()) {
      // Insecure certificate for testing only. Common Name "localhost". Created with:
      //   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 3650 -nodes
      const cert = fs.readFileSync(options.certPath, 'utf8');
      const key = fs.readFileSync(options.keyPath, 'utf8');
      this._server = https.createServer({ key, cert }, app);
    } else {
      this._server = http.createServer(app);
    }
    return new Promise((resolve, reject) => {
      this._server.listen(options.testFixturePort, err => {
        if (err) {
          console.error('Unable to start test server', err);
          reject(err);
        } else {
          this._port = this._server.address().port;
          console.log('Serving test fixtures', options.testFixturePath, 'on', this.getHost());
          resolve(this.getHost());
        }
      });
    });
  }

  getHost() {
    return (this.isHttps() ? 'https:' : 'http:') + '//localhost:' + this._getPort();
  }

  stop() {
    this._server && this._server.close();
  }

  mountStatic(mountPoint, filePath) {
    this._expressApp.use(mountPoint, express.static(filePath));
  }

  isHttps() {
    return !!this._options.useHttps;
  }

  _getPort() {
    if (!this._port) {
      throw new Error('Server not started');
    }
    return this._port;
  }
}



module.exports = LocalTestServer;