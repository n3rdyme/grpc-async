import * as grpc from 'grpc';

export type CallHeaderValue = grpc.MetadataValue | Array<grpc.MetadataValue>;
export type CallHeaders = { [key: string]: CallHeaderValue };

/**
 * The second parameter to all service call handlers
 */
export class CallArgument<T = any> {
    private readonly _outHeaders: CallHeaders = {};
    public readonly callStart = Date.now();

    constructor(
        public readonly server: grpc.Server,
        public readonly service: string,
        public readonly method: string,
        private readonly _call: grpc.ServerUnaryCall<T>,
    ) {}

    public get cancelled(): boolean {
        return this._call.cancelled;
    }

    public get client(): string {
        return this._call.getPeer();
    }

    public get headers(): CallHeaders {
        const headers: CallHeaders = {
            ...this._call.metadata.getMap(),
        };
        Object.keys(headers).forEach(name => {
            const values = this._call.metadata.get(name);
            if (Array.isArray(values) && values.length > 1) {
                headers[name] = values;
            }
        });

        return headers;
    }

    public set(key: string, value: CallHeaderValue | undefined): void {
        if (value === undefined) {
            delete this._outHeaders[key];
        } else {
            this._outHeaders[key] = value;
        }
    }

    responseMetadata(): grpc.Metadata {
        const metadata = new grpc.Metadata();

        for (const key of Object.keys(this._outHeaders)) {
            const val = this._outHeaders[key];
            if (Array.isArray(val)) {
                const [first, ...items] = val;
                metadata.set(key, first);
                for (const item of items) {
                    metadata.set(key, item);
                }
            } else {
                metadata.set(key, val);
            }
        }

        return metadata;
    }
}
