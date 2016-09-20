#!/usr/bin/env node
import { platform } from "os";
import { resolve, sep } from "path";
import * as glob from "glob";
import * as minimist from "minimist";
import { LoggerFactory } from "./utils";
import { newCommand, devCommand, imageCommand } from "./commands/commands";

const rootPath = (platform() === "win32") ? process.cwd().split(sep)[0] : "/";
let args = minimist(process.argv.slice(2));

handleCommand(args);

async function handleCommand(args) {
  let command = args["_"].shift();
  let logLevel = args['log-level'] || args['l'] || "info";

  let logger = LoggerFactory({level: logLevel});

  let config = {
    gapiKey: process.env.GAPI_KEY,
    workingDir: await findProjectSettings(process.cwd()),
    args,
    logger
  };

  logger.debug({gapiKey: config.gapiKey, workingDir: config.workingDir});

  switch (command) {
    case 'new':
      await newCommand(config);
      break;

    case 'dev':
      await devCommand(config);
      break;
    case 'image':
    case 'images':
      await imageCommand(config);
      break;

    default:
      console.error(`Command "${command}" not recognized`);
      break;
  }
}

function globProm(pattern, cwd?): Promise<Array<string>> {
  return new Promise((resolve, reject) => {
    glob(pattern, {
      cwd: cwd ? cwd : process.cwd()
    }, (err, paths) => {
      if (err) {
        return reject(err);
      }
      return resolve(paths);
    });
  });
}

async function findProjectSettings(dir: string) {
  const projectSettingsRegex = /.*?\.projectSettings\.js/;
  const files = await globProm("*", dir);
  for (let file of files) {
    if (projectSettingsRegex.test(file)) {
      return dir
    }
  }
  if (dir === rootPath) {
    return "NONE";
  }
  return findProjectSettings(resolve(dir, ".."));
}