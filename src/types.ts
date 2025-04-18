export type TestType = 'unit' | 'integration';

export interface TestFileInfo {
  path: string;
  type: TestType;
}

export class FileOperationError extends Error {
  constructor(
    message: string,
    public readonly path: string,
  ) {
    super(message);
    this.name = 'FileOperationError';
  }
}

export interface FileSystem {
  access(path: string): Promise<void>;
  mkdir(path: string, options?: { recursive: boolean }): Promise<void>;
  writeFile(path: string, content: string): Promise<void>;
  readFile(path: string): Promise<string>;
}
