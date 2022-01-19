"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//const http = require('http');
//const os = require('os');
const http_1 = __importDefault(require("http"));
const os_1 = __importDefault(require("os"));
const config = {
    host: "lololog.cd.local",
    port: 8500,
    protocol: "http:",
    serviceId: "lolopi",
    serviceName: "Lolopi"
};
class Consul {
    constructor() {
        this.host = config.host;
        this.port = config.port;
        this.protocol = config.protocol;
        this.serviceId = config.serviceId;
        this.serviceName = config.serviceName;
        this.hostname = os_1.default.hostname().toLowerCase().replace('.cd.local', '');
        this.serviceId += '_' + this.hostname.replace('.cd.local', '').replace(/\W*/g, '');
        this.serviceName += ' (' + this.hostname + ')';
    }
    serviceRegister() {
        return __awaiter(this, void 0, void 0, function* () {
            let data = {
                id: this.serviceId,
                name: this.serviceName,
                address: this.hostname,
            };
            data.tags = [];
            if (process.env.NODE_ENV) {
                data.tags.push(process.env.NODE_ENV);
            }
            data.tags.push(os_1.default.platform());
            if (process.version !== undefined) {
                data.tags.push(process.version);
            }
            data.tags.push(this.hostname);
            data.tags.push(os_1.default.userInfo().username.toLocaleLowerCase());
            yield this.put('/v1/agent/service/register', data);
            yield this.checkRegister();
        });
    }
    serviceDeregister() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.checkDeregister();
            yield this.put('/v1/agent/service/deregister/' + this.serviceId);
        });
    }
    checkRegister() {
        return __awaiter(this, void 0, void 0, function* () {
            let data = {
                id: this.serviceId,
                serviceId: this.serviceId,
                name: this.serviceName,
                ttl: '30s'
            };
            yield this.put('/v1/agent/check/register', data);
            setInterval(this.checkHeartBeat.bind(this), 20 * 1000);
        });
    }
    checkDeregister() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.put('/v1/agent/check/deregister/' + this.serviceId);
        });
    }
    checkHeartBeat() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.put(`/v1/agent/check/pass/${this.serviceId}`);
        });
    }
    healthState(state = 'any') {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.get(`/v1/health/state/${state}`);
        });
    }
    kvSave(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.put(`/v1/kv/${this.serviceId}_${key}`, value);
        });
    }
    kvRead(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.get(`/v1/kv/${this.serviceId}_${key}`);
        });
    }
    kvSaveGlobal(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.put(`/v1/kv/${key}`, value);
        });
    }
    kvReadGlobal(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.get(`/v1/kv/${key}`);
        });
    }
    get(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._request('get', request);
        });
    }
    post(request, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._request('post', request, data);
        });
    }
    put(request, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._request('put', request, data);
        });
    }
    delete(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._request('delete', request);
        });
    }
    _request(method, request, data) {
        return __awaiter(this, void 0, void 0, function* () {
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
                let httpRequest = http_1.default.request(options, (res) => {
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
                        }
                        else {
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
        });
    }
}
exports.default = new Consul();
