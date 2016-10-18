import { createLogger, Logger, stdSerializers } from "bunyan";
const PrettyStream = require("bunyan-pretty-stream");
import { readFileSync } from "fs";

import TemplateCreator from "./TemplateCreator";
import DependencyFetcher from "./DependencyFetcher";
import { Templater, Config } from "../../interfaces";


const DEP_CACHE = "lede_modules";
const COMPILER_CACHE = ".ledeCache";
const DEPLOY_DIR = "dist";
const FIREBASECONFIG = "/Users/emurray/deleteme/firebase.json";
const GOOGLECONFIG = "/Users/emurray/deleteme/registry_credentials.json";
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
  dependencyFetcher: any;

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
    this.dependencyFetcher = new DependencyFetcher(JSON.parse(readFileSync(FIREBASECONFIG, "utf8")),
      JSON.parse(readFileSync(GOOGLECONFIG, "utf8")));
  }
}
