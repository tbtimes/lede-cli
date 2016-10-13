import { join, resolve, parse } from "path";
const glob = require("glob-promise");
const sander = require("sander");
const spawn = require("cross-spawn");

import { Config } from "../../interfaces";
import { searchForProjectDir } from "../utils";


export async function newCommand({logger, templates}: Config, args) {
  const type = args["_"][0];
  const name = args["_"][1];
  const inline = args["i"] || args["inline"] || false;
  const workingDir = args["p"] || args["path"] || process.cwd();
  let targetDir;

  if (!type || !name) {
    logger.error(`[type] and [name] are required parameters – you passed ${type} and ${name}`);
  }

  switch (type.toLowerCase()) {
    case "project":
      targetDir = inline ? workingDir : join(workingDir, name);
      try {
        await templates.newProject({ name, targetDir });
      } catch (err) {
        logger.error({err}, "There was an error creating a new project.");
        process.exit(1);
      }
      logger.info("Project directories created, installing dependencies. This may take a minute.");
      try {
        await spawnProm("npm", ["init", "-f"], { cwd: targetDir });
        await spawnProm("npm", ["install", "lede@next", "slug"], { cwd: targetDir }, true);
      } catch (err) {
        logger.error({err}, "There was an error installing the dependencies for your project, but you may be able to install them manually.");
      }

      logger.info(`Created ${name} at ${targetDir}`);
      break;

    case "bit":
      try {
        targetDir = join(await searchForProjectDir(workingDir), "bits");
        await templates.newBit({name, targetDir});
      } catch (err) {
        logger.error({err}, "There was an error creating a new bit");
        process.exit(1);
      }
      logger.info(`Created bit ${name} at ${targetDir}`);
      break;

    case "page":
      try {
        targetDir = join(await searchForProjectDir(workingDir), "pages");
        await templates.newPage({name, targetDir});
      } catch (err) {
        logger.error({err}, "There was an error creating a new page");
        process.exit(1);
      }
      logger.info(`Created page ${name} at ${targetDir}`);
      break;

    case "block":
      try {
        targetDir = join(await searchForProjectDir(workingDir), "blocks");
        await templates.newBlock({name, targetDir});
      } catch (err) {
        logger.error({err}, "There was an error creating a new block");
        process.exit(1);
      }
      logger.info(`Created page ${name} at ${targetDir}`);
      break;
  }
}

async function spawnProm(command, args, options, pipe?) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    if (pipe) {
      child.stderr.pipe(process.stderr);
      child.stdout.pipe(process.stdout);
    }
    child.on("exit", resolve);
    child.on("error", reject);
  });
}

