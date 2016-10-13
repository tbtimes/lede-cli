import * as minimist from "minimist";
const sander = require("sander");
import { homedir } from "os";
import { join } from "path";

import { Config } from "./interfaces";
import { newCommand, devCommand } from "./lib/commands";


let args = minimist(process.argv.slice(2));

handleCommand(args).then(() => {
  process.exit(0);
}).catch((e) => {
  console.log(e);
  process.exit(1);
});

async function handleCommand(args) {
  const command = args["_"].shift();
  const config: Config = await retrieveConfig();

  switch (command) {
    case "new":
      await newCommand(config, args);
      break;
    case "dev":
      await devCommand(config, args);
      break;
    // case "image":
    // case "images":
    // case "install":
    case "build":
    default:
      console.error(`Command ${command} not recognized`);
      break;
  }
}

function retrieveConfig(): Config {
  const Settings = (<any>require(join(homedir(), "ledeConfig", "cli.config.js")).default)
  return new Settings();
}