import { Config } from "../../interfaces"
const sander = require("sander");
import { basename, join } from "path";
import * as glob from "glob-promise";

import { searchForProjectDir, loadLede } from "../utils";


export async function saveCommand(config: Config, args) {
  const path = args["p"] || args["path"] || process.cwd();
  const fname = args["f"] || args["fetcher"] || "default";
  const FETCHER = config.fetchers[fname];
  const workingDir = await searchForProjectDir(path);
  const lede = loadLede(workingDir, config.logger);
  const [project, preBits, {scripts: preScripts, styles: preStyles, assets: preAssets}, preBlocks] = await Promise.all([
    lede.ProjectFactory.getProject(workingDir, config.logger),
    lede.ProjectFactory.getBitsFrom(workingDir, config.logger),
    lede.ProjectFactory.getLocalMaterials(workingDir, config.logger),
    glob("*.blockSettings.js", {cwd: join(workingDir, "blocks")})
  ]);

  const [scripts, styles, assets, bits, blocks] = await Promise.all([
    new Promise((resolve, reject) => {
      Promise.all(preScripts.map(convertMatToFileDescriptor)).then(resolve);
    }),
    new Promise((resolve, reject) => {
      Promise.all(preStyles.map(convertMatToFileDescriptor)).then(resolve);
    }),
    new Promise((resolve, reject) => {
      Promise.all(preAssets.map(convertMatToFileDescriptor)).then(resolve);
    }),
    new Promise((resolve, reject) => {
      Promise.all(
        preBits.map(bit => {
          return new Promise((res, rej) => {
            Promise.all([
              Promise.resolve(bitToSettingsString(bit)),
              sander.readFile(bit.script, {encoding: "utf8"}),
              sander.readFile(bit.style, {encoding: "utf8"}),
              sander.readFile(bit.html, {encoding: "utf8"})
            ])
              .then(([settings, script, style, html]) => {
                const bitDetail = {
                  settings,
                  script: { file: basename(bit.script), contents: script },
                  style: { file: basename(bit.style), contents: style },
                  html: { file: basename(bit.html), contents: html }
                };
                return Object.assign({}, bit, bitDetail)
              })
              .then(res)
          })
        })
      )
       .then(bits => {
         return bits.reduce((state, bit) => {
           return Object.assign({}, state, {
             [bit.name]: {
               settings: bit.settings,
               script: bit.script,
               style: bit.style,
               html: bit.html
             }
           })
         }, {})
       })
       .then(resolve);
    }),
    new Promise((res, rej) => {
      Promise.all(
        preBlocks.map(block => sander.readFile(join(workingDir, "blocks", block), {encoding: "utf8"}))
      ).then(contents => {
        return preBlocks.reduce((state, path, i) => {
          state.push({ file: basename(path), contents: contents[i] });
          return state;
        }, []);
      }).then(res);
    })
  ]);

  switch (typeof project.version) {
    case "string":
      project.version = parseInt(project.version, 10);
      break;
    case "number":
      const isInt = project.version % 1 === 0;
      if (isInt) break;
    default:
      config.logger.error(`To save a project you must specify a version (as a whole number) in the projectSettings.js. Recieved ${project.version} instead.`);
      process.exit(1);
  }

  const manifest = {
    project: project.name,
    version: project.version,
    scripts,
    styles,
    assets,
    bits,
    blocks
  };

  try {
    await FETCHER.save(manifest)
  } catch (err) {
    config.logger.error({err}, `There was an error saving ${project.name} to the registry.`);
    process.exit(1);
  }
  config.logger.info(`Project has been saved to the registry!`);
  return true;
}

function convertMatToFileDescriptor(mat: { namespace: string, type: string, path: string, name: string, overridableName: string }) {
  return new Promise((resolve, reject) => {
    sander.readFile(mat.path, {encoding: 'utf-8'}).then(contents => {
      return resolve({file: mat.name, contents});
    }).catch(reject);
  });
}

function bitToSettingsString(bit) {
  const context = bit.context ? `JSON.parse(\`${JSON.stringify(bit.context)}\`)` : "{}";
  return `
const join = require("path").join;

class SettingsConfig {
  constructor() {
    this.context = ${context};
    this.script = join(__dirname, "${basename(bit.script)}");
    this.style = join(__dirname, "${basename(bit.style)}");
    this.html = join(__dirname, "${basename(bit.html)}");
  }
}

// DO NOT CHANGE ANYTHING BELOW THIS LINE
// These two lines are necessary for lede to pull in this module at runtime.
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SettingsConfig;
`
}