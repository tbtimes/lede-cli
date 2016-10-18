const glob = require("glob-promise");
import { parse, resolve, join } from "path";
import { Logger } from "bunyan";
import { request, RequestOptions } from "https";


export function loadLede(workingDir: string, logger: Logger) {
  try {
    return require(join(workingDir, "node_modules", "lede", "dist", "index.js"));
  } catch (err) {
    logger.error({err}, `There was an error loading lede from ${join(workingDir, "node_modules", "lede")}. Make sure you have it locally installed.`);
    process.exit(1);
  }
}

export async function searchForProjectDir(dirToSearch) {
  const projectFiles = await glob("*.projectSettings.js", { cwd: dirToSearch });
  if (dirToSearch === parse(dirToSearch).root && projectFiles.length < 1) throw new Error(`Could not find a lede project at or above ${process.cwd()}`);
  if (projectFiles.length < 1) return await searchForProjectDir(resolve(dirToSearch, ".."));
  return dirToSearch;
}