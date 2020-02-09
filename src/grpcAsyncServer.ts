import grpc from 'grpc';
import glob from 'glob';
import { callStub } from './callStub';
import { default as log, setLogger } from './logger';
import { loadSync } from '@grpc/proto-loader';
import { GrpcServerConfig } from './grpcServerConfig';

export class GrpcAsyncServer {
    private readonly server: grpc.Server;

    constructor(private readonly config: GrpcServerConfig) {
        if (config.logging) {
            setLogger(config.logging);
        }
        this.server = new grpc.Server(config.grpcOptions);
    }

    async start() {
        this.addServices();
        const { binding, port } = this.config;
        const address = `${binding || '127.0.0.1'}:${port}`;

        this.server.bind(address, this.getCredentials());
        this.server.start();

        log.info(`Listening on ${address}`);
    }

    async stop() {
        return new Promise(done => this.server.tryShutdown(done));
    }

    private getCredentials(): grpc.ServerCredentials {
        const { ssl } = this.config;
        if (ssl) {
            return grpc.ServerCredentials.createSsl(ssl.rootCerts, ssl.keyCertPairs, ssl.checkClientCertificate);
        } else {
            return grpc.ServerCredentials.createInsecure();
        }
    }

    private getProtoFiles(): string[] {
        const {
            protos,
            options: { includeDirs },
        } = this.config;

        return (includeDirs || [process.cwd()])
            .map((root: string) => {
                return protos
                    .map(pattern => glob.sync(pattern, { root, cwd: root, silent: true, absolute: true }))
                    .reduce((a, b) => [...a, ...b], []);
            })
            .reduce((a, b) => [...a, ...b], [])
            .filter(name => name.endsWith('.proto'));
    }

    private getServicesFromProto(): { [key: string]: any } {
        const allFiles = this.getProtoFiles();
        const serviceDefinitions: { [key: string]: any } = {};
        for (const fileName of allFiles) {
            log.debug(`Loading proto: ${fileName.replace(process.cwd(), '')}`);
            const protoPackage = loadSync(fileName, this.config.options);
            for (const serviceName in protoPackage) {
                const serviceDef: any = protoPackage[serviceName];
                const isServiceDef =
                    Object.keys(serviceDef)
                        .map(member => serviceDef[member])
                        .filter(o => (o.path && o.requestType) || o.responseType).length >= 1;
                if (isServiceDef) {
                    serviceDefinitions[serviceName] = serviceDef;
                }
            }
        }
        return serviceDefinitions;
    }

    private registerService(serviceName: string, serviceDef: any, serviceDefinition: any) {
        const serviceImpl = typeof serviceDefinition === 'object' ? serviceDefinition : new serviceDefinition();

        const members = Object.keys(serviceDef).filter(name => typeof serviceDef[name].path === 'string');
        log.debug(`Loading service: ${serviceName} with ${serviceImpl.constructor.name}`);

        const svcFunctionMap = members.reduce((obj, method) => {
            obj[method] = callStub(this.server, serviceName, serviceImpl, method);
            return obj;
        }, {} as any);

        this.server.addService(serviceDef, svcFunctionMap);
    }

    private addServices() {
        const serviceDefinitions = this.getServicesFromProto();

        for (const serviceName in this.config.services) {
            const serviceDef = serviceDefinitions[serviceName];
            if (!serviceDef) {
                log.error(`Service not found: "${serviceName}".`);
                process.exit(1);
            }

            delete serviceDefinitions[serviceName];
            this.registerService(serviceName, serviceDef, this.config.services[serviceName]);
        }

        const missing = Object.keys(serviceDefinitions);
        if (missing.length) {
            log.warn(`WARN: Missing service implementations:\n\t${missing.join('\n\t')}`);
        }
    }
}
