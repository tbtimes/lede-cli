import { createLogger, stdSerializers } from 'bunyan';


export function LoggerFactory({path, logLevel}) {
  return createLogger({
    name: "LedeLogger",
    serializers: {
      err: stdSerializers.err
    },
    streams: [
      {
        level: logLevel,
        stream: process.stdout
      },
      {
        level: "debug",
        path
      }
    ]
  })
}

export async function asyncMap(Collection: Array<any>, fn: (x: any) => any): Promise<Array<any>> {
  let returns = [];
  for (let item of Collection) {
    returns.push(await fn(item));
  }
  return returns;
}
