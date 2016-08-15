import { resolve } from 'path';
import { Stats } from 'fs';
import * as glob from 'glob-promise';
import { Repository } from 'nodegit';

import { copydir, stat, writeFile, mkdir } from 'sander';
import { asyncMap } from "../utils";
import { spawn } from "child_process";


export async function newCommand({workingDir, args, logger}) {
  let type = args['_'][0];
  let name = args['_'][1];
  let contentSrc = args['c'] || args['content'];

  if (!type || !name) {
    logger.error(`[type] and [name] are required parameters – you passed ${type} and ${name}`);
    return;
  }

  switch (type.toLowerCase()) {
    case 'project':
      let pathToCreate = resolve(workingDir, name);
      let subDirs = [
        resolve('images','fullscreen'),
        resolve('images','mugs'),
        'assets',
        'scripts',
        'bits',
        'blocks'
      ];
      let paths = await glob('*', {cwd: workingDir});
      if (paths.indexOf(pathToCreate) > -1) {
        logger.error(`${name} already exists. Use 'lede ls' to see all projects.`);
        break;
      } else {
        try {
          logger.info("Creating project ...");
          await copydir(resolve(__dirname, "..", "..", "templates", "project")).to(resolve(pathToCreate));
          let data = Buffer.from(makeSettings({name, fileId: contentSrc}));
          await writeFile(resolve(pathToCreate, 'projectSettings.js'), data);
          asyncMap(subDirs, async (dir) => {
            await mkdir(resolve(pathToCreate, dir))
          });
          logger.info(`Created ${resolve(pathToCreate)}`);
        } catch(err) {
          logger.err({err}, "There was an error creating the new project");
        }
        try {
          logger.info('MAKING REPO');
          await Repository.init(resolve(workingDir, false));
          logger.info(`Initialized repository at ${resolve(pathToCreate)}`);
        } catch (err) {
          logger.err({err}, `Error initializing repository at ${resolve(pathToCreate)}`);
        }

        console.log("Installing dependencies ... this may take a few minutes");

        const npminiter = spawn("npm", ['init', '-f']);
        npminiter.stdout.pipe(process.stdout);
        npminiter.stderr.pipe(process.stderr);

        const installer = spawn("npm", ["install", "lede", "slug", '--save'], { cwd: pathToCreate });
        installer.stdout.pipe(process.stdout);
        installer.stderr.pipe(process.stderr);
      }

      break;
    case 'bit':
      try {
        let status: Stats = await stat(resolve(process.cwd(), 'projectSettings.js'));
        if (status.isFile()) {
          try {
            await copydir(resolve(__dirname, '..', '..', 'templates', 'bit')).to(resolve(process.cwd(), 'bits', name));
          } catch (err) {
            logger.error({err}, `There was an error copying bit template.`)
          }
        }
      } catch(err) {
        if (err.code !== 'ENOENT') {
          logger.error({err}, `An error occurred while accessing ${resolve(process.cwd(), 'projectSettings.js')}`);
        } else {
          logger.error(`lede new bit [name] should be run from inside a Lede Project.`)
        }
      }
      break;
    default:
      logger.error(`${type} is not a valid [type] param.`)
  }
}

function makeSettings({name, fileId}) {
  return `
class SettingsConfig {
  constructor() {
    this.name = "${name}";
    this.dependsOn = ["core"];
    this.styles = [];
    this.scripts = [];
    this.assets = [];
    this.blocks = ["ARTICLE"];
    this.googleFileId = ${fileId ? `"${fileId}"`: ""}
  }
}

// DO NOT CHANGE ANYTHING BELOW THIS LINE
// These two lines are necessary for lede to pull in this module at runtime.
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SettingsConfig;
`
}