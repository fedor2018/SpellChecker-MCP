#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import nspell from 'nspell';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getEnabledLanguages, LanguageConfig } from './config.js';
import { FileScanner, ScanOptions } from './fileScanner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SpellCheckResult {
  word: string;
  suggestions: string[];
  line?: number;
  column?: number;
}

interface SpellCheckResponse {
  misspellings: SpellCheckResult[];
  total: number;
}

interface LanguageChecker {
  checker: any;
  code: string;
  name: string;
}

class SpellCheckerServer {
  private server: Server;
  private spellCheckers: Map<string, LanguageChecker> = new Map();
  private defaultLanguage: string = 'en-US';

  constructor() {
    this.server = new Server(
      {
        name: 'spellchecker-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.initializeSpellChecker();
  }

  private async initializeSpellChecker() {
    const dictDir = path.join(__dirname, '../dictionaries');
    const languages = getEnabledLanguages();
    
    console.error(`Initializing spell checkers for ${languages.length} language(s)...`);

    for (const lang of languages) {
      try {
        const dicPath = path.join(dictDir, `${lang.code}.dic`);
        const affPath = path.join(dictDir, `${lang.code}.aff`);
        
        const [dicBuffer, affBuffer] = await Promise.all([
          fs.readFile(dicPath),
          fs.readFile(affPath),
        ]);

        const checker = nspell(affBuffer, dicBuffer);
        this.spellCheckers.set(lang.code, {
          checker,
          code: lang.code,
          name: lang.name
        });
        
        console.error(`Loaded ${lang.name} dictionary`);
      } catch (error) {
        console.error(`Failed to load ${lang.name} dictionary:`, error instanceof Error ? error.message : String(error));
      }
    }

    if (this.spellCheckers.size === 0) {
      console.error('No dictionaries loaded. Please run: npm run postinstall');
    }
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'check_spelling',
          description: 'Check spelling in the provided text and return misspellings with suggestions',
          inputSchema: {
            type: 'object',
            properties: {
              text: {
                type: 'string',
                description: 'The text to check for spelling errors',
              },
              language: {
                type: 'string',
                description: 'Language code (e.g., en-US, es, fr, de, pt)',
                default: 'en-US',
              },
              includeLineNumbers: {
                type: 'boolean',
                description: 'Whether to include line and column numbers for each misspelling',
                default: false,
              },
            },
            required: ['text'],
          },
        } as Tool,
        {
          name: 'add_to_dictionary',
          description: 'Add a word to the personal dictionary',
          inputSchema: {
            type: 'object',
            properties: {
              word: {
                type: 'string',
                description: 'The word to add to the dictionary',
              },
              language: {
                type: 'string',
                description: 'Language code (e.g., en-US, es, fr, de, pt)',
                default: 'en-US',
              },
            },
            required: ['word'],
          },
        } as Tool,
        {
          name: 'is_correct',
          description: 'Check if a single word is spelled correctly',
          inputSchema: {
            type: 'object',
            properties: {
              word: {
                type: 'string',
                description: 'The word to check',
              },
              language: {
                type: 'string',
                description: 'Language code (e.g., en-US, es, fr, de, pt)',
                default: 'en-US',
              },
            },
            required: ['word'],
          },
        } as Tool,
        {
          name: 'get_suggestions',
          description: 'Get spelling suggestions for a word',
          inputSchema: {
            type: 'object',
            properties: {
              word: {
                type: 'string',
                description: 'The word to get suggestions for',
              },
              language: {
                type: 'string',
                description: 'Language code (e.g., en-US, es, fr, de, pt)',
                default: 'en-US',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of suggestions to return',
                default: 5,
              },
            },
            required: ['word'],
          },
        } as Tool,
        {
          name: 'list_languages',
          description: 'List all available languages for spell checking',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        } as Tool,
        {
          name: 'check_file',
          description: 'Check spelling in a file with syntax-aware parsing',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: {
                type: 'string',
                description: 'Path to the file to check',
              },
              language: {
                type: 'string',
                description: 'Language code for spell checking',
                default: 'en-US',
              },
              syntaxAware: {
                type: 'boolean',
                description: 'Enable syntax-aware parsing for code files',
                default: true,
              },
            },
            required: ['filePath'],
          },
        } as Tool,
        {
          name: 'check_folder',
          description: 'Check spelling in all files in a folder',
          inputSchema: {
            type: 'object',
            properties: {
              folderPath: {
                type: 'string',
                description: 'Path to the folder to check',
              },
              language: {
                type: 'string',
                description: 'Language code for spell checking',
                default: 'en-US',
              },
              recursive: {
                type: 'boolean',
                description: 'Check files recursively in subfolders',
                default: true,
              },
              fileTypes: {
                type: 'array',
                items: { type: 'string' },
                description: 'File extensions to check (e.g., [".js", ".md"])',
              },
              syntaxAware: {
                type: 'boolean',
                description: 'Enable syntax-aware parsing for code files',
                default: true,
              },
            },
            required: ['folderPath'],
          },
        } as Tool,
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (this.spellCheckers.size === 0) {
        throw new Error('No spell checkers initialized');
      }

