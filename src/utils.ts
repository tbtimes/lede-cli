import { createLogger, stdSerializers } from "bunyan";
const PrettyStream = require("bunyan-prettystream");


export function LoggerFactory({outfile, level}: {outfile?: string, level: string}) {
  const stream = new PrettyStream();
  stream.pipe(process.stdout);

  const streams: any = [
    {
      level,
      stream
    }
  ];

  if (outfile) {
    streams.push({
      level: "debug",
      path: outfile
    })
  }

  return createLogger({
    name: "LedeLogger",
    streams,
    serializers: {
      err: stdSerializers["err"]
    }
  });
}

export async function asyncMap(Collection: Array<any>, fn: (x: any) => any): Promise<Array<any>> {
  let returns = [];
  for (let item of Collection) {
    returns.push(await fn(item));
  }
  return returns;
}
