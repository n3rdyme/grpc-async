import { LogFunctions } from './logger';
import { Options } from '@grpc/proto-loader';

export interface GrpcServerConfig {
    logging?: LogFunctions;
    binding?: string; // '0.0.0.0'
    port: number;
    options: Options;
    protos: string[];
    services: { [key: string]: { new (): any } | object };

    ssl?: {
        rootCerts: Buffer;
        keyCertPairs: { private_key: Buffer; cert_chain: Buffer }[];
        checkClientCertificate: boolean;
    };
    grpcOptions?: any;
}
