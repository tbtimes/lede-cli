import { createLogger, Logger, stdSerializers } from "bunyan";
const pstrm = require("bunyan-prettystream");

import TemplateCreator from "./TemplateCreator";
import { Templater, Config } from "../../interfaces";


const FILTERS = [];

const LOGGER = {
  name: "LEDE",
  streams: [{
    level: "info",
    stream: new pstrm().pipe(process.stdout)
  }],
  serializers: {
    err: stdSerializers["err"]
  }
};

const DEP_CACHE = "lede_modules";
const COMPILER_CACHE = ".ledeCache";
const DEPLOY_DIR = "dist";

export default class SettingsConfig implements Config {
  caches: { DEP_CACHE: string, COMPILER_CACHE: string, DEPLOY_DIR: string };
  templates: Templater;
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

  constructor() {
    this.caches = {
      DEP_CACHE,
      COMPILER_CACHE,
      DEPLOY_DIR
    };
    this.logger = createLogger(LOGGER);
    this.templates = new TemplateCreator(this.logger);
    this.GAPI_KEY = process.env.GAPI_KEY;
    this.scriptCompilerArgs = {};
    this.styleCompilerArgs = {};
    this.htmlCompilerArgs = { filters: FILTERS };
  }
}