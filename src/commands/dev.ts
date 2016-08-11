import * as livereload from 'livereload';
import * as connect from 'connect';
import * as serveStatic from 'serve-static';
import { watch } from 'chokidar';
import { Stats } from 'fs';
import { stat } from 'sander';
import { resolve, basename } from 'path';

import { Lede, FileSystemDeployer, Es6Compiler, NunjucksCompiler, SassCompiler} from 'lede';


export async function devCommand({workingDir, args, logger}) {
  let name = args['n'] || args['name'] || basename(process.cwd());
  let port = args['x'] || args['port'] || 8000;
  let {servePath, buildPath} = await getPaths({workingDir, name, logger});
  let compilerConfigPath = resolve(workingDir, "compilers", "compilerConfig.js");
  let compilers = await getCompilers(compilerConfigPath, logger);
  let lede = new Lede(buildPath, compilers, {dev: new FileSystemDeployer(servePath)}, logger);
  let fileServer = connect();
  let lrServer = livereload.createServer();

  fileServer.use(serveStatic(servePath));
  let projectReport = await lede.deploy("dev", true);
  createWatcher({lede, projectReport, logger});
  logger.info(`Serving at localhost:${port}/`);
  lrServer.watch(servePath);
  fileServer.listen(port);
}

async function createWatcher({lede, projectReport, logger}) {
  let assets = [];
  let cfgs = [];
  let workingDirs = await projectReport.dependencies.map(x => x.workingDir);
  workingDirs.forEach(x => {
    assets.push(x + "/assets/**/*");
    assets.push(x + "/bits/**/*");
    assets.push(x + "/scripts/**/*");
    assets.push(x + "/styles/**/*");
    assets.push(x + "/blocks/**/*");
    assets.push(x);
    cfgs.push(x + '/projectSettings.js');
    cfgs.push(x + '/baseContext.js');
  });

  let assetWatcher = watch(assets, {
    persistent: true,
    ignored: [/[\/\\]\./, /\/(baseContext|projectSettings).js/]
  });
  let configWatcher = watch(cfgs, {
    persistent: true
  });

  configWatcher.on('change', path => {
    assetWatcher.close();
    configWatcher.close();
    delete require.cache[require.resolve(path)];
    logger.info(`Detected change to ${path}`);
    lede.deploy("dev", true)
      .then(projectReport => {
        return createWatcher({lede, projectReport, logger});
      })
  });

  assetWatcher.on('change', (path, stats) => {
    console.log(`Detected change to ${path}`);
    delete require.cache[require.resolve(path)];
    lede.deploy("dev", true, projectReport)
  })
}

export async function getCompilers(compilerConfigPath, logger) {
  let compilerConfig = null;
  try {
    compilerConfig = require(compilerConfigPath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      logger.error({err}, `Error loading ${compilerConfigPath}`);
      process.exit(1);
    } else {
      logger.debug(`No config at ${compilerConfigPath}, using default compilers`)
    }
  }
  if (!compilerConfig) {
    return {
      html: new NunjucksCompiler(),
      js: new Es6Compiler(),
      css: new SassCompiler()
    }
  } else {
    return compilerConfig.compilers
  }
}

export async function getPaths({workingDir, name, logger}) {
  try {
    let status: Stats = await stat(resolve(workingDir, name, "projectSettings.js"));
    if (status.isFile()) {
      return {
        servePath: resolve(workingDir, '.builtProjects', basename(process.cwd())),
        buildPath: resolve(workingDir, basename(process.cwd()))
      }
    } else {
      logger.error(`${resolve(workingDir, name)} is not a lede project.`);
    }
  } catch(err) {
    if (err.code === 'ENOENT') {
      logger.error({err}, `${resolve(workingDir, name)} is not a lede project.`);
    } else {
      logger.error({err}, `An error occurred while opening ${resolve(workingDir, name, "projectSettings.js")}`);
    }
  }
  process.exit(1);
}