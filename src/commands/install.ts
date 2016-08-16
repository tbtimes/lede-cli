import { dir } from "tmp";
import { resolve, basename } from "path";
import { Clone, Cred } from "nodegit";
import { Stats } from "fs";
import { copydir, stat } from "sander";
import * as glob from 'glob-promise';
import { asyncMap } from '../utils';

export async function installCommand({workingDir, logger, args}) {
  const force = args['f'] || args['force'];
  const module: string = args['_'][0] || (logger.error("No installable module specified.") && process.exit(1));
  const moduleRegex = new RegExp("(.+):(.+)");
  const [_, manager, repository] = module.match(moduleRegex);
  const cloneOpts = {
    fetchOpts: {
      callbacks: {
        credentials: function() {
          return Cred.userpassPlaintextNew(process.env.GH_TOKEN, "x-oauth-basic")
        }
      }
    }
  };

  // Patch certificate checks on mac http://www.nodegit.org/guides/cloning/gh-two-factor/
  if (process.platform === "darwin") {
    cloneOpts.fetchOpts.callbacks.certificateCheck = function() { return 1; }
  }

  switch (manager) {
    case 'gh':
    case 'github':
      let tmpPath, cleanupCallback;
      try {
        [tmpPath, cleanupCallback] = await tmpProm({unsafeCleanup: true});
      } catch (err) {
        logger.error({err}, "There was an error creating temporary directory.");
        process.exit(1);
      }
      logger.info(`Cloning https://github.com/${repository}`);
      let repo;
      try {
        repo = await Clone(`https://github.com/${repository}`, tmpPath, cloneOpts);
      } catch (err) {
        logger.error({err}, `Error cloning https://github.com/${repository}`);
        process.exit(1);
      }
      const tmpRepoPath = resolve(repo.path(), '..');

      try {
        const proj: Stats = await stat(resolve(tmpRepoPath, 'projectSettings.js'));
        if (!proj.isFile()) {
          throw new Error(`${resolve(tmpRepoPath, 'projectSettings.js')} is not a file.`);
        }
      } catch (err) {
        if (err.code !== 'ENOENT') {
          logger.error({err}, `Error accessing ${resolve(tmpRepoPath, 'projectSettings.js')}`);
          process.exit(1);
        } else if (!force) {
          logger.error(
            `https://github.com/${repository} does not appear to be a lede project. Try running with --force if you want to install it anyway`)
          process.exit(1);
        }
      }
      if (force) {
        try {
          await copydir(tmpRepoPath).to(workingDir);
        } catch (err) {
          logger.error({err}, `Error copying project to ${workingDir}.`)
        }
      } else {
        let SettingsConfig, projName;
        // Catch errors instantiating project settings
        try {
          SettingsConfig = require(resolve(tmpRepoPath, "projectSettings.js")).default;
          projName = new SettingsConfig().name;
        } catch(err) {
          logger.error({err}, `Error instantiating projectSettings.js from https://github.com/${repository}`);
        }
        // Check if project name already exists
        try {
          const projects = await glob('*', { cwd: workingDir })
          let existingProjects = await asyncMap(projects, async (p) => {
            try {
              let file: Stats = await stat(resolve(workingDir, p, 'projectSettings.js'));
              if (file.isFile()) {
                return basename(p)
              } else {
                return null;
              }
            } catch(err) {
              if (err.code !== 'ENOENT') {
                logger.error({err}, `There was an error accessing ${resolve(p, "projectSettings.js")}`);
              }
              return null;
            }
          });
          existingProjects = existingProjects.filter(x => x !== null);
          if (existingProjects.indexOf(projName) > -1) {
            logger.error(`Project ${projName} already exists in ${workingDir}. Use git pull from inside that directory to update.`);
            process.exit(1);
          }
        } catch(err) {
          logger.error({err}, "An error occurred while checking for existing projects.")
        }
        // Copy project over
        try {
          await copydir(tmpRepoPath).to(resolve(workingDir, projName));
          logger.info(`Successfully installed project to ${resolve(workingDir, projName)}`);
        } catch(err) {
          logger.error({err}, `Error copying project to ${resolve(workingDir, projName)}`);
        }
      }
      break;
  }
}

function tmpProm(options) {
  return new Promise((resolve, reject) => {
    dir(options, (err, ...args) => {
      if (err) {
        return reject(err);
      }
      return resolve(args);
    });
  });
}