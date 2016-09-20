import { resolve } from 'path';
import { Stats } from 'fs';
import * as glob from 'glob-promise';
const sander = require("sander");

import { asyncMap } from "../utils";
import { basename } from "path";
const spawn = require('cross-spawn');


export async function newCommand({workingDir, args, logger}) {
  const type = args['_'][0];
  const name = args['_'][1];
  const inline = args["i"] || args["inline"] || false;


  if (!type || !name) {
    logger.error(`[type] and [name] are required parameters – you passed ${type} and ${name}`);
    return;
  }

  switch (type.toLowerCase()) {
    case 'project':
      let pathToCreate = inline ? process.cwd() : resolve(process.cwd(), name);
      let subDirs = [
        resolve(pathToCreate, 'images','fullscreen'),
        resolve(pathToCreate, 'images','mugs'),
        resolve(pathToCreate, 'assets'),
        resolve(pathToCreate, 'scripts'),
        resolve(pathToCreate, 'bits'),
        resolve(pathToCreate, 'blocks'),
        resolve(pathToCreate, 'styles')
      ];
      let paths = await glob('*', {cwd: workingDir});
      if (paths.indexOf(basename(pathToCreate)) > -1) {
        logger.error(`${name} already exists.`);
        break;
      } else {
        let dirsCreated;
        try {

          logger.info("Creating project ...");
          await sander.writeFile(resolve(pathToCreate, `${name}.projectSettings.js`), projectSettings({name}));
          logger.info(`Created ${resolve(pathToCreate, `${name}.projectSettings.js`)}`);
          asyncMap(subDirs, async(dir) => {
            logger.info(`making ${resolve(pathToCreate, dir)}`);
            await sander.mkdir(resolve(pathToCreate, dir));
            return true
          });
          await sander.writeFile(resolve(pathToCreate, ".gitignore"), gitignore());
        } catch(err) {
          logger.err({err}, "There was an error creating the new project");
        }

        if (dirsCreated) {
          logger.info("Installing dependencies ... this may take a few minutes");
        }

        const npminiter = spawn("npm", ['init', '-f'], { cwd: pathToCreate });
        npminiter.stdout.pipe(process.stdout);
        npminiter.stderr.pipe(process.stderr);

        const installer = spawn("npm", ["install", "lede@next", "slug", '--save'], { cwd: pathToCreate });
        installer.stdout.pipe(process.stdout);
        installer.stderr.pipe(process.stderr);
      }

      break;

    case 'bit':
      if (workingDir === "NONE") {
        logger.error("Could not find a projectSettings file");
        process.exit(1);
      }
      try {
        const bitPath = resolve(workingDir, "bits", name);
        await sander.writeFile(resolve(bitPath, `${name}.bitSettings.js`), bitSettings({name}));
        await sander.writeFile(resolve(bitPath, `${name}.js`), "");
        await sander.writeFile(resolve(bitPath, `${name}.scss`), "");
        await sander.writeFile(resolve(bitPath, `${name}.html`), "");
        logger.info(`Created new bit at ${resolve(workingDir, "bits", `${name}.bitSettings.js`)}`);
      } catch (err) {
        logger.error({err}, `An error occurred while creating bit ${name}`);
      }
      break;

    case 'block':
      if (workingDir === "NONE") {
        logger.error("Could not find a projectSettings file");
        process.exit(1);
      }

      try {
        await sander.writeFile(resolve(workingDir, "blocks", `${name}.blockSettings.js`), blockSettings());
        logger.info(`Created new block at ${resolve(workingDir, "blocks", `${name}.blockSettings.js`)}`);
      } catch (err) {
        logger.error({err}, `An error occurred while creating block ${name}`);
        process.exit(1);
      }
      break;

    case 'page':
      if (workingDir === "NONE") {
        logger.error("Could not find a projectSettings file");
        process.exit(1);
      }

      try {
        await sander.writeFile(resolve(workingDir, "pages", `${name}.pageSettings.js`), pageSettings({name}));
        logger.info(`Created new page at ${resolve(workingDir, "pages", `${name}.pageSettings.js`)}`);
      } catch (err) {
        logger.error({err}, `An error occurred while creating page ${name}`);
        process.exit(1);
      }
      break;

    default:
      logger.error(`${type} is not a valid [type] param.`)
  }
}

function projectSettings({name}: {name: string}) {
  return `
class SettingsConfig {
  constructor() {
    this.deployRoot = "${name}";
    this.defaults = {
      materials: [],
      blocks: [],
      metaTags: []
    };
    this.context = { foo: "bar" };
  }
}

// DO NOT CHANGE ANYTHING BELOW THIS LINE
// These two lines are necessary for lede to pull in this module at runtime.
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SettingsConfig;
`;
}

function bitSettings({name}: {name: string}) {
  return `
const join = require("path").join;

class SettingsConfig {
  constructor() {
    this.version = 0;
    this.context = { foo: "bar" };
    this.script = join(__dirname, "${name}.js");
    this.style = join(__dirname, "${name}.scss");
    this.html = join(__dirname, "${name}.html");
  }
}

// DO NOT CHANGE ANYTHING BELOW THIS LINE
// These two lines are necessary for lede to pull in this module at runtime.
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SettingsConfig;
`;
}

function blockSettings() {
  return `
const lede = require("lede");

const resolver = new lede.resolvers.AmlResolver("GOOGLEDOC ID GOES HERE", process.env.GAPI_KEY)

class SettingsConfig {
  constructor() {
    this.source = resolver;
  }
}

// DO NOT CHANGE ANYTHING BELOW THIS LINE
// These two lines are necessary for lede to pull in this module at runtime.
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SettingsConfig;
`;
}

function pageSettings({name}: {name: string}) {
  return `
const resolve = require("path").resolve;

class SettingsConfig {
  constructor() {
    this.deployPath = "${name}";
    this.blocks = [];
    this.materials = {
      scripts: [],
      styles: [],
      assets: []
    };
    this.resources = {
      head: [],
      body: []
    };
    this.meta = [];
    this.seo = {
      title: "This is a page for ${name}"
    };
  }
}

// DO NOT CHANGE ANYTHING BELOW THIS LINE
// These two lines are necessary for lede to pull in this module at runtime.
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SettingsConfig;
`;
}

function gitignore() {
  return `
node_modules
.ledeCache
.idea
`;
}