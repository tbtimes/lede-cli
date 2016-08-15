#!/usr/bin/env node
import { homedir } from 'os';
import { resolve } from 'path';
import { exec, spawn } from 'child_process';
import { copydir, copyFile, mkdir } from 'sander';


let ledeHome = process.env.LEDE_HOME ? resolve(homedir(), process.env.LEDE_HOME) : resolve(homedir(), "LedeProjects");

async function build() {
  await mkdir(resolve(ledeHome, "logs"));
}

build();