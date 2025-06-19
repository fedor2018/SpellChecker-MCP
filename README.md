# SpellChecker MCP Server

A fast, multilingual Model Context Protocol (MCP) server that provides spell-checking capabilities to Large Language Models. This server enables LLMs to check spelling, get suggestions, and manage custom dictionaries across multiple languages.

## Features

- **Multi-language support**: English (US), Spanish, French, German, and Portuguese
- **Fast spell checking**: Powered by nspell for efficient processing
- **Custom dictionary management**: Add words to personal dictionaries
- **Line and column tracking**: Optional position information for misspellings
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
      "args": ["/path/to/spellchecker-mcp-server/dist/index.js"]
    }
  }
}
```

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

## Supported Languages

- `en-US` - English (United States)
- `es` - Spanish
- `fr` - French
- `de` - German
- `pt` - Portuguese

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
- **TypeScript**: Type-safe development
- **Dictionary files**: From the wooorm/dictionaries project

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