import { basename, resolve } from 'path';
import { getPaths, getCompilers } from './dev';

export async function buildCommand({logger, workingDir, args}) {
  let name = args['n'] || args['name'] || basename(process.cwd());
  let localLedePath = resolve(workingDir, name, "node_modules", "lede", "dist", "index.js");

  let Lede, FileSystemDeployer, Es6Compiler, NunjucksCompiler, SassCompiler;

  try {
    Lede = require(localLedePath).Lede;
    FileSystemDeployer = require(localLedePath).FileSystemDeployer;
    Es6Compiler = require(localLedePath).Es6Compiler;
    NunjucksCompiler = require(localLedePath).NunjucksCompiler;
    SassCompiler = require(localLedePath).SassCompiler;
  } catch (err) {
    logger.error({err}, "There was an error loading lede. Make sure you have it locally installed.");
    process.exit(1);
  }

  let {servePath, buildPath} = await getPaths({workingDir, name, logger});
  let compilerConfigPath = resolve(workingDir, name, "compilerConfig.js");
  let compilers = await getCompilers({compilerConfigPath, logger, Es6Compiler, NunjucksCompiler, SassCompiler});
  let lede = new Lede(buildPath, compilers, {prod: new FileSystemDeployer(resolve(workingDir, name, "build"))}, logger);

  await lede.deploy("prod", false)
}