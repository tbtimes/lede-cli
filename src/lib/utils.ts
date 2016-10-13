const glob = require("glob-promise");
import { parse, resolve } from "path";


export async function searchForProjectDir(dirToSearch) {
  const projectFiles = await glob("*.projectSettings.js", { cwd: dirToSearch });
  if (dirToSearch === parse(dirToSearch).root && projectFiles.length < 1) throw new Error(`Could not find a lede project at or above ${process.cwd()}`);
  if (projectFiles.length < 1) return await searchForProjectDir(resolve(dirToSearch, ".."));
  return dirToSearch;
}