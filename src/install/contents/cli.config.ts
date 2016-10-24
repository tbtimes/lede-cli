import { createLogger, Logger, stdSerializers } from "bunyan";
const PrettyStream = require("bunyan-pretty-stream");
import { join } from "path";
import { readFileSync } from "fs";
import * as glob from "glob";

import { Templater, Config, Fetcher } from "../../interfaces";


const DEP_CACHE = "lede_modules";
const COMPILER_CACHE = ".ledeCache";
const DEPLOY_DIR = "dist";
const fetcherArgs = {
  "default": {
    FIREBASECONFIG: {},
    AWSCONFIG: {}
  }
};
const FILTERS = [];

const LOGGER = {
  name: "LEDE",
  streams: [{
    level: "info",
    stream: new PrettyStream()
  }],
  serializers: {
    err: stdSerializers["err"]
  }
};

export default class SettingsConfig implements Config {
  caches: { DEP_CACHE: string, COMPILER_CACHE: string, DEPLOY_DIR: string };
  logger: Logger;
  GAPI_KEY: string;
  scriptCompilerArgs: any;
  styleCompilerArgs: any;
  htmlCompilerArgs: {
    filters?: Array<{ name: string, fn: (txt: string) => string }>,
    extensions?: Array<{ name: string, ext: any }>,
    loaderOptions?: any,
    envOptions?: any,
    loaderPaths?: string[]
  };
  templates: {[name: string]: Templater};
  fetchers: {[name: string]: Fetcher};

  constructor() {
    this.caches = {
      DEP_CACHE,
      COMPILER_CACHE,
      DEPLOY_DIR
    };
    this.logger = createLogger(LOGGER);
    this.GAPI_KEY = process.env.GAPI_KEY;
    this.scriptCompilerArgs = {};
    this.styleCompilerArgs = {};
    this.htmlCompilerArgs = { filters: FILTERS };

    // Set up templates
    this.templates = {};
    const tempReg = new RegExp("(.*)\.template\..*");
    const temps = glob.sync("*.template.*", { cwd: join(__dirname, "templates")});
    temps.forEach(t => {
      const m = t.match(tempReg);
      if (!m) return;
      const [_, name] = m;
      const p = join(__dirname, "templates", t);
      try {
        const templater = require(p).default;
        this.templates[name] = new templater();
      } catch (e) {
        console.log(`There was an error loading ${p}. Until it is fixed, template ${name} will not be available for use.`);
        console.log(e);
      }
    });

    // Set up fetchers
    this.fetchers = {};
    const fetchReg = new RegExp("(.*)\.fetcher\..*");
    const fetchs = glob.sync("*.fetcher.*", { cwd: join(__dirname, "fetchers")});
    fetchs.forEach(f => {
      const m = f.match(fetchReg);
      if (!m) return;
      const [_, name] = m;
      const p = join(__dirname, "fetchers", f);
      try {
        const fetcher = require(p).default;
        this.fetchers[name] = new fetcher(fetcherArgs[name]);
      } catch (e) {
        console.log(`There was an error loading ${p}. Until it is fixed, fetcher ${name} will not be available for use.`);
        console.log(e);
      }
    });
  }
}
