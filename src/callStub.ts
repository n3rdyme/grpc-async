import * as grpc from 'grpc';
import { UnimplementedError, InternalError, ErrorCodes } from 'grpc-error-messages';
import { CallArgument } from './callArgument';
import log from './logger';

function onError(call: any, request: any, arg: CallArgument, error: Error, callback: Function): void {
    try {
        log.error(
            `[error]\t${arg.client}\t${arg.service}.${arg.method}(${JSON.stringify(request)}): ${Date.now() -
                arg.callStart}ms`,
            error,
        );

        if (typeof (error as any).code !== 'number') {
            (error as any).code = ErrorCodes.INTERNAL;
        }

        // call.sendMetadata(arg.responseMetadata());
    } finally {
        callback(error);
    }
}

export function callStub(server: grpc.Server, serviceName: string, svcImpl: any, method: string): Function {
    return (call: grpc.ServerUnaryCall<any>, callback: grpc.requestCallback<any>): any => {
        const arg = new CallArgument(server, serviceName, method, call);
        const { request } = call;

        try {
            log.debug(`[call]\t${call.getPeer()}\t${serviceName}.${method}(${JSON.stringify(request)})`);

            if (typeof svcImpl[method] !== 'function') {
                throw new UnimplementedError(`The method "${method}" is not implemented.`);
            }

            Promise.resolve(svcImpl[method](request, arg))
                .then(result => {
                    if (typeof result !== 'object' || result === null || result === undefined) {
                        throw new InternalError(`Operation must return a valid message.`);
                    }

                    log.info(
                        `[done]\t${call.getPeer()}\t${serviceName}.${method}(${JSON.stringify(request)}): ` +
                            `${Date.now() - arg.callStart}ms`,
                    );

                    call.sendMetadata(arg.responseMetadata());
                    callback(null, result);
                })
                .catch(ex => {
                    onError(call, request, arg, ex, callback);
                });
        } catch (ex) {
            onError(call, request, arg, ex, callback);
        }
    };
}
