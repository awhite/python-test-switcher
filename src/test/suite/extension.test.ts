import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as sinon from 'sinon';

interface TestWorkspace {
  root: string;
  implementationDir: string;
  testDirs: {
    unit: string;
    integration: string;
  };
}

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Should toggle between test and implementation', async () => {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');

    const workspace = await setupTestWorkspace();
    try {
      const implementationFile = await createImplementationFile(workspace, 'implementation_file');
      const unitTestFile = await createUnitTestFile(workspace, 'implementation_file');

      // Open the implementation file
      const doc = await vscode.workspace.openTextDocument(implementationFile);
      await vscode.window.showTextDocument(doc);

      await vscode.commands.executeCommand('python-test-switcher.toggleTestAndImplementation');
      await verifyActiveEditor(unitTestFile, 'Should switch to test file');

      await vscode.commands.executeCommand('python-test-switcher.toggleTestAndImplementation');
      await verifyActiveEditor(implementationFile, 'Should switch back to implementation file');
    } finally {
      await cleanupWorkspace(workspace);
    }
  });

  test('Should handle multiple test files', async () => {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');

    const workspace = await setupTestWorkspace();
    try {
      const implementationFile = await createImplementationFile(workspace, 'implementation_file');
      const unitTestFile = await createUnitTestFile(workspace, 'implementation_file');
      const integrationTestFile = await createIntegrationTestFile(workspace, 'implementation_file');

      // Open the implementation file
      const doc = await vscode.workspace.openTextDocument(implementationFile);
      await vscode.window.showTextDocument(doc);

      await withMockedQuickPick('Unit', async () => {
        await vscode.commands.executeCommand('python-test-switcher.toggleTestAndImplementation');
      });
      await verifyActiveEditor(unitTestFile, 'Should switch to unit test file');

      await vscode.commands.executeCommand('python-test-switcher.toggleTestAndImplementation');
      await verifyActiveEditor(implementationFile, 'Should switch back to implementation file');

      await withMockedQuickPick('Integration', async () => {
        await vscode.commands.executeCommand('python-test-switcher.toggleTestAndImplementation');
      });
      await verifyActiveEditor(integrationTestFile, 'Should switch to integration test file');

      await vscode.commands.executeCommand('python-test-switcher.toggleTestAndImplementation');
      await verifyActiveEditor(implementationFile, 'Should switch back to implementation file');
    } finally {
      await cleanupWorkspace(workspace);
    }
  });

  test('Should handle no test files', async () => {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');

    const workspace = await setupTestWorkspace();
    try {
      const implementationFile = await createImplementationFile(workspace, 'implementation_file');

      // Open the implementation file
      const doc = await vscode.workspace.openTextDocument(implementationFile);
      await vscode.window.showTextDocument(doc);

      await withMockedQuickPick('Unit', async () => {
        await vscode.commands.executeCommand('python-test-switcher.toggleTestAndImplementation');
      });
      const unitTestFile = path.join(workspace.testDirs.unit, 'test_implementation_file.py');
      await verifyActiveEditor(unitTestFile, 'Should switch to unit test file');
    } finally {
      await cleanupWorkspace(workspace);
    }
  });

  test('Should show error when no active editor', async () => {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');

    // Mock the showInformationMessage function
    const originalShowInformationMessage = vscode.window.showInformationMessage;
    let messageShown = false;
    vscode.window.showInformationMessage = async (message: string) => {
      if (message === 'No active editor. Please open a Python file first.') {
        messageShown = true;
      }
      return undefined;
    };

    try {
      await vscode.commands.executeCommand('python-test-switcher.toggleTestAndImplementation');
      assert.ok(messageShown, 'Should show information message about no active editor');
    } finally {
      vscode.window.showInformationMessage = originalShowInformationMessage;
    }
  });

  test('Should show error for non-Python file', async () => {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');

    const workspace = await setupTestWorkspace();
    try {
      // Create a non-Python file
      const nonPythonFile = path.join(workspace.implementationDir, 'test.txt');
      await fs.promises.writeFile(nonPythonFile, 'some content');

      // Open the non-Python file
      const doc = await vscode.workspace.openTextDocument(nonPythonFile);
      await vscode.window.showTextDocument(doc);

      // Mock the showInformationMessage function
      const originalShowInformationMessage = vscode.window.showInformationMessage;
      let messageShown = false;
      vscode.window.showInformationMessage = async (message: string) => {
        if (message === 'This command only works with Python files.') {
          messageShown = true;
        }
        return undefined;
      };

      try {
        await vscode.commands.executeCommand('python-test-switcher.toggleTestAndImplementation');
        assert.ok(messageShown, 'Should show information message about non-Python file');
      } finally {
        vscode.window.showInformationMessage = originalShowInformationMessage;
      }
    } finally {
      await cleanupWorkspace(workspace);
    }
  });

  test('Should show error when no pyproject.toml found', async () => {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');

    const workspace = await setupTestWorkspace();
    try {
      // Remove pyproject.toml
      await fs.promises.unlink(path.join(workspace.root, 'pyproject.toml'));

      const implementationFile = await createImplementationFile(workspace, 'implementation_file');
      const doc = await vscode.workspace.openTextDocument(implementationFile);
      await vscode.window.showTextDocument(doc);

      // Mock the showErrorMessage function
      const originalShowErrorMessage = vscode.window.showErrorMessage;
      let messageShown = false;
      vscode.window.showErrorMessage = async (message: string) => {
        if (message === 'No pyproject.toml found in parent directories') {
          messageShown = true;
        }
        return undefined;
      };

      try {
        await vscode.commands.executeCommand('python-test-switcher.toggleTestAndImplementation');
        assert.ok(messageShown, 'Should show error message about missing pyproject.toml');
      } finally {
        vscode.window.showErrorMessage = originalShowErrorMessage;
      }
    } finally {
      await cleanupWorkspace(workspace);
    }
  });

  test('Should show error when implementation file not found', async () => {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');

    const workspace = await setupTestWorkspace();
    try {
      // Create only the test file without the implementation file
      const unitTestFile = await createUnitTestFile(workspace, 'implementation_file');
      const doc = await vscode.workspace.openTextDocument(unitTestFile);
      await vscode.window.showTextDocument(doc);

      // Mock the showErrorMessage function
      const originalShowErrorMessage = vscode.window.showErrorMessage;
      let messageShown = false;
      vscode.window.showErrorMessage = async (message: string) => {
        const expectedPath = path.join(workspace.implementationDir, 'implementation_file.py');
        if (message === `Could not find implementation file: ${expectedPath}`) {
          messageShown = true;
        }
        return undefined;
      };

      try {
        await vscode.commands.executeCommand('python-test-switcher.toggleTestAndImplementation');
        assert.ok(messageShown, 'Should show error message about missing implementation file');
      } finally {
        vscode.window.showErrorMessage = originalShowErrorMessage;
      }
    } finally {
      await cleanupWorkspace(workspace);
    }
  });
});

