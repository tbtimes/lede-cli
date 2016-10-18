

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
}

export interface Fetcher {
  save(manifest): void;
}