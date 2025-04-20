import {
  setupTestWorkspace,
  createImplementationFile,
  createUnitTestFile,
  createIntegrationTestFile
} from './test-workspace';

async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const includeFiles = args.includes('--include-files');

    // Get the base file name from arguments if provided
    const baseFileNameArg = args.find(arg => arg.startsWith('--base-name='));
    const baseFileName = baseFileNameArg
      ? baseFileNameArg.split('=')[1]
      : 'example';

    // Set up the workspace
    const workspace = await setupTestWorkspace();
    console.log(`Test workspace created at: ${workspace.root}`);

    // Create files if requested
    if (includeFiles) {
      const implementationFile = await createImplementationFile(workspace, baseFileName);
      const unitTestFile = await createUnitTestFile(workspace, baseFileName);
      const integrationTestFile = await createIntegrationTestFile(workspace, baseFileName);

      console.log(`Created files:
      Implementation: ${implementationFile}
      Unit Test: ${unitTestFile}
      Integration Test: ${integrationTestFile}`);
    }

    // Log any unrecognized arguments
    const unrecognizedArgs = args.filter(arg =>
      !arg.startsWith('--include-files') &&
      !arg.startsWith('--base-name=')
    );

    if (unrecognizedArgs.length > 0) {
      console.warn(`Warning: Unrecognized arguments: ${unrecognizedArgs.join(', ')}`);
    }
  } catch (error) {
    console.error(`Error setting up test workspace: ${error}`);
    process.exit(1);
  }
}

main();
