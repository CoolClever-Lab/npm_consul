declare class Consul {
    host: any;
    port: any;
    protocol: any;
    serviceId: any;
    serviceName: any;
    hostname: string;
    constructor();
    serviceRegister(): Promise<void>;
    serviceDeregister(): Promise<void>;
    checkRegister(): Promise<void>;
    checkDeregister(): Promise<void>;
    checkHeartBeat(): Promise<void>;
    healthState(state?: string): Promise<unknown>;
    kvSave(key: any, value: any): Promise<void>;
    kvRead(key: any): Promise<unknown>;
    kvSaveGlobal(key: any, value: any): Promise<void>;
    kvReadGlobal(key: any): Promise<unknown>;
    get(request: any): Promise<unknown>;
    post(request: any, data: any): Promise<unknown>;
    put(request: any, data?: any): Promise<unknown>;
    delete(request: any): Promise<unknown>;
    _request(method: any, request: any, data?: any): Promise<unknown>;
}
declare const _default: Consul;
export default _default;
