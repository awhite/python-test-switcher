import * as path from 'path';
import { FileSystem } from '../types';

export class PathService {
  constructor(private readonly fileSystem: FileSystem) {}

  async findProjectRoot(startPath: string): Promise<string | null> {
    let currentPath = startPath;
    while (currentPath !== path.parse(currentPath).root) {
      const pyprojectPath = path.join(currentPath, 'pyproject.toml');
      try {
        await this.fileSystem.access(pyprojectPath);
        return currentPath;
      } catch {
        currentPath = path.dirname(currentPath);
      }
    }
    return null;
  }

  isTestFile(filePath: string): boolean {
    const filename = path.basename(filePath);
    const dirParts = filePath.split(path.sep);

    const hasTestPrefix = filename.startsWith('test_');
    const testsIndex = dirParts.indexOf('tests');
    const isInTestDir =
      testsIndex !== -1 && (dirParts[testsIndex + 1] === 'unit' || dirParts[testsIndex + 1] === 'integration');

    return hasTestPrefix && isInTestDir;
  }

  getTestFilePath(projectRoot: string, implementationPath: string, testType: 'unit' | 'integration'): string {
    const dir = path.dirname(implementationPath);
    const filename = path.basename(implementationPath, '.py');
    const relativeDir = path.relative(projectRoot, dir);
    const rootTestDir = path.join(projectRoot, 'tests');
    return path.join(rootTestDir, testType, relativeDir, `test_${filename}.py`);
  }

  getImplementationFilePath(projectRoot: string, testPath: string): string {
    const dir = path.dirname(testPath);
    const filename = path.basename(testPath, '.py');
    const relativeDir = path.relative(projectRoot, dir);

    const implementationFilename = filename.startsWith('test_') ? filename.substring(5) : filename;

    const dirParts = relativeDir.split(path.sep);
    const testsIndex = dirParts.indexOf('tests');
    if (testsIndex !== -1) {
      dirParts.splice(testsIndex, 2);
    }

    return path.join(projectRoot, ...dirParts, `${implementationFilename}.py`);
  }
}
