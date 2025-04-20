import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {
  cleanupWorkspace,
  createImplementationFile,
  createIntegrationTestFile,
  createUnitTestFile,
  setupTestWorkspace,
} from '../util/test-workspace';

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
  test('Should focus existing editor instead of opening duplicate', async () => {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');

    const workspace = await setupTestWorkspace();
    try {
      const implementationFile = await createImplementationFile(workspace, 'implementation_file');
      const unitTestFile = await createUnitTestFile(workspace, 'implementation_file');

      // Open both files in different editors
      const implementationDoc = await vscode.workspace.openTextDocument(implementationFile);
      const testDoc = await vscode.workspace.openTextDocument(unitTestFile);

      // Open implementation in first editor group
      await vscode.window.showTextDocument(implementationDoc, { viewColumn: vscode.ViewColumn.One });

      // Open test in second editor group
      await vscode.window.showTextDocument(testDoc, { viewColumn: vscode.ViewColumn.Two });

      // Verify we have two editors open
      const editors = vscode.window.visibleTextEditors;
      assert.strictEqual(editors.length, 2, 'Should have two editors open');

      // Toggle from test to implementation
      await vscode.commands.executeCommand('python-test-switcher.toggleTestAndImplementation');

      // Verify editor layout and focus after toggle
      const editorsAfterToggle = vscode.window.visibleTextEditors;
      assert.strictEqual(editorsAfterToggle.length, 2, 'Should still have two editors open');

      // Verify left editor is implementation file
      const leftEditor = editorsAfterToggle.find(e => e.viewColumn === vscode.ViewColumn.One);
      assert.ok(leftEditor, 'Should have an editor in the left column');
      assert.strictEqual(
        leftEditor.document.uri.fsPath,
        implementationFile,
        'Left editor should be the implementation file'
      );

      // Verify right editor is test file
      const rightEditor = editorsAfterToggle.find(e => e.viewColumn === vscode.ViewColumn.Two);
      assert.ok(rightEditor, 'Should have an editor in the right column');
      assert.strictEqual(
        rightEditor.document.uri.fsPath,
        unitTestFile,
        'Right editor should be the test file'
      );

      // Verify left editor (implementation) is focused
      assert.strictEqual(
        vscode.window.activeTextEditor?.viewColumn,
        vscode.ViewColumn.One,
        'Left editor should be focused'
      );
      assert.strictEqual(
        vscode.window.activeTextEditor?.document.uri.fsPath,
        implementationFile,
        'Focused editor should be the implementation file'
      );
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

async function verifyActiveEditor(expectedPath: string, message: string): Promise<void> {
  const activeEditor = vscode.window.activeTextEditor;
  assert.ok(activeEditor, 'Active editor should be defined');
  assert.strictEqual(activeEditor.document.uri.fsPath, expectedPath, message);
}
