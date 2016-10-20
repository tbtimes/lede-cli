import * as chalk from "chalk";

import { Config } from "../../interfaces";


export async function lmCommand(config: Config, args: any) {
  const fname = args["f"] || args["fetcher"] || "default";
  const FETCHER = config.fetchers[fname];
  const modules = await FETCHER.listModules();
  modules.forEach((x, i) => {
    const color = i % 2 === 0 ? "green" : "blue";
    console.log(chalk[color](`${x.id} (${x.versions.sort().join(", ")})`));
  });
}