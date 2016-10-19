import { Config } from "../../interfaces"
const sander = require("sander");
import { join } from "path";
const _eval = require("eval");

import { searchForProjectDir } from "../utils";


export async function installCommand(config: Config, args) {
  const path = args["p"] || args["path"] || process.cwd();
  let ledeModulesToInstall: string[] = args["_"];
  let addToPackageJson = true;
  const workingDir = await searchForProjectDir(path);
  if (ledeModulesToInstall.length === 0) {
    ledeModulesToInstall = await loadFromPackage(workingDir);
    addToPackageJson = false;
  }

  await Promise.all(ledeModulesToInstall.map(install.bind({ fetcher: config.dependencyFetcher, workingDir: join(workingDir, config.caches.DEP_CACHE) })))

  if (addToPackageJson) {
    let p = await sander.readFile(join(workingDir, "package.json"), {encoding: "utf8"});
    p = JSON.parse(p);
    if (p.ledeModules && Array.isArray(p.ledeModules)) {
      p.ledeModules.concat(ledeModulesToInstall)
    } else {
      p.ledeModules = ledeModulesToInstall;
    }
    await sander.writeFile(join(workingDir, "package.json"), JSON.stringify(p, null, 2));
  }
  ledeModulesToInstall.forEach(m => config.logger.info(`Finished installing ${m}`));
}

async function install(module) {
  const [name, version] = module.split(".v");
  const workingDir = join(this.workingDir, name);
  const manifest = await this.fetcher.load({name, version: parseInt(version, 10)});
  return Promise.all([
    // scripts
    new Promise((resolve, reject) => {
      Promise.all(manifest.scripts.map(writeMaterialFile(workingDir, "scripts"))).then(resolve).catch(reject);
    }),
    // styles
    new Promise((resolve, reject) => {
      Promise.all(manifest.styles.map(writeMaterialFile(workingDir, "styles"))).then(resolve).catch(reject);
    }),
    // assets
    new Promise((resolve, reject) => {
      Promise.all(manifest.assets.map(writeMaterialFile(workingDir, "assets"))).then(resolve).catch(reject);
    }),
    // bits
    new Promise((resolve, reject) => {
      Promise.all(Object.keys(manifest.bits).map( bitName => {
        return new Promise((res, rej) => {
            Promise.all([
              // settings
              sander.writeFile(join(workingDir, "bits", bitName, `${bitName}.bitSettings.js`), manifest.bits[bitName].settings),
              // script
              sander.writeFile(join(workingDir, "bits", bitName, manifest.bits[bitName].script.file), manifest.bits[bitName].script.contents),
              // style
              sander.writeFile(join(workingDir, "bits", bitName, manifest.bits[bitName].style.file), manifest.bits[bitName].style.contents),
              // html
              sander.writeFile(join(workingDir, "bits", bitName, manifest.bits[bitName].html.file), manifest.bits[bitName].html.contents)
            ]).then(res).catch(rej);
        });
      })).then(resolve).catch(reject);
    })
  ])
}

function writeMaterialFile(workingDir, type) {
  return function(file) {
    return sander.writeFile(join(workingDir, type, file.file), file.contents)
  }
}

async function loadFromPackage(workingDir: string) {
  const location = join(workingDir, "package.json");
  const pack = await sander.readFile(location, {encoding: "utf8"});
  return JSON.parse(pack).ledeModules;
}