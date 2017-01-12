#!/usr/bin/env node
import * as minimist from "minimist";
const sander = require("sander");
import { homedir } from "os";
import { join } from "path";
import * as chalk from "chalk";

import { Config } from "./interfaces";
import { newCommand, devCommand, saveCommand, installCommand, imageCommand, lmCommand, configCommand, buildCommand } from "./lib/commands";


let args = minimist(process.argv.slice(2));

handleCommand(args).then(() => {
  process.exit(0)
}).catch((e) => {
  // console.log(chalk.red(`🔥🔥Something is totally bungled you shouldn't have to see this error🔥🔥`));
  // console.log(chalk.red(`but here it is anyway`));
  console.log(e);
  process.exit(1);
});

const config: Config = retrieveConfig();

async function handleCommand(args) {
  const command = args["_"].shift();

  switch (command) {
    case "new":
      await newCommand(config, args);
      break;
    case "dev":
      await devCommand(config, args);
      break;
    case "image":
    case "images":
      await imageCommand(config, args);
      break;
    case "install":
      await installCommand(config, args);
      break;
    case "save":
      await saveCommand(config, args);
      break;
    case "lm":
    case "listmodules":
      await lmCommand(config, args);
      break;
    case "config":
    case "configure":
      await configCommand(config, args);
      break;
    case "build":
      await buildCommand(config, args);
      break;
    default:
      console.error(`Command ${command} not recognized`);
      break;
  }
}

function retrieveConfig(): Config {
  const Settings = (<any>require(join(homedir(), "ledeConfig", "cli.config.js")).default);
  return new Settings();
}

process.on("unhandledRejection", (err) => {
  config.logger.error({err});
  process.exit(1);
})