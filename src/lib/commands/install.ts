import { Config } from "../../interfaces"
const sander = require("sander");
import { basename } from "path";

import { searchForProjectDir, loadLede } from "../utils";


export function installCommand(config: Config, args) {
  const path = args["p"] || args["path"] || process.cwd();
  const workingDir = await searchForProjectDir(path);
  const lede = loadLede(workingDir, config.logger);
}