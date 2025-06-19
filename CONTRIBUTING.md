# Contributing to SpellChecker MCP Server

Thank you for your interest in contributing to the SpellChecker MCP Server! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/spellchecker-mcp-server.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Install dependencies: `yarn install`

## Development Process

1. Make your changes
2. Run type checking: `yarn typecheck`
3. Build the project: `yarn build`
4. Test your changes locally
5. Commit your changes with a descriptive message
6. Push to your fork and create a pull request

## Code Style

- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable and function names
- Add types for all function parameters and return values

## Adding New Languages

To add support for a new language:

1. Add the dictionary source URLs to `scripts/download-dictionaries.js`
2. Update the language list in `src/index.ts`
3. Update the README to include the new language
4. Test the implementation thoroughly

## Testing

Currently, the project uses manual testing. When testing:

1. Build the project: `yarn build`
2. Test each tool with various inputs
3. Verify error handling works correctly
4. Check that the server starts and responds to MCP requests

## Pull Request Process

1. Ensure your code follows the project style
2. Update the README if you've added new features
3. Add your changes to the appropriate section
4. Create a pull request with a clear description of changes

## Reporting Issues

- Use the GitHub issue tracker
- Include steps to reproduce the issue
- Provide error messages and logs if applicable
- Specify your environment (OS, Node version, etc.)

## Questions?

Feel free to open an issue for any questions about contributing.