# grpc-async
A simple, declarative approach to creating a grpc server supporting async/await 

## Install:
```
npm install grpc-async
```

## Usage:
```typescript
import path from 'path';
import { grpcStart, CallArgument, GrpcServerConfig } from 'grpc-async';

const config: GrpcServerConfig = {
    binding: '0.0.0.0',
    port: 9090,
    protos: ['com/**/*Service.proto'],
    options: {
        keepCase: true,
        longs: Number,
        enums: String,
        defaults: true,
        oneofs: true,
        includeDirs: [path.resolve(__dirname, './proto')],
    },
    services: {
        'com.helloWorld.HelloService': {
          async Hello(request: any, call: CallArgument) {
              return { say: 'hi' };
          }
        },
    },
};

grpcStart(config)
    .then(stop => console.log('Ready.'))
    .catch(console.error);

```
