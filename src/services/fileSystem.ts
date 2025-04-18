import * as fs from 'fs';
import * as path from 'path';
import { FileSystem, FileOperationError } from '../types';

export class NodeFileSystem implements FileSystem {
  async access(filePath: string): Promise<void> {
    try {
      await fs.promises.access(filePath);
    } catch (error) {
      throw new FileOperationError(`File not found: ${filePath}`, filePath);
    }
  }

  async mkdir(dirPath: string, options?: { recursive: boolean }): Promise<void> {
    try {
      await fs.promises.mkdir(dirPath, options);
    } catch (error) {
      if (error instanceof Error) {
        if ((error as NodeJS.ErrnoException).code === 'EACCES') {
          throw new FileOperationError(`Permission denied while creating directory: ${dirPath}`, dirPath);
        }
      }
      throw new FileOperationError(
        `Failed to create directory: ${error instanceof Error ? error.message : String(error)}`,
        dirPath,
      );
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      await fs.promises.writeFile(filePath, content);
    } catch (error) {
      if (error instanceof Error) {
        if ((error as NodeJS.ErrnoException).code === 'EACCES') {
          throw new FileOperationError(`Permission denied while writing file: ${filePath}`, filePath);
        }
      }
      throw new FileOperationError(
        `Failed to write file: ${error instanceof Error ? error.message : String(error)}`,
        filePath,
      );
    }
  }

  async readFile(filePath: string): Promise<string> {
    try {
      return await fs.promises.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new FileOperationError(
        `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
        filePath,
      );
    }
  }
}
