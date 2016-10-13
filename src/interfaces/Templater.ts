import { Logger } from "bunyan";


export interface TemplaterArg {
  name: string;
  targetDir: string;
}

export interface Templater {
  newPage(x: TemplaterArg): Promise<void>;
  newProject(x: TemplaterArg): Promise<void>;
  newBit(x: TemplaterArg): Promise<void>;
  newBlock(x: TemplaterArg): Promise<void>;
}