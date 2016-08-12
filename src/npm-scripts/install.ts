#!/usr/bin/env node
import { homedir } from 'os';
import { resolve } from 'path';
import { exec, spawn } from 'child_process';
import { copydir, copyFile, mkdir } from 'sander';


let ledeHome = process.env.LEDE_HOME ? resolve(homedir(), process.env.LEDE_HOME) : resolve(homedir(), "LedeProjects");

async function build() {
  let compilersDir = resolve(ledeHome, "compilers");
  await mkdir(resolve(ledeHome, "logs"));
  try {
    await copyFile(resolve(__dirname, "..", "..", "templates", "compilerConfig.js"))
      .to(resolve(compilersDir, "compilerConfig.js"));
  } catch (err) {
    console.log("Error installing compiler configurations.");
    console.log(err);
    process.exit(1);
  }
  console.log("Installing dependencies ... this may take a few minutes");

  const installer = spawn("npm", ["install", "lede", "slug"], { cwd: compilersDir });
  installer.stdout.pipe(process.stdout);
  installer.stderr.pipe(process.stderr);
}

build();