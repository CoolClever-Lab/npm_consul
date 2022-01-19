//const http = require('http');
//const os = require('os');
import http from 'http';
import os from 'os';

const config = {
  host: "lololog.cd.local",
  port: 8500,
  protocol: "http:",
  serviceId: "lolopi",
  serviceName: "Lolopi"
};

class Consul {
  host: any;
  port: any;
  protocol: any;
  serviceId: any;
  serviceName: any;
  hostname: string;

  constructor() {

    this.host = config.host;
    this.port = config.port;
    this.protocol = config.protocol;

    this.serviceId = config.serviceId;
    this.serviceName = config.serviceName;

    this.hostname = os.hostname().toLowerCase().replace('.cd.local', '');

    this.serviceId += '_' + this.hostname.replace('.cd.local', '').replace(/\W*/g, '');
    this.serviceName += ' (' + this.hostname + ')';
  }

  async serviceRegister(): Promise<void> {
    let data: any = {
      id: this.serviceId,
      name: this.serviceName,

      address: this.hostname,
      //port: 8000,
    };

    data.tags = [];
    if (process.env.NODE_ENV) {
      data.tags.push(process.env.NODE_ENV);
    }
    data.tags.push(os.platform());
    if (process.version !== undefined) {
      data.tags.push(process.version);
    }
    data.tags.push(this.hostname);
    data.tags.push(os.userInfo().username.toLocaleLowerCase());

    await this.put('/v1/agent/service/register', data);
    await this.checkRegister();
  }

  async serviceDeregister(): Promise<void> {
    await this.checkDeregister();
    await this.put('/v1/agent/service/deregister/' + this.serviceId);
  }

  async checkRegister(): Promise<void> {
    let data = {
      id: this.serviceId,
      serviceId: this.serviceId,
      name: this.serviceName,
      ttl: '30s'
    };

    await this.put('/v1/agent/check/register', data);

    setInterval(this.checkHeartBeat.bind(this), 20 * 1000);
  }


  async checkDeregister(): Promise<void> {
    await this.put('/v1/agent/check/deregister/' + this.serviceId);
  }

  async checkHeartBeat(): Promise<void> {
    await this.put(`/v1/agent/check/pass/${this.serviceId}`);
  }

  async healthState(state = 'any') {
    return await this.get(`/v1/health/state/${state}`);
  }


  async kvSave(key, value) {
    await this.put(`/v1/kv/${this.serviceId}_${key}`, value);
  }

  async kvRead(key) {
    return await this.get(`/v1/kv/${this.serviceId}_${key}`);
  }

  async kvSaveGlobal(key, value) {
    await this.put(`/v1/kv/${key}`, value);
  }

  async kvReadGlobal(key) {
    return await this.get(`/v1/kv/${key}`);
  }


  async get(request) {
    return await this._request('get', request);
  }

  async post(request, data) {
    return await this._request('post', request, data);
  }

  async put(request, data?) {
    return await this._request('put', request, data);
  }

  async delete(request) {
    return await this._request('delete', request);
  }

  async _request(method, request, data?) {
    let options = {
      host: this.host,
      port: this.port,
      protocol: this.protocol,
      path: request,
      method: method,
      rejectUnauthorized: false,
      requestCert: true,
      agent: false,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    return new Promise(function (resolve, reject) {
      let rawData = '';
      let httpRequest = http.request(options, (res) => {
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          if (method === 'get' && res.statusCode === 404) {
            resolve();
          }
          if (!(res.statusCode >= 200 && res.statusCode < 300)) {
            reject(new Error(`status ${res.statusCode}: ${rawData}`));
            return;
          }
          if (!rawData) {
            resolve();
          } else {
            resolve(JSON.parse(rawData));
          }
        });
        res.on('error', (e) => {
          reject(e);
        });
      });
      httpRequest.on('error', (e) => {
        reject(e);
      });
      httpRequest.on('timeout', function () {
        httpRequest.destroy();
        reject(new Error(`Таймаут - ${(options.timeout / 1000)} секунд`));
      });
      if (data !== undefined) {
        httpRequest.write(JSON.stringify(data));
      }
      httpRequest.end();
    });
  }
}


export default new Consul();
