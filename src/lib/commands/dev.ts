import { join } from "path";
import * as connect from "connect";
import * as serveStatic from "serve-static";
import { watch } from "chokidar";
const glob = require("glob-promise");
const livereload = require("livereload");

import { Config } from "../../interfaces";
import { searchForProjectDir, loadLede } from "../utils";


export async function devCommand(config: Config, args) {
  const port = args["x"] || args["port"] || 8000;
  const path = args["p"] || args["path"] || process.cwd();
  const workingDir = await searchForProjectDir(path);
  const servePath = join(workingDir, config.caches.DEPLOY_DIR);
  const lede = loadLede(workingDir, config.logger);
  const logger = config.logger;

  // Dependency instantiation
  const deployer = new lede.deployers.FileSystemDeployer({workingDir: servePath, logger});
  const htmlCompiler = new lede.compilers.NunjucksCompiler(Object.assign({}, config.htmlCompilerArgs, {logger}));
  const styleCompiler = new lede.compilers.SassCompiler(Object.assign({}, config.styleCompilerArgs, { cacheDir: config.caches.COMPILER_CACHE, logger }));
  const scriptCompiler = new lede.compilers.Es6Compiler(Object.assign({}, config.scriptCompilerArgs, { cacheDir: config.caches.COMPILER_CACHE, logger }));
  const projectDirector = new lede.ProjectDirector({ workingDir, depCacheDir: config.caches.DEP_CACHE, deployer, logger, htmlCompiler, scriptCompiler, styleCompiler, debug: true });
  const fileServer = connect();
  const lrServer = livereload.createServer();

  await projectDirector.compile();

  await initializeWatchers({ workingDir, depCacheDir: config.caches.DEP_CACHE, projectDirector});
  fileServer.use(serveStatic(servePath));
  fileServer.listen(port);
  const pageModels = await Promise.all(
    projectDirector.model.pages.map(p => projectDirector.model.getPageTree({name: p.name, debug: true}))
  );
  const livereloadPaths = pageModels.map(p => join(servePath, p.context.$PROJECT.$name, p.context.$PAGE.$name));
  lrServer.watch(livereloadPaths);
  logger.info(`Project ${projectDirector.model.project.name} has finished compiling and is being watched for changes.`);
  for (let page of pageModels) {
    logger.info(`Serving ${page.context.$PAGE.$name} at http://localhost:${port}/${page.context.$PROJECT.$name}/${page.context.$PAGE.$name}`);
  }
  return new Promise((resolve, reject) => {

  });
}

async function initializeWatchers({ workingDir, depCacheDir, projectDirector }) {
  const blocksWatcher = await createWatcher({
    patterns: [
      { cwd: join(workingDir, "blocks"), pattern: "**/*.blockSettings.js"},
      { cwd: join(workingDir, depCacheDir), pattern: "*/blocks/**/*.blockSettings.js"}
    ]
  });
  const pagesWatcher = await createWatcher({
    patterns: [
      { cwd: join(workingDir, "pages"), pattern: "**/*.pageSettings.js"}
    ]
  });
  const scriptsWatcher = await createWatcher({ patterns: [
    { cwd: join(workingDir, "scripts"), pattern: "**/*.js"},
    { cwd: join(workingDir, depCacheDir), pattern: "*/scripts/**/*.js"},
  ]});
  const stylesWatcher = await createWatcher({ patterns: [
    { cwd: join(workingDir, "styles"), pattern: "**/*.scss"},
    { cwd: join(workingDir, depCacheDir), pattern: "*/styles/**/*.scss"},
  ]});
  const assetsWatcher = await createWatcher({ patterns: [
    { cwd: join(workingDir, "assets"), pattern: "**/*.*"},
    { cwd: join(workingDir, depCacheDir), pattern: "*/assets/**/*.*"},
  ]});
  const bitsWatcher = await createWatcher({
    patterns: [
      { cwd: join(workingDir, "bits"), pattern: "**/*.*" },
      { cwd: join(workingDir, depCacheDir), pattern: "*/bits/**/*.*"}
    ]
  });
  const projectSettingsWatcher = await createWatcher({
    patterns: [
      { cwd: workingDir, pattern: "*.projectSettings.js" }
    ]
  });

  projectDirector.watch({
    blocks: blocksWatcher,
    pages: pagesWatcher,
    scripts: scriptsWatcher,
    styles: stylesWatcher,
    assets: assetsWatcher,
    bits: bitsWatcher,
    project: projectSettingsWatcher
  })
}

async function createWatcher({patterns}) {
  const files = await Promise.all(patterns.map( p => fullyQualifiedGlob(p.pattern, p.cwd)));
  return watch(files, { persistent: true, awaitWriteFinish: { stabilityThreshold: 500 }, ignoreInitial: true });
}

async function fullyQualifiedGlob(pattern: string, cwd: string): string[] {
  return (await glob(pattern, { cwd })).map(x => join(cwd, x));
}