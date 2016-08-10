import { homedir } from "os";
import { resolve } from "path";
import * as minimist from "minimist";
import { LoggerFactory } from "./utils";
import { newCommand, lsCommand, cdCommand, devCommand, imageCommand, stageCommand } from "./commands/commands";


let args = minimist(process.argv.slice(2));

handleCommand(args);

async function handleCommand(args) {
  let command = args["_"].shift();
  let ledeHome = process.env.LEDE_HOME ? resolve(homedir(), process.env.LEDE_HOME) : resolve(homedir(), "LedeProjects");
  let logPath = args['path'] || args['p'] || resolve(ledeHome, 'logs', 'lede.log');
  let logLevel = args['log-level'] || args['l'] || "info";

  let logger = LoggerFactory({path: logPath, logLevel});

  let config = {
    gapiKey: process.env.GAPI_KEY,
    workingDir: args['path'] || args['p'] || ledeHome,
    args,
    logger
  };

  logger.debug({gapiKey: config.gapiKey, workingDir: config.workingDir});

  switch (command) {
    case 'new':
      await newCommand(config);
      break;
    case 'ls':
      await lsCommand(config);
      break;
    case 'cd':
      await cdCommand(config);
      break;
    case 'dev':
      await devCommand(config);
      break;
    case 'image':
    case 'images':
      await imageCommand(config);
      break;
    case 'stage':
    case 'staging':
      await stageCommand(config);
      break;
    default:
      console.error(`Command "${command}" not recognized`);
      break;
  }
}