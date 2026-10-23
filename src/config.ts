export interface LanguageConfig {
  code: string;
  name: string;
  enabled: boolean;
  dictionaryUrl?: {
    dic: string;
    aff: string;
  };
}

export const AVAILABLE_LANGUAGES: LanguageConfig[] = [
  {
    code: 'en-US',
    name: 'English (US)',
    enabled: true,
    dictionaryUrl: {
      dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/en/index.dic',
      aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/en/index.aff',
    },
  },
  {
    code: 'en-GB',
    name: 'English (UK)',
    enabled: false,
    dictionaryUrl: {
      dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/en-GB/index.dic',
      aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/en-GB/index.aff',
    },
  },
  {
    code: 'es',
    name: 'Spanish',
    enabled: false,
    dictionaryUrl: {
      dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/es/index.dic',
      aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/es/index.aff',
    },
  },
  {
    code: 'fr',
    name: 'French',
    enabled: false,
    dictionaryUrl: {
      dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/fr/index.dic',
      aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/fr/index.aff',
    },
  },
  {
    code: 'de',
    name: 'German',
    enabled: false,
    dictionaryUrl: {
      dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/de/index.dic',
      aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/de/index.aff',
    },
  },
  {
    code: 'pt',
    name: 'Portuguese',
    enabled: false,
    dictionaryUrl: {
      dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/pt/index.dic',
      aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/pt/index.aff',
    },
  },
  {
    code: 'pt-BR',
    name: 'Portuguese (Brazil)',
    enabled: false,
    dictionaryUrl: {
      dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/pt-BR/index.dic',
      aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/pt-BR/index.aff',
    },
  },
  {
    code: 'it',
    name: 'Italian',
    enabled: false,
    dictionaryUrl: {
      dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/it/index.dic',
      aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/it/index.aff',
    },
  },
  {
    code: 'nl',
    name: 'Dutch',
    enabled: false,
    dictionaryUrl: {
      dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/nl/index.dic',
      aff: 'https://raw.githubusercontent.com/wooom/dictionaries/main/dictionaries/nl/index.aff',
    },
  },
  {
    code: 'pl',
    name: 'Polish',
    enabled: false,
    dictionaryUrl: {
      dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/pl/index.dic',
      aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/pl/index.aff',
    },
  },
  {
    code: 'ru',
    name: 'Russian',
    enabled: false,
    dictionaryUrl: {
      dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/ru/index.dic',
      aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/ru/index.aff',
    },
  },
  {
    code: 'uk',
    name: 'Ukrainian',
    enabled: false,
    dictionaryUrl: {
      dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/uk/index.dic',
      aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/uk/index.aff',
    },
  },
  {
    code: 'sv',
    name: 'Swedish',
    enabled: false,
    dictionaryUrl: {
      dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/sv/index.dic',
      aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/sv/index.aff',
    },
  },
  {
    code: 'da',
    name: 'Danish',
    enabled: false,
    dictionaryUrl: {
      dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/da/index.dic',
      aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/da/index.aff',
    },
  },
  {
    code: 'nb',
    name: 'Norwegian Bokmål',
    enabled: false,
    dictionaryUrl: {
      dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/nb/index.dic',
      aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/nb/index.aff',
    },
  },
];

export function findConfigFile(): string | null {
  const explicit = process.env.SPELLCHECKER_CONFIG;
  if (explicit && fs.existsSync(explicit)) {
    return explicit;
  }
  let dir = path.dirname(url.pathToFileURL(import.meta.url).toString());
  for (let i = 0; i < 4; i++) {
    const candidate = path.join(dir, 'spellchecker.config.json');
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    dir = path.dirname(dir);
  }
  return null;
}

export function loadConfigFile(): { languages?: string[] } | null {
  const configPath = findConfigFile();
  if (!configPath) {
    return null;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as {
      languages?: unknown;
    };
    if (parsed && Array.isArray(parsed.languages)) {
      return parsed as { languages?: string[] };
    }
    console.error(
      `Config file ${configPath} has no "languages" array — ignoring it`,
    );
    return null;
  } catch (error) {
    console.error(
      `Failed to load config file ${configPath}:`,
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

export function getEnabledLanguages(): LanguageConfig[] {
  const enabledLangs = process.env.SPELLCHECKER_LANGUAGES;
  if (enabledLangs) {
    const codes = enabledLangs.split(',').map((s) => s.trim()).filter(Boolean);
    return selectLanguages(codes, 'environment variable');
  }

  const config = loadConfigFile();
  if (config && config.languages && config.languages.length > 0) {
    const codes = config.languages;
    return selectLanguages(codes, 'config file');
  }

  return AVAILABLE_LANGUAGES.filter((lang) => lang.enabled);
}

function selectLanguages(codes: string[], source: string): LanguageConfig[] {
  const unknown = codes.filter(
    (code) => !AVAILABLE_LANGUAGES.some((lang) => lang.code === code),
  );
  if (unknown.length > 0) {
    console.error(
      `Unknown language code(s) in ${source}: ${unknown.join(', ')} — skipped`,
    );
  }
  return AVAILABLE_LANGUAGES.filter((lang) => codes.includes(lang.code));
}

import { createRequire } from 'module';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
