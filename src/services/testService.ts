import { FileSystem, TestFileInfo, TestType } from '../types';
import { PathService } from './pathService';
import path from 'path';

export class TestService {
  constructor(
    private readonly fileSystem: FileSystem,
    private readonly pathService: PathService,
  ) {}

  getTestTypeDisplay(type: TestType): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  async findTestFiles(projectRoot: string, implementationPath: string): Promise<TestFileInfo[]> {
    const testFiles: TestFileInfo[] = [];
    const testTypes: TestType[] = ['unit', 'integration'];

    for (const testType of testTypes) {
      const testPath = this.pathService.getTestFilePath(projectRoot, implementationPath, testType);
      try {
        await this.fileSystem.access(testPath);
        testFiles.push({ path: testPath, type: testType });
      } catch {
        // Test file doesn't exist, skip it
      }
    }

    return testFiles;
  }

  async createTestFile(projectRoot: string, implementationPath: string, testType: TestType): Promise<string> {
    const testPath = this.pathService.getTestFilePath(projectRoot, implementationPath, testType);
    const testDir = path.dirname(testPath);

    try {
      await this.fileSystem.mkdir(testDir, { recursive: true });
      const content = '';
      await this.fileSystem.writeFile(testPath, content);
      return testPath;
    } catch (error) {
      throw error;
    }
  }
}
