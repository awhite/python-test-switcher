import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export interface TestWorkspace {
  root: string;
  implementationDir: string;
  testDirs: {
    unit: string;
    integration: string;
  };
}

export async function setupTestWorkspace(): Promise<TestWorkspace> {
  const homeDir = os.homedir();
  const switcherDir = path.join(homeDir, '.python-test-switcher');
  await fs.promises.mkdir(switcherDir, { recursive: true });

  const tempWorkspaceDir = path.join(switcherDir, 'temp_workspace');
  await fs.promises.mkdir(tempWorkspaceDir, { recursive: true });

  // Create pyproject.toml
  const pyprojectPath = path.join(tempWorkspaceDir, 'pyproject.toml');
  await fs.promises.writeFile(pyprojectPath, '[tool.pytest]');

  // Setup directory structure
  const implementationDir = path.join(tempWorkspaceDir, 'src');
  const unitTestDir = path.join(tempWorkspaceDir, 'tests', 'unit', 'src');
  const integrationTestDir = path.join(tempWorkspaceDir, 'tests', 'integration', 'src');

  await fs.promises.mkdir(implementationDir, { recursive: true });
  await fs.promises.mkdir(unitTestDir, { recursive: true });
  await fs.promises.mkdir(integrationTestDir, { recursive: true });

  return {
    root: tempWorkspaceDir,
    implementationDir,
    testDirs: {
      unit: unitTestDir,
      integration: integrationTestDir,
    },
  };
}

export async function createImplementationFile(workspace: TestWorkspace, baseFileName: string): Promise<string> {
  const implementationFile = path.join(workspace.implementationDir, `${baseFileName}.py`);
  await fs.promises.writeFile(implementationFile, 'def test_function(): pass');
  return implementationFile;
}

export async function createUnitTestFile(workspace: TestWorkspace, baseFileName: string): Promise<string> {
  const unitTestFile = path.join(workspace.testDirs.unit, `test_${baseFileName}.py`);
  await fs.promises.writeFile(unitTestFile, 'def test_test_function(): pass');
  return unitTestFile;
}

export async function createIntegrationTestFile(workspace: TestWorkspace, baseFileName: string): Promise<string> {
  const integrationTestFile = path.join(workspace.testDirs.integration, `test_${baseFileName}.py`);
  await fs.promises.writeFile(integrationTestFile, 'def test_test_function(): pass');
  return integrationTestFile;
}

export async function cleanupWorkspace(workspace: TestWorkspace): Promise<void> {
  await fs.promises.rm(workspace.root, { recursive: true, force: true });
}
