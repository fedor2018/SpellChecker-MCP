import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

export interface FileSpellCheckResult {
  file: string;
  language: string;
  misspellings: Array<{
    word: string;
    suggestions: string[];
    line: number;
    column: number;
    context: string;
  }>;
}

export interface ScanOptions {
  recursive?: boolean;
  fileTypes?: string[];
  ignorePaths?: string[];
  ignorePatterns?: RegExp[];
  syntaxAware?: boolean;
}

const DEFAULT_FILE_TYPES = [
  '.txt', '.md', '.mdx', '.rst',
  '.js', '.jsx', '.ts', '.tsx',
  '.py', '.java', '.c', '.cpp', '.cs',
  '.html', '.css', '.scss', '.less',
  '.json', '.yml', '.yaml', '.xml',
  '.sh', '.bash', '.zsh',
  '.go', '.rs', '.rb', '.php'
];

const DEFAULT_IGNORE_PATHS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  'out',
  'vendor',
  'target',
  '__pycache__',
  '.pytest_cache',
  'venv',
  '.env'
];

// Patterns to extract text content from code files
const SYNTAX_PATTERNS = {
  // Comments in various languages
  singleLineComment: /\/\/\s*(.+)$/gm,
  multiLineComment: /\/\*[\s\S]*?\*\//g,
  pythonComment: /#\s*(.+)$/gm,
  htmlComment: /<!--[\s\S]*?-->/g,
  
  // String literals
  doubleQuotedString: /"([^"\\]|\\.)*"/g,
  singleQuotedString: /'([^'\\]|\\.)*'/g,
  templateLiteral: /`([^`\\]|\\.)*`/g,
  
  // JSX/TSX text content
  jsxText: />([^<]+)</g,
  
  // HTML/XML text content
  htmlText: />([^<]+)</g,
  
  // Markdown code blocks to ignore
  codeBlock: /```[\s\S]*?```/g,
  inlineCode: /`[^`]+`/g,
  
  // Variable names and identifiers to ignore
  camelCase: /\b[a-z][a-zA-Z0-9]*\b/g,
  snakeCase: /\b[a-z][a-z0-9_]*\b/g,
  constantCase: /\b[A-Z][A-Z0-9_]*\b/g,
};

export class FileScanner {
  private spellChecker: any;

  constructor(spellChecker: any) {
    this.spellChecker = spellChecker;
  }

  async scanPath(targetPath: string, options: ScanOptions = {}): Promise<FileSpellCheckResult[]> {
    const stats = await fs.stat(targetPath);
    
    if (stats.isFile()) {
      return [await this.scanFile(targetPath, options)];
    } else if (stats.isDirectory()) {
      return this.scanDirectory(targetPath, options);
    }
    
    throw new Error(`Path is neither file nor directory: ${targetPath}`);
  }

  private async scanDirectory(dirPath: string, options: ScanOptions): Promise<FileSpellCheckResult[]> {
    const fileTypes = options.fileTypes || DEFAULT_FILE_TYPES;
    const ignorePaths = options.ignorePaths || DEFAULT_IGNORE_PATHS;
    
    const patterns = fileTypes.map(ext => 
      options.recursive ? `**/*${ext}` : `*${ext}`
    );
    
    const results: FileSpellCheckResult[] = [];
    
    for (const pattern of patterns) {
      const files = await glob(pattern, {
        cwd: dirPath,
        ignore: ignorePaths.map(p => `**/${p}/**`),
        absolute: true
      });
      
      for (const file of files) {
        const result = await this.scanFile(file, options);
        if (result.misspellings.length > 0) {
          results.push(result);
        }
      }
    }
    
    return results;
  }

  private async scanFile(filePath: string, options: ScanOptions): Promise<FileSpellCheckResult> {
    const content = await fs.readFile(filePath, 'utf-8');
    const ext = path.extname(filePath).toLowerCase();
    const lines = content.split('\n');
    const misspellings: FileSpellCheckResult['misspellings'] = [];
    
    if (options.syntaxAware) {
      // Extract only relevant text based on file type
      const extractedTexts = this.extractTextContent(content, ext);
      
      for (const extracted of extractedTexts) {
        const words = this.extractWords(extracted.text);
        for (const word of words) {
          if (!this.shouldIgnoreWord(word, ext) && !this.spellChecker.correct(word)) {
            const position = this.findWordPosition(lines, word, extracted.originalIndex);
            misspellings.push({
              word,
              suggestions: this.spellChecker.suggest(word).slice(0, 5),
              line: position.line,
              column: position.column,
              context: lines[position.line - 1] || ''
            });
          }
        }
      }
    } else {
      // Check all text in file
      lines.forEach((line, lineIndex) => {
        const words = this.extractWords(line);
        words.forEach(word => {
          if (!this.shouldIgnoreWord(word, ext) && !this.spellChecker.correct(word)) {
            misspellings.push({
              word,
              suggestions: this.spellChecker.suggest(word).slice(0, 5),
              line: lineIndex + 1,
              column: line.indexOf(word) + 1,
              context: line
            });
          }
        });
      });
    }
    
    // Detect language from file extension
    const language = this.detectLanguage(ext);
    
    return {
      file: filePath,
      language,
      misspellings
    };
  }