      switch (request.params.name) {
        case 'check_spelling':
          return this.checkSpelling(request.params.arguments);
        case 'add_to_dictionary':
          return this.addToDictionary(request.params.arguments);
        case 'is_correct':
          return this.isCorrect(request.params.arguments);
        case 'get_suggestions':
          return this.getSuggestions(request.params.arguments);
        case 'list_languages':
          return this.listLanguages();
        case 'check_file':
          return this.checkFile(request.params.arguments);
        case 'check_folder':
          return this.checkFolder(request.params.arguments);
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  private getSpellChecker(language: string): any {
    const langChecker = this.spellCheckers.get(language);
    if (!langChecker) {
      throw new Error(`Language '${language}' not available. Use list_languages to see available options.`);
    }
    return langChecker.checker;
  }

  private async checkSpelling(args: any) {
    const { text, language = this.defaultLanguage, includeLineNumbers = false } = args;
    const spellChecker = this.getSpellChecker(language);
    const misspellings: SpellCheckResult[] = [];
    
    const lines = text.split('\n');
    
    lines.forEach((line: string, lineIndex: number) => {
      const words = line.match(/\b[\w']+\b/g) || [];
      
      words.forEach((word: string) => {
        if (!spellChecker.correct(word)) {
          const result: SpellCheckResult = {
            word,
            suggestions: spellChecker.suggest(word).slice(0, 5),
          };
          
          if (includeLineNumbers) {
            result.line = lineIndex + 1;
            result.column = line.indexOf(word) + 1;
          }
          
          misspellings.push(result);
        }
      });
    });

    const response: SpellCheckResponse = {
      misspellings,
      total: misspellings.length,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  private async addToDictionary(args: any) {
    const { word, language = this.defaultLanguage } = args;
    const spellChecker = this.getSpellChecker(language);
    spellChecker.add(word);
    
    return {
      content: [
        {
          type: 'text',
          text: `Added "${word}" to ${language} dictionary`,
        },
      ],
    };
  }

  private async isCorrect(args: any) {
    const { word, language = this.defaultLanguage } = args;
    const spellChecker = this.getSpellChecker(language);
    const correct = spellChecker.correct(word);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ word, correct }),
        },
      ],
    };
  }

  private async getSuggestions(args: any) {
    const { word, language = this.defaultLanguage, limit = 5 } = args;
    const spellChecker = this.getSpellChecker(language);
    const suggestions = spellChecker.suggest(word).slice(0, limit);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ word, suggestions }),
        },
      ],
    };
  }

  private async listLanguages() {
    const languages = Array.from(this.spellCheckers.entries()).map(([code, info]) => ({
      code,
      name: info.name,
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ languages }, null, 2),
        },
      ],
    };
  }

  private async checkFile(args: any) {
    const { filePath, language = this.defaultLanguage, syntaxAware = true } = args;
    const spellChecker = this.getSpellChecker(language);
    const scanner = new FileScanner(spellChecker);
    
    try {
      const results = await scanner.scanPath(filePath, { syntaxAware });
      const result = results[0];
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              file: result.file,
              fileType: result.language,
              misspellings: result.misspellings,
              total: result.misspellings.length
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to check file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async checkFolder(args: any) {
    const { 
      folderPath, 
      language = this.defaultLanguage, 
      recursive = true, 
      fileTypes,
      syntaxAware = true 
    } = args;
    
    const spellChecker = this.getSpellChecker(language);
    const scanner = new FileScanner(spellChecker);
    
    try {
      const results = await scanner.scanPath(folderPath, {
        recursive,
        fileTypes,
        syntaxAware
      });
      
      const summary = {
        totalFiles: results.length,
        totalMisspellings: results.reduce((sum, r) => sum + r.misspellings.length, 0),
        files: results.map(r => ({
          file: path.relative(folderPath, r.file),
          fileType: r.language,
          misspellings: r.misspellings.length
        }))
      };
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(summary, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to check folder: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('SpellChecker MCP server running on stdio');
  }
}

const server = new SpellCheckerServer();
server.run().catch(console.error);