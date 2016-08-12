import * as glob from 'glob-promise';
import { asyncMap } from '../utils';
import { Stats } from 'fs';
import { stat } from 'sander';
import * as chalk from 'chalk';
import { resolve, basename } from 'path';


export async function lsCommand({workingDir, args, logger}) {
  let projects = await glob("*", {cwd: workingDir});
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

  existingProjects
    .filter(x => x !== null)
    .forEach((p, i) => {
      if (i % 2 === 0) {
        console.log(chalk.bgCyan.bold.black(` ${p} `))
      } else {
        console.log(chalk.bgWhite.bold.black(` ${p} `))
      }
    });
}