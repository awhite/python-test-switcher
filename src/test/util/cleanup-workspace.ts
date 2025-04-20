import { setupTestWorkspace, cleanupWorkspace } from './test-workspace';

async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const customPath = args.find(arg => arg.startsWith('--path='));

    let workspace;

    if (customPath) {
      // Use the custom path if provided
      const path = customPath.split('=')[1];
      workspace = {
        root: path,
        implementationDir: '',
        testDirs: {
          unit: '',
          integration: ''
        }
      };
    } else {
      // Otherwise, create a new workspace to get the default path
      workspace = await setupTestWorkspace();
    }

    // Clean up the workspace
    await cleanupWorkspace(workspace);
    console.log(`Test workspace cleaned up: ${workspace.root}`);

    // Log any unrecognized arguments
    const unrecognizedArgs = args.filter(arg => !arg.startsWith('--path='));
    if (unrecognizedArgs.length > 0) {
      console.warn(`Warning: Unrecognized arguments: ${unrecognizedArgs.join(', ')}`);
    }
  } catch (error) {
    console.error(`Error cleaning up test workspace: ${error}`);
    process.exit(1);
  }
}

main();
