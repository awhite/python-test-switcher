# Python Test Switcher

A VS Code extension that allows you to quickly switch between Python implementation files and their corresponding test files. This extension makes it easy to navigate between your Python code and its tests, improving your development workflow.

## Features

- 🔄 Quick switching between implementation and test files
- 🎯 Specific test file pattern matching:
  - From implementation to test: `foo/bar/my_module.py` → `tests/unit/foo/bar/test_my_module.py` or `tests/integration/foo/bar/test_my_module.py`
  - From test to implementation
- 🆕 Automatic creation of test files when they don't exist yet:
  - Prompts to create missing test files
  - Choose between unit or integration test location
  - Creates directory structure if needed
- ⌨️ Keyboard shortcuts for instant switching
- 🎮 Command palette integration

## Installation

### From VS Code Marketplace
1. Open VS Code
2. Go to the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`)
3. Search for "Python Test Switcher"
4. Click Install

### From Source
1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to compile the extension
4. Press F5 in VS Code to start debugging

### From VSIX Package
1. Download the latest `.vsix` file from the [GitHub releases page](https://github.com/awhite/python-test-switcher/releases)
2. Open VS Code
3. Go to the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`)
4. Click the "..." menu in the top-right
5. Select "Install from VSIX..."
6. Navigate to and select the downloaded `.vsix` file
7. Restart VS Code if prompted

## Usage

### Keyboard Shortcuts
- Windows/Linux: `Ctrl+Shift+I`
- Mac: `Cmd+Alt+T`

### Command Palette
1. Open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type "Toggle between Test and Implementation file"
3. Press Enter

### How It Works
1. Open any Python file (implementation or test)
2. Use the keyboard shortcut or command palette
3. The extension will automatically find and switch to the corresponding file

## Requirements

- VS Code 1.85.0 or higher
- Python files in your workspace

## Configuration

The extension automatically detects common test file patterns. If your project uses a different convention, you may need to modify the extension code.

## Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have suggestions, please:
1. Check the [known issues](#known-issues) section
2. Search for existing issues in the repository
3. Create a new issue if needed

## Known Issues

- The extension assumes common test file naming patterns. If your project uses a different convention, you may need to modify the extension code.
- Currently doesn't support custom test file patterns through configuration (planned for future releases)

## Release Notes

See the [CHANGELOG.md](CHANGELOG.md) for detailed release notes and version history.
