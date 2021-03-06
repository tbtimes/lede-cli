

export interface BitDescriptor {
  settings: string;
  html: string;
  style: string;
  script: string;
}

export interface FileDescriptor {
  file: string;
  contents: string;
}

export interface Manifest {
  project: string;
  version: number;
  assets: FileDescriptor[];
  scripts: FileDescriptor[];
  styles: FileDescriptor[];
  bits: { [name: string]: BitDescriptor }
  blocks: FileDescriptor[];
}

export interface Fetcher {
  save(manifest: Manifest): Promise<void>;
  load({name, version}: {name: string, version: number}): Promise<Manifest>;
  listModules(): Promise<Array<{id: string, versions: number[]}>>;
  filterImageList({Bucket, logger, paths, Key}): Promise<string[]>;
  saveImages({Bucket, logger, images}): Promise<any>;
}