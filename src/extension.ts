import * as vscode from 'vscode';
import { NodeFileSystem } from './services/fileSystem';
import { PathService } from './services/pathService';
import { TestService } from './services/testService';
import { TestType } from './types';

async function openOrFocusDocument(filePath: string): Promise<void> {
  const openEditors = vscode.window.visibleTextEditors;
  const existingEditor = openEditors.find(editor => editor.document.uri.fsPath === filePath);

  if (existingEditor) {
    await vscode.window.showTextDocument(existingEditor.document, { viewColumn: existingEditor.viewColumn });
  } else {
    const doc = await vscode.workspace.openTextDocument(filePath);
    await vscode.window.showTextDocument(doc);
  }
}

export function activate(context: vscode.ExtensionContext) {
  const fileSystem = new NodeFileSystem();
  const pathService = new PathService(fileSystem);
  const testService = new TestService(fileSystem, pathService);

  const toggleTestAndImplementation = vscode.commands.registerCommand(
    'python-test-switcher.toggleTestAndImplementation',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        await vscode.window.showInformationMessage('No active editor. Please open a Python file first.');
        return;
      }

      if (editor.document.languageId !== 'python') {
        await vscode.window.showInformationMessage('This command only works with Python files.');
        return;
      }

      const currentFile = editor.document.uri;
      const currentFilePath = currentFile.fsPath;
      const projectRoot = await pathService.findProjectRoot(currentFilePath);

      if (!projectRoot) {
        await vscode.window.showErrorMessage('No pyproject.toml found in parent directories');
        return;
      }

      try {
        if (pathService.isTestFile(currentFilePath)) {
          await handleTestFile(currentFilePath, projectRoot, pathService);
        } else {
          await handleImplementationFile(currentFilePath, projectRoot, testService);
        }
      } catch (error) {
        if (error instanceof Error) {
          await vscode.window.showErrorMessage(error.message);
        }
      }
    },
  );

  context.subscriptions.push(toggleTestAndImplementation);
}

async function handleTestFile(currentFilePath: string, projectRoot: string, pathService: PathService): Promise<void> {
  const implementationPath = pathService.getImplementationFilePath(projectRoot, currentFilePath);
  let fileExists = false;
  try {
    await vscode.workspace.fs.stat(vscode.Uri.file(implementationPath));
    fileExists = true;
  } catch {
    fileExists = false;
  }

  if (!fileExists) {
    await vscode.window.showErrorMessage(`Could not find implementation file: ${implementationPath}`);
    return;
  }

  await openOrFocusDocument(implementationPath);
}

async function handleImplementationFile(
  currentFilePath: string,
  projectRoot: string,
  testService: TestService,
): Promise<void> {
  const testFiles = await testService.findTestFiles(projectRoot, currentFilePath);

  if (testFiles.length === 0) {
    const testTypes: TestType[] = ['unit', 'integration'];
    const choice = await vscode.window.showQuickPick(
      testTypes.map((type) => testService.getTestTypeDisplay(type)),
      { placeHolder: 'Select test type to create' },
    );

    if (choice) {
      const selectedType = testTypes.find((type) => testService.getTestTypeDisplay(type) === choice) as TestType;
      const testPath = await testService.createTestFile(projectRoot, currentFilePath, selectedType);
      await openOrFocusDocument(testPath);
    }
  } else if (testFiles.length === 1) {
    await openOrFocusDocument(testFiles[0].path);
  } else {
    const choice = await vscode.window.showQuickPick(
      testFiles.map((f) => testService.getTestTypeDisplay(f.type)),
      { placeHolder: 'Select test type to open' },
    );

    if (choice) {
      const testFile = testFiles.find((f) => testService.getTestTypeDisplay(f.type) === choice);
      if (testFile) {
        await openOrFocusDocument(testFile.path);
      }
    }
  }
}

export function deactivate() {}