  private extractTextContent(content: string, fileType: string): Array<{text: string, originalIndex: number}> {
    const extracted: Array<{text: string, originalIndex: number}> = [];
    
    switch (fileType) {
      case '.js':
      case '.jsx':
      case '.ts':
      case '.tsx':
        // Extract comments
        this.extractPattern(content, SYNTAX_PATTERNS.singleLineComment, extracted);
        this.extractPattern(content, SYNTAX_PATTERNS.multiLineComment, extracted);
        
        // Extract string literals (but only if they look like prose)
        const strings = [
          ...content.matchAll(SYNTAX_PATTERNS.doubleQuotedString),
          ...content.matchAll(SYNTAX_PATTERNS.singleQuotedString),
          ...content.matchAll(SYNTAX_PATTERNS.templateLiteral)
        ];
        
        for (const match of strings) {
          const str = match[0].slice(1, -1); // Remove quotes
          if (this.looksLikeProse(str)) {
            extracted.push({ text: str, originalIndex: match.index || 0 });
          }
        }
        
        // For JSX/TSX, also extract text between tags
        if (fileType.endsWith('x')) {
          this.extractPattern(content, SYNTAX_PATTERNS.jsxText, extracted);
        }
        break;
        
      case '.html':
      case '.xml':
        // Extract text content and comments
        this.extractPattern(content, SYNTAX_PATTERNS.htmlText, extracted);
        this.extractPattern(content, SYNTAX_PATTERNS.htmlComment, extracted);
        break;
        
      case '.py':
        // Extract comments and docstrings
        this.extractPattern(content, SYNTAX_PATTERNS.pythonComment, extracted);
        this.extractPattern(content, /"""[\s\S]*?"""/g, extracted);
        this.extractPattern(content, /'''[\s\S]*?'''/g, extracted);
        break;
        
      case '.md':
      case '.mdx':
        // Remove code blocks before checking
        let mdContent = content.replace(SYNTAX_PATTERNS.codeBlock, '');
        mdContent = mdContent.replace(SYNTAX_PATTERNS.inlineCode, '');
        extracted.push({ text: mdContent, originalIndex: 0 });
        break;
        
      default:
        // For other file types, extract comments based on common patterns
        this.extractPattern(content, SYNTAX_PATTERNS.singleLineComment, extracted);
        this.extractPattern(content, SYNTAX_PATTERNS.multiLineComment, extracted);
        this.extractPattern(content, SYNTAX_PATTERNS.pythonComment, extracted);
    }
    
    return extracted;
  }

  private extractPattern(content: string, pattern: RegExp, extracted: Array<{text: string, originalIndex: number}>) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const text = match[1] || match[0];
      extracted.push({ 
        text: text.trim(), 
        originalIndex: match.index || 0 
      });
    }
  }

  private looksLikeProse(text: string): boolean {
    // Check if string looks like human-readable prose
    const words = text.split(/\s+/);
    
    // Too short or too long to be prose
    if (words.length < 3 || words.length > 100) return false;
    
    // Contains too many special characters
    const specialChars = text.match(/[^a-zA-Z0-9\s.,!?'"()-]/g);
    if (specialChars && specialChars.length > text.length * 0.1) return false;
    
    // Looks like a path, URL, or identifier
    if (/^[a-zA-Z]:[\\/]/.test(text)) return false; // Windows path
    if (/^\//.test(text)) return false; // Unix path
    if (/^https?:\/\//.test(text)) return false; // URL
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(text)) return false; // Identifier
    
    return true;
  }

  private extractWords(text: string): string[] {
    // Extract words, keeping contractions together
    return text.match(/\b[\w']+\b/g) || [];
  }

  private shouldIgnoreWord(word: string, fileType: string): boolean {
    // Ignore single letters
    if (word.length <= 1) return true;
    
    // Ignore numbers
    if (/^\d+$/.test(word)) return true;
    
    // Ignore common code identifiers based on file type
    if (this.isCodeIdentifier(word, fileType)) return true;
    
    // Ignore all caps (likely constants)
    if (word === word.toUpperCase() && word.length > 2) return true;
    
    // Ignore hex colors
    if (/^[0-9A-Fa-f]{3,8}$/.test(word)) return true;
    
    return false;
  }

  private isCodeIdentifier(word: string, fileType: string): boolean {
    // Common programming keywords to ignore
    const commonKeywords = new Set([
      'const', 'let', 'var', 'function', 'class', 'interface', 'enum',
      'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break',
      'return', 'import', 'export', 'from', 'async', 'await', 'try',
      'catch', 'finally', 'throw', 'new', 'this', 'super', 'extends',
      'implements', 'static', 'public', 'private', 'protected',
      'get', 'set', 'typeof', 'instanceof', 'void', 'null', 'undefined',
      'true', 'false', 'default', 'module', 'require', 'package'
    ]);
    
    return commonKeywords.has(word.toLowerCase());
  }

  private findWordPosition(lines: string[], word: string, startIndex: number): {line: number, column: number} {
    let currentIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineEndIndex = currentIndex + line.length + 1; // +1 for newline
      
      if (currentIndex <= startIndex && startIndex < lineEndIndex) {
        const column = line.indexOf(word, startIndex - currentIndex);
        if (column !== -1) {
          return { line: i + 1, column: column + 1 };
        }
      }
      
      currentIndex = lineEndIndex;
    }
    
    // Fallback
    return { line: 1, column: 1 };
  }

  private detectLanguage(fileExt: string): string {
    const langMap: Record<string, string> = {
      '.js': 'JavaScript',
      '.jsx': 'JavaScript (JSX)',
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript (TSX)',
      '.py': 'Python',
      '.java': 'Java',
      '.c': 'C',
      '.cpp': 'C++',
      '.cs': 'C#',
      '.go': 'Go',
      '.rs': 'Rust',
      '.rb': 'Ruby',
      '.php': 'PHP',
      '.html': 'HTML',
      '.css': 'CSS',
      '.scss': 'SCSS',
      '.md': 'Markdown',
      '.json': 'JSON',
      '.xml': 'XML',
      '.yml': 'YAML',
      '.yaml': 'YAML'
    };
    
    return langMap[fileExt] || 'Text';
  }
}