async function withMockedQuickPick<T extends string>(mockValue: T, callback: () => Promise<void>): Promise<void> {
  // Save the original function
  const originalShowQuickPick = vscode.window.showQuickPick;

  try {
    // Override with mock implementation
    vscode.window.showQuickPick = async function <U extends string>(
      items: readonly U[] | Thenable<readonly U[]>,
      options?: vscode.QuickPickOptions,
      token?: vscode.CancellationToken,
    ): Promise<U | undefined> {
      return mockValue as unknown as U;
    };

    // Execute the callback
    await callback();
  } finally {
    // Restore the original function
    vscode.window.showQuickPick = originalShowQuickPick;
  }
}

async function setupTestWorkspace(): Promise<TestWorkspace> {
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

async function createImplementationFile(workspace: TestWorkspace, baseFileName: string): Promise<string> {
  const implementationFile = path.join(workspace.implementationDir, `${baseFileName}.py`);
  await fs.promises.writeFile(implementationFile, 'def test_function(): pass');
  return implementationFile;
}

async function createUnitTestFile(workspace: TestWorkspace, baseFileName: string): Promise<string> {
  const unitTestFile = path.join(workspace.testDirs.unit, `test_${baseFileName}.py`);
  await fs.promises.writeFile(unitTestFile, 'def test_test_function(): pass');
  return unitTestFile;
}

async function createIntegrationTestFile(workspace: TestWorkspace, baseFileName: string): Promise<string> {
  const integrationTestFile = path.join(workspace.testDirs.integration, `test_${baseFileName}.py`);
  await fs.promises.writeFile(integrationTestFile, 'def test_test_function(): pass');
  return integrationTestFile;
}

async function verifyActiveEditor(expectedPath: string, message: string): Promise<void> {
  const activeEditor = vscode.window.activeTextEditor;
  assert.ok(activeEditor, 'Active editor should be defined');
  assert.strictEqual(activeEditor.document.uri.fsPath, expectedPath, message);
}

async function cleanupWorkspace(workspace: TestWorkspace): Promise<void> {
  await fs.promises.rm(workspace.root, { recursive: true, force: true });
}
