import { stat, Stats } from "fs";
import { homedir } from "os";
import { join } from "path";
import * as chalk from "chalk";
import * as rmrf from "rimraf";
const glob = require("glob-promise");
const sander = require("sander");
const spawn = require("cross-spawn");


install().then(x => x).catch(e => console.log(e));

async function install() {
  let promptForOverwrite = false;
  let overwrite = false;

  try {
    const ledeExists = await statProm(join(homedir(), "ledeConfig"));
    if (ledeExists.isDirectory() || ledeExists.isFile()) promptForOverwrite = true;
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    overwrite = true;
  }

  if (promptForOverwrite) overwrite = await promptUser();

  if (overwrite) {
    await copyFilesOver();
    await installNpmModules();
  }

  console.log(chalk.blue("Lede has finished installing."))
}

async function installNpmModules() {
  return new Promise((resolve, reject) => {
    const initer = spawn("npm", ["init", "-f"], { cwd: join(homedir(), "ledeConfig")});
    initer.stderr.pipe(process.stderr);
    initer.on("exit", () => {
      const installer = spawn("npm", ["install", "bunyan", "bunyan-pretty-stream", "lede@next", "firebase", "googleapis", "--save"], { cwd: join(homedir(), "ledeConfig")});
      installer.stdout.pipe(process.stdout);
      installer.stderr.pipe(process.stderr);
      installer.on("exit", resolve);
    })
  });
}

async function copyFilesOver() {
  await rmrfProm(join(homedir(), "ledeConfig"));
  const filenames = await glob("**/*", { cwd: join(__dirname, "contents")});
  return Promise.all(
    filenames.map(file => {
      const toLoc = join(homedir(), "ledeConfig", file);
      const fromLoc = join(__dirname, "contents", file);
      return sander.copyFile(fromLoc).to(toLoc);
    })
  );

}

async function promptUser(): Promise<boolean> {
  console.log(chalk.blue(`It appears you have a file or directory at ${join(homedir(), "ledeConfig")}`));
  console.log(chalk.blue("Lede needs to store configuration in this location."));
  console.log(chalk.blue(`It is possible that you already have Lede configuration stored there, in which case, you probably ${chalk.bold.underline("do NOT")} want to overwrite it.`));
  console.log(chalk.blue("Please note, however, if you do not have Lede configurations installed there Lede will not work properly."));
  console.log(chalk.red(`Would you like to overwrite ${join(homedir(), "ledeConfig")}? (y/${chalk.bold.underline("N")})`));

  return new Promise((resolve, reject) => {
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (d: string) => {
      if (d.length === 1 || d.toLowerCase() === "n\n" || d.toLowerCase() === "no\n") return stopAndReturn(false, resolve);
      if (d.toLowerCase() === "y\n" || d.toLowerCase() === "yes\n") return stopAndReturn(true, resolve);
      console.log(chalk.blue(`${d.slice(0, d.length - 1)} is not a valid answer to the question.`));
    });
    process.stdin.on("error", () => {
      return stopAndReturn(false, resolve);
    })
  });

  function stopAndReturn(resolveVal: boolean, resolveFn) {
    process.stdin.pause();
    return resolveFn(resolveVal);
  }
}

function statProm(path: string): Promise<Stats> {
  return new Promise((resolve, reject) => {
    stat(path, (err, stats: Stats) => {
      if (err) return reject(err);
      return resolve(stats);
    })
  });
}

function rmrfProm(path: string) {
  return new Promise((resolve, reject) => {
    rmrf(path, (err) => {
      if (err) return reject(err);
      return resolve()
    })
  });
}