import { writeFile, mkdir } from "fs";
import { join } from "path";
import { Logger } from "bunyan";

import { Templater, TemplaterArg } from "../../../interfaces";


export default class TemplateCreator implements Templater {
  constructor() {}

  newPage({name, targetDir}: TemplaterArg): Promise<void> {
    const data = `
class SettingsConfig {
  constructor() {
    this.deployPath = "a-great-seo-headline"
    this.blocks = [];
    this.materials = {
      scripts: [],
      styles: [],
      assets: []
    };
    this.resources = {
      head: [],
      body: []
    };
    this.meta = [];
    this.context = {
      seo: {
        title: "${name} page"
      }
    }
  }
}

// DO NOT CHANGE ANYTHING BELOW THIS LINE
// These two lines are necessary for lede to pull in this module at runtime.
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SettingsConfig;
`;
    return writeFileProm(join(targetDir, `${name}.pageSettings.js`), data)
  }

  newBit({name, targetDir}: TemplaterArg): Promise<void> {
    const data = `
const join = require("path").join;

class SettingsConfig {
  constructor() {
    this.context = {};
    this.script = join(__dirname, "${name}.js");
    this.style = join(__dirname, "${name}.scss");
    this.html = join(__dirname, "${name}.html");
  }
}

// DO NOT CHANGE ANYTHING BELOW THIS LINE
// These two lines are necessary for lede to pull in this module at runtime.
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SettingsConfig;
`;
    return mkdirProm(targetDir).then(() => {
      return Promise.all([
        writeFileProm(join(targetDir, `${name}.bitSettings.js`), data),
        writeFileProm(join(targetDir, `${name}.js`), ""),
        writeFileProm(join(targetDir, `${name}.scss`), ""),
        writeFileProm(join(targetDir, `${name}.html`), "")
      ]);
    });
  }

  newProject({name, targetDir}: TemplaterArg): Promise<void> {
    const data = `
class SettingsConfig {
  constructor() {
    this.deployRoot = "some-seo-root-path-here";
    this.defaults = {
      scripts: [],
      assets: [],
      styles: [],
      blocks: [],
      metaTags: []
    };
    this.context = {};
  }
}

// DO NOT CHANGE ANYTHING BELOW THIS LINE
// These two lines are necessary for lede to pull in this module at runtime.
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SettingsConfig;
`;
    const dirsToMake = ["assets", "bits", "blocks", "pages", "scripts", "styles"];
    return mkdirProm(targetDir).then(() => {
      return Promise.all([
        writeFileProm(join(targetDir, `${name}.projectSettings.js`), data),
        ...dirsToMake.map(x => mkdirProm(join(targetDir, x)))
      ])
    })


  }

  newBlock({name, targetDir}: TemplaterArg): Promise<void> {
    const data = `
const AmlResolver = require("lede").resolvers.AmlResolver;

class SettingsConfig {
  constructor() {
    this.source = new AmlResolver("GOOGLE_DOCS_ID_GOES_HERE", process.env.GAPI_KEY);
  }
}

// DO NOT CHANGE ANYTHING BELOW THIS LINE
// These two lines are necessary for lede to pull in this module at runtime.
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SettingsConfig;
`;
    return writeFileProm(join(targetDir, `${name}.blockSettings.js`), data);
  }
}

function writeFileProm(file, data) {
  // const self = this;
  return new Promise((resolve, reject) => {
    writeFile(file, data, (err) => {
      if (err) return reject(err);
      // self.logger.info(`Created ${file}`);
      return resolve(file);
    })
  });
}

function mkdirProm(path) {
  // const self = this;
  return new Promise((resolve, reject) => {
    mkdir(path, (err) => {
      if (err) return reject(err);
      // self.logger.info(`Created ${path}`);
      return resolve(path);
    })
  });
}