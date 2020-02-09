import { GrpcServerConfig } from './grpcServerConfig';
import { GrpcAsyncServer } from './grpcAsyncServer';

export type StopFunction = () => Promise<void>;

export async function grpcStart(config: GrpcServerConfig): Promise<StopFunction> {
    // Start the server
    let server: GrpcAsyncServer | null = new GrpcAsyncServer(config);
    await server.start();

    // Return a delegate to close the server with
    return async () => {
        const close = server;
        if (close) {
            server = null;
            await close.stop();
        }
    };
}
