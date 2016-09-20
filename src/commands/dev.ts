import * as livereload from 'livereload';
import * as connect from 'connect';
import * as serveStatic from 'serve-static';
import { watch } from 'chokidar';
import { resolve } from 'path';
import * as glob from 'glob-promise';



export async function devCommand({workingDir, args, logger}) {
  const port = args["x"] || args["port"] || 8000;
  const localLedePath = resolve(workingDir, "node_modules", "lede", "dist", "index.js");
  let lede;
  try {
    lede = require(localLedePath)
  } catch (err) {
    logger.error({err}, `There was an error loading lede from ${resolve(workingDir, "node_modules", "lede")}. Make sure you have it locally installed.`);
    process.exit(1);
  }

  const servePath = resolve(workingDir, ".ledeCache", "dev-server");

  const projectFactory = new lede.ProjectFactory({workingDir});
  const deployer = new lede.deployers.FileSystemDeployer({workingDir: servePath});
  const projectDirector = new lede.ProjectDirector({workingDir, projectFactory, deployer, logger});


  let fileServer = connect();
  let lrServer = livereload.createServer();

  fileServer.use(serveStatic(servePath));

  const initialReport = await projectDirector.buildReport();

  createWatcher({projectDirector, projectReport: initialReport, logger});
  logger.info(`Serving at localhost:${port}/`);
  lrServer.watch(servePath);
  fileServer.listen(port);

}

async function createWatcher({projectDirector, projectReport, logger}) {
  const files = await glob("**/*", {cwd: projectReport.workingDir});
  const watcher = watch(files, {
    persistent: true
  });

  watcher.on("change", path => {
    watcher.close();
    delete require.cache[require.resolve(path)];
    logger.info(`Detected change to ${path}`);
    projectDirector.buildReport()
      .then(r => {
        return createWatcher({projectDirector, projectReport: r, logger})
      })
  });

  await projectDirector.compile(projectReport);
}