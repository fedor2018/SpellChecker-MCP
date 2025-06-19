# SpellChecker MCP Server

A fast, multilingual Model Context Protocol (MCP) server that provides spell-checking capabilities to Large Language Models. This server enables LLMs to check spelling in text, files, and entire projects with syntax-aware parsing for code files.

## Features

- **Multi-language support**: 15+ languages including English, Spanish, French, German, Portuguese, Italian, Dutch, Polish, Russian, Ukrainian, Swedish, Danish, and Norwegian
- **Syntax-aware checking**: Intelligently checks only comments, strings, and documentation in code files
- **File and folder scanning**: Check individual files or entire project directories
- **Modular language activation**: Enable only the languages you need
- **Fast spell checking**: Powered by nspell for efficient processing
- **Custom dictionary management**: Add words to personal dictionaries
- **Smart code parsing**: Understands HTML, JavaScript, TypeScript, Python, and more
- **MCP-compliant**: Works with any MCP-compatible client

## Installation

### As an MCP Server

1. Clone the repository:
```bash
git clone https://github.com/yourusername/spellchecker-mcp-server.git
cd spellchecker-mcp-server
```

2. Install dependencies and build:
```bash
yarn install
yarn build
```

The post-install script will automatically download the required dictionary files.

### Using with Claude Desktop

Add the server to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "spellchecker": {
      "command": "node",
      "args": ["/path/to/spellchecker-mcp-server/dist/index.js"],
      "env": {
        "SPELLCHECKER_LANGUAGES": "en-US,es,fr"
      }
    }
  }
}
```

### Configuring Languages

You can configure which languages to enable in three ways:

1. **Environment variable** (recommended for Claude Desktop):
   ```bash
   SPELLCHECKER_LANGUAGES="en-US,es,fr" node dist/index.js
   ```

2. **Configuration file**:
   ```bash
   SPELLCHECKER_CONFIG="/path/to/spellchecker.config.json" node dist/index.js
   ```

3. **Edit the default in `src/config.ts`** before building

### Using with Other MCP Clients

The server runs on stdio and can be integrated with any MCP-compatible client:

```bash
node /path/to/spellchecker-mcp-server/dist/index.js
```

## Available Tools

### `check_spelling`
Checks text for spelling errors and returns misspellings with suggestions.

**Parameters:**
- `text` (required): The text to check
- `language` (optional): Language code (default: "en-US")
- `includeLineNumbers` (optional): Include line/column positions (default: false)

**Example:**
```json
{
  "text": "This is a tset of the speling checker",
  "language": "en-US",
  "includeLineNumbers": true
}
```

### `is_correct`
Checks if a single word is spelled correctly.

**Parameters:**
- `word` (required): The word to check
- `language` (optional): Language code (default: "en-US")

### `get_suggestions`
Gets spelling suggestions for a word.

**Parameters:**
- `word` (required): The word to get suggestions for
- `language` (optional): Language code (default: "en-US")
- `limit` (optional): Maximum suggestions to return (default: 5)

### `add_to_dictionary`
Adds a word to the personal dictionary for a language.

**Parameters:**
- `word` (required): The word to add
- `language` (optional): Language code (default: "en-US")

### `list_languages`
Lists all available languages for spell checking.

### `check_file`
Checks spelling in a single file with syntax-aware parsing.

**Parameters:**
- `filePath` (required): Path to the file to check
- `language` (optional): Language code (default: "en-US")
- `syntaxAware` (optional): Enable syntax-aware parsing (default: true)

**Example:**
```json
{
  "filePath": "/path/to/app.tsx",
  "language": "en-US",
  "syntaxAware": true
}
```

### `check_folder`
Checks spelling in all files within a folder.

**Parameters:**
- `folderPath` (required): Path to the folder to check
- `language` (optional): Language code (default: "en-US")
- `recursive` (optional): Check subfolders (default: true)
- `fileTypes` (optional): Array of file extensions to check
- `syntaxAware` (optional): Enable syntax-aware parsing (default: true)

**Example:**
```json
{
  "folderPath": "/path/to/project",
  "language": "en-US",
  "recursive": true,
  "fileTypes": [".js", ".tsx", ".md"],
  "syntaxAware": true
}
```

## Supported Languages

The server supports 15+ languages. Enable only what you need:

- `en-US` - English (United States)
- `en-GB` - English (United Kingdom)
- `es` - Spanish
- `fr` - French
- `de` - German
- `pt` - Portuguese
- `pt-BR` - Portuguese (Brazil)
- `it` - Italian
- `nl` - Dutch
- `pl` - Polish
- `ru` - Russian
- `uk` - Ukrainian
- `sv` - Swedish
- `da` - Danish
- `nb` - Norwegian Bokmål

## Syntax-Aware Features

When `syntaxAware` is enabled, the spell checker intelligently parses:

- **Comments**: Single-line and multi-line comments in all major languages
- **String literals**: Only checks strings that look like human-readable text
- **JSX/TSX content**: Text between JSX tags
- **Documentation**: Docstrings, JSDoc comments, etc.
- **Markdown**: Ignores code blocks and inline code
- **HTML/XML**: Checks text content and comments

The checker automatically ignores:
- Variable names and identifiers
- Programming keywords
- URLs and file paths
- Hex colors and numbers
- Code within backticks in Markdown

## Development

### Prerequisites
- Node.js >= 16.0.0
- Yarn package manager

### Setup
```bash
# Install dependencies
yarn install

# Run in development mode
yarn dev

# Build for production
yarn build

# Type check
yarn typecheck
```

### Using Just Commands

If you have [just](https://github.com/casey/just) installed:

```bash
# Show available commands
just

# Fresh install
just fresh

# Run development server
just dev

# Update dictionaries
just dictionaries
```

## Architecture

The server uses:
- **@modelcontextprotocol/sdk**: MCP protocol implementation
- **nspell**: Hunspell-compatible spell checker
- **glob**: File pattern matching for directory scanning
- **TypeScript**: Type-safe development
- **Dictionary files**: From the wooorm/dictionaries project

## Configuration File

Create a `spellchecker.config.json` file:

```json
{
  "languages": ["en-US", "es", "fr"],
  "defaultLanguage": "en-US",
  "scanOptions": {
    "syntaxAware": true,
    "recursive": true,
    "fileTypes": [
      ".txt", ".md", ".mdx",
      ".js", ".jsx", ".ts", ".tsx",
      ".py", ".java", ".go"
    ],
    "ignorePaths": [
      "node_modules",
      ".git",
      "dist",
      "build"
    ]
  }
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Dictionary files from [wooorm/dictionaries](https://github.com/wooorm/dictionaries)
- Built on the [Model Context Protocol](https://modelcontextprotocol.io/)

## Troubleshooting

### Dictionaries not loading
If you see "No dictionaries loaded" error:
```bash
yarn run postinstall
# or
just dictionaries
```

### Server not starting
Ensure you've built the project:
```bash
yarn build
```

### Language not available
Check available languages with the `list_languages` tool or ensure the dictionary files exist in the `dictionaries/` folder.