import { dir } from "tmp";
const git = require("nodegit");
import { resolve, join } from "path";
import { homedir } from "os";
const sander = require("sander");
const spawn = require("cross-spawn");
import * as glob from "glob-promise";
import * as rmrf from "rimraf";

import { Config } from "../../interfaces";


export async function configCommand(config, args) {
  const token = args["t"] || args["token"] || config.GH_TOKEN || process.env.GH_TOKEN;
  const npmscript = args["npm"];
  const repository = args["_"][0];

  if (!repository) config.logger.error(`Must specify a repo to pull configurations from.`) && process.exit(1);
  if (!token) config.logger.error(`Must specify a token to access github.`) && process.exit(1);

  const cloneOpts = {
    fetchOpts: {
      callbacks: {
        credentials: function() {
          return git.Cred.userpassPlaintextNew(token, "x-oauth-basic")
        }
      }
    }
  };

  // Patch certificate checks on mac http://www.nodegit.org/guides/cloning/gh-two-factor/
  if (process.platform === "darwin") {
    cloneOpts.fetchOpts.callbacks.certificateCheck = function() { return 1; }
  }

  let tmpPath;
  try {
    tmpPath = await tmpProm({unsafeCleanup: true});
  } catch (err) {
    config.logger.error({err}, "There was an error creating a temporary directory.");
    process.exit(1);
  }
  config.logger.info(`Cloning https://github.com/${repository}`);

  let repo;
  try {
    repo = await git.Clone(`https://github.com/${repository}`, tmpPath, cloneOpts);
  } catch (err) {
    config.logger.error({err}, `Error cloning https://github.com/${repository}`);
    console.log(err);
    process.exit(1);
  }
  const tmpRepoPath = resolve(repo.path(), "..");

  try {
    const filesToCopy = await glob("**/*.*", {cwd: tmpRepoPath, dot: false});
    await Promise.all(
      filesToCopy.map(f => {
        return sander.copyFile(join(tmpRepoPath, f)).to(join(homedir(), "ledeConfig", f));
      })
    );
  } catch (err) {
    config.logger.error({err}, "There was an error copy configs over.");
    process.exit(1);
  }
  config.logger.info("Configs installed; installing dependencies.");

  if (npmscript) {
    await runNpmScript(npmscript);
  }
  await npmInstall();
}

function npmInstall() {
  return new Promise((resolve, reject) => {
    const proc = spawn("npm", ["install"], { cwd: join(homedir(), "ledeConfig")});
    proc.stdout.pipe(process.stdout);
    proc.stderr.pipe(process.stderr);
    proc.on("exit", resolve);
  });
}

function runNpmScript(script) {
  return new Promise((resolve, reject) => {
    const proc = spawn("npm", ["run", script], { cwd: join(homedir(), "ledeConfig")});
    proc.stdout.pipe(process.stdout);
    proc.stderr.pipe(process.stderr);
    proc.on("exit", resolve)
  });
}

function tmpProm(options) {
  return new Promise((resolve, reject) => {
    dir(options, (err, ...args) => {
      if (err) return reject(err);
      return resolve(args[0])
    })
  });
}