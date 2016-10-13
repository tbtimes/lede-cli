import { join } from "path";
import * as connect from "connect";
import * as serveStatic from "serve-static";
import { watch } from "chokidar";
const glob = require("glob-promise");
const livereload = require("livereload");

import { Config } from "../../interfaces";
import { searchForProjectDir } from "../utils";


export async function devCommand(config: Config, args) {
  const port = args["x"] || args["port"] || 8000;
  const path = args["p"] || args["path"] || process.cwd();
  const workingDir = await searchForProjectDir(path);
  const servePath = join(workingDir, config.caches.DEPLOY_DIR);
  let lede;
  try {
    lede = require(join(workingDir, "node_modules", "lede", "dist", "index.js"));
  } catch (err) {
    config.logger.error({err}, `There was an error loading lede from ${join(workingDir, "node_modules", "lede")}. Make sure you have it locally installed.`);
    process.exit(1);
  }

  // Dependency instantiation
  const projectFactory = new lede.ProjectFactory({depCacheDir: config.caches.DEP_CACHE});
  const deployer = new lede.deployers.FileSystemDeployer({workingDir: servePath});
  const htmlCompiler = new lede.compilers.NunjucksCompiler(Object.assign({}, config.htmlCompilerArgs));
  const styleCompiler = new lede.compilers.SassCompiler(Object.assign({}, config.styleCompilerArgs, { cacheDir: config.caches.COMPILER_CACHE }));
  const scriptCompiler = new lede.compilers.Es6Compiler(Object.assign({}, config.scriptCompilerArgs, { cacheDir: config.caches.COMPILER_CACHE }));
  const projectDirector = new lede.ProjectDirector({ workingDir, projectFactory, deployer, logger: config.logger, htmlCompiler, scriptCompiler, styleCompiler });
  const fileServer = connect();
  const lrServer = livereload.createServer();

  await projectDirector.compile();
  await initWatchers({ projectDirector, logger: config.logger, config });
  fileServer.use(serveStatic(servePath));
  fileServer.listen(port);
}

async function initWatchers({ projectDirector, logger, config}) {
  await Promise.all([
    await createWatcher({pattern: "**/*", cwd: join(projectDirector.workingDir, config.caches.DEP_CACHE), logger, projectDirector, type: "deps"}),
    await createWatcher({pattern: "**/*", cwd: join(projectDirector.workingDir, "scripts"), logger, projectDirector, type: "scripts"}),
    await createWatcher({pattern: "**/*", cwd: join(projectDirector.workingDir, "styles"), logger, projectDirector, type: "styles"}),
    await createWatcher({pattern: "**/*", cwd: join(projectDirector.workingDir, "assets"), logger, projectDirector, type: "assets"}),
    await createWatcher({pattern: "**/*", cwd: join(projectDirector.workingDir, "bits"), logger, projectDirector, type: "bits"}),
    await createWatcher({pattern: "**/*", cwd: join(projectDirector.workingDir, "blocks"), logger, projectDirector, type: "blocks"}),
    await createWatcher({pattern: "**/*", cwd: join(projectDirector.workingDir, "pages"), logger, projectDirector, type: "pages"}),
    await createWatcher({pattern: "*.projectSettings.js", cwd: projectDirector.workingDir, logger, projectDirector, type: "projectSettings"})
  ]);
}

async function createWatcher({pattern, cwd, logger, projectDirector, type}) {
  const files = await fullyQualifiedGlob(pattern, cwd);
  const watcher = watch(files, { persistent: true, awaitWriteFinish: { stabilityThreshold: 500 }, ignoreInitial: true });

  watcher.on("change", path => {
    logger.info(`Detected change to ${path}`);
    if (require.cache[require.resolve(path)]) delete require.cache[require.resolve(path)];
    return projectDirector.refresh(type).then(Promise.resolve)
  });

  watcher.on("add", path => {
    logger.info(`Detected new file at ${path}`);
    watcher.add(path);
    return projectDirector.compile().then(Promise.resolve)
  });

  watcher.on("addDir", path => {
    logger.info(`Detected new dir at ${path}`);
    watcher.add(path);
  });

  watcher.on("unlink", path => {
    logger.info(`Detected deleted file at ${path}`);
    if (require.cache[require.resolve(path)]) delete require.cache[require.resolve(path)];
    watcher.unwatch(path);
    return projectDirector.compile().then(Promise.resolve);
  });

  watcher.on("unlinkDir", path => {
    logger.info(`Detected deleted dir at ${path}`);
    if (require.cache[require.resolve(path)]) delete require.cache[require.resolve(path)];
    watcher.unwatch(path);
    return projectDirector.compile().then(Promise.resolve);
  })
}

async function fullyQualifiedGlob(pattern: string, cwd: string): string[] {
  return (await glob(pattern, { cwd })).map(x => join(cwd, x));
}