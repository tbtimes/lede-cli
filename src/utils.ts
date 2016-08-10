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