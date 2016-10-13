import { Logger } from "bunyan";
import { Templater } from "../interfaces";

export interface Config {
  caches: {DEP_CACHE: string, COMPILER_CACHE: string, DEPLOY_DIR: string};
  templates: Templater;
  logger: Logger;
  GAPI_KEY: string;
  htmlCompilerArgs: {
    filters?: Array<{ name: string, fn: (txt: string) => string }>,
    extensions?: Array<{ name: string, ext: any }>,
    loaderOptions?: any,
    envOptions?: any,
    loaderPaths?: string[]
  };
  scriptCompilerArgs: any;
  styleCompilerArgs: any;
}