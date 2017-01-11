import { join } from "path";
import * as rmrf from "rimraf";

import { Config } from "../../interfaces";
import { searchForProjectDir, loadLede } from "../utils";


export async function buildCommand(config: Config, args) {
  const path = args["p"] || args["path"] || process.cwd();
  const workingDir = await searchForProjectDir(path);
  const lede = loadLede(workingDir, config.logger);
  const deployPath = join(workingDir, config.caches.DEPLOY_DIR);
  const logger = config.logger;
  rmrf.sync(deployPath);

  // Dependency instantiation
  const deployer = new lede.deployers.FileSystemDeployer({workingDir: deployPath, logger});
  const htmlCompiler = new lede.compilers.NunjucksCompiler(Object.assign({}, config.htmlCompilerArgs, {logger}));
  const styleCompiler = new lede.compilers.SassCompiler(Object.assign({}, config.styleCompilerArgs, { cacheDir: config.caches.COMPILER_CACHE, logger }));
  const scriptCompiler = new lede.compilers.Es6Compiler(Object.assign({}, config.scriptCompilerArgs, { cacheDir: config.caches.COMPILER_CACHE, logger }));
  const projectDirector = new lede.ProjectDirector({ workingDir, depCacheDir: config.caches.DEP_CACHE, deployer, logger, htmlCompiler, scriptCompiler, styleCompiler, debug: false });

  await projectDirector.compile();
  config.logger.info(`Built project located at ${deployPath}`);
}


// import { join } from "path";
// import * as connect from "connect";
// import * as serveStatic from "serve-static";
// import { watch } from "chokidar";
// const glob = require("glob-promise");
// const livereload = require("livereload");
//
// import { Config } from "../../interfaces";
// import { searchForProjectDir, loadLede } from "../utils";
//
//
// export async function devCommand(config: Config, args) {
//   const port = args["x"] || args["port"] || 8000;
//   const path = args["p"] || args["path"] || process.cwd();
//   const workingDir = await searchForProjectDir(path);
//   const servePath = join(workingDir, config.caches.DEPLOY_DIR);
//   const lede = loadLede(workingDir, config.logger);
//
//   // Dependency instantiation
//   const projectFactory = new lede.ProjectFactory({depCacheDir: config.caches.DEP_CACHE});
//   const deployer = new lede.deployers.FileSystemDeployer({workingDir: servePath});
//   const htmlCompiler = new lede.compilers.NunjucksCompiler(Object.assign({}, config.htmlCompilerArgs));
//   const styleCompiler = new lede.compilers.SassCompiler(Object.assign({}, config.styleCompilerArgs, { cacheDir: config.caches.COMPILER_CACHE }));
//   const scriptCompiler = new lede.compilers.Es6Compiler(Object.assign({}, config.scriptCompilerArgs, { cacheDir: config.caches.COMPILER_CACHE }));
//   const projectDirector = new lede.ProjectDirector({ workingDir, projectFactory, deployer, logger: config.logger, htmlCompiler, scriptCompiler, styleCompiler, debug: true });
//   const fileServer = connect();
//   const lrServer = livereload.createServer();
//
//   await projectDirector.compile();
//   await initWatchers({ projectDirector, logger: config.logger, config });
//   fileServer.use(serveStatic(servePath));
//   fileServer.listen(port);
//   const livereloadPaths = projectDirector.tree.pages.map(p => {
//     return join(servePath, p.context.$PROJECT.$deployRoot, p.context.$PAGE.$deployPath)
//   });
//   lrServer.watch(livereloadPaths);
//   const tree: { workingDir: string, pages: Array<{context: any}> } = await projectFactory.getProjectModel();
//   config.logger.info(`Project ${tree.pages[0].context.$PROJECT.$name} has finished compiling and is being watched for changes.`);
//   for (let page of tree.pages) {
//     config.logger.info(`Serving ${page.context.$PAGE.$name} at http://localhost:${port}/${page.context.$PROJECT.$deployRoot}/${page.context.$PAGE.$deployPath}`)
//   }
//   return new Promise((resolve, reject) => {
//
//   });
// }
//
// async function initWatchers({ projectDirector, logger, config}) {
//   await Promise.all([
//     await createWatcher({pattern: "**/*", cwd: join(projectDirector.workingDir, config.caches.DEP_CACHE), logger, projectDirector, type: "deps"}),
//     await createWatcher({pattern: "**/*", cwd: join(projectDirector.workingDir, "scripts"), logger, projectDirector, type: "scripts"}),
//     await createWatcher({pattern: "**/*", cwd: join(projectDirector.workingDir, "styles"), logger, projectDirector, type: "styles"}),
//     await createWatcher({pattern: "**/*", cwd: join(projectDirector.workingDir, "assets"), logger, projectDirector, type: "assets"}),
//     await createWatcher({pattern: "**/*", cwd: join(projectDirector.workingDir, "bits"), logger, projectDirector, type: "bits"}),
//     await createWatcher({pattern: "**/*", cwd: join(projectDirector.workingDir, "blocks"), logger, projectDirector, type: "blocks"}),
//     await createWatcher({pattern: "**/*", cwd: join(projectDirector.workingDir, "pages"), logger, projectDirector, type: "pages"}),
//     await createWatcher({pattern: "*.projectSettings.js", cwd: projectDirector.workingDir, logger, projectDirector, type: "projectSettings"})
//   ]);
// }
//
// async function createWatcher({pattern, cwd, logger, projectDirector, type}) {
//   const files = await fullyQualifiedGlob(pattern, cwd);
//   const watcher = watch(files, { persistent: true, awaitWriteFinish: { stabilityThreshold: 500 }, ignoreInitial: true });
//
//   watcher.on("change", path => {
//     logger.info(`Detected change to ${path}`);
//     if (require.cache[require.resolve(path)]) delete require.cache[require.resolve(path)];
//     return projectDirector.refresh(type)
//   });
//
//   watcher.on("add", path => {
//     logger.info(`Detected new file at ${path}`);
//     watcher.add(path);
//     return projectDirector.compile()
//   });
//
//   watcher.on("addDir", path => {
//     logger.info(`Detected new dir at ${path}`);
//     watcher.add(path);
//   });
//
//   watcher.on("unlink", path => {
//     logger.info(`Detected deleted file at ${path}`);
//     if (require.cache[require.resolve(path)]) delete require.cache[require.resolve(path)];
//     watcher.unwatch(path);
//     return projectDirector.compile();
//   });
//
//   watcher.on("unlinkDir", path => {
//     logger.info(`Detected deleted dir at ${path}`);
//     if (require.cache[require.resolve(path)]) delete require.cache[require.resolve(path)];
//     watcher.unwatch(path);
//     return projectDirector.compile();
//   })
// }
//
// async function fullyQualifiedGlob(pattern: string, cwd: string): string[] {
//   return (await glob(pattern, { cwd })).map(x => join(cwd, x));
// }