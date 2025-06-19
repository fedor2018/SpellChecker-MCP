# SpellChecker MCP Server - Development Commands

# Default recipe - show available commands
default:
    @just --list

# Install dependencies
install:
    yarn install

# Build the project
build:
    yarn build

# Run development server
dev:
    yarn dev

# Run type checking
check:
    yarn typecheck

# Clean build artifacts
clean:
    rm -rf dist/
    rm -rf node_modules/

# Fresh install - clean and reinstall everything
fresh: clean install build

# Download/update dictionary files
dictionaries:
    node scripts/download-dictionaries.js

# Test the MCP server locally with a sample request
test-local:
    echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | yarn start

# Build and prepare for publishing
prepare: clean install dictionaries build check

# Run continuous build in watch mode
watch:
    tsc --watch

# Check for outdated dependencies
outdated:
    yarn outdated

# Update dependencies
update:
    yarn upgrade-interactive

# View Claude prompt history (if available)
claude-history:
    @if [ -f ~/.claude_global_prompts.log ]; then \
        tail -n 100 ~/.claude_global_prompts.log | \
        awk 'BEGIN {print "=== Last 100 Claude Prompts ==="} \
             /^[0-9]{4}-[0-9]{2}-[0-9]{2}/ {if (NR>1) print "---"; print} \
             !/^[0-9]{4}-[0-9]{2}-[0-9]{2}/ {print}' | \
        less; \
    else \
        echo "No Claude prompt history found at ~/.claude_global_prompts.log"; \
    fi