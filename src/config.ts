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
      aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/en/index.aff'
    }
  },
  {
    code: 'en-GB',
    name: 'English (UK)',
    enabled: false,
    dictionaryUrl: {
      dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/en-GB/index.dic',
      aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/en-GB/index.aff'
    }
  },
  {
    code: 'es',
    name: 'Spanish',
    enabled: false,
    dictionaryUrl: {
      dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/es/index.dic',
      aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/es/index.aff'
    }
  },
  {
    code: 'fr',
    name: 'French',
    enabled: false,
    dictionaryUrl: {
      dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/fr/index.dic',
      aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/fr/index.aff'
    }
  },
  {
    code: 'de',
    name: 'German',
    enabled: false,
    dictionaryUrl: {
      dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/de/index.dic',
      aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/de/index.aff'
    }
  },
  {
    code: 'pt',
    name: 'Portuguese',
    enabled: false,
    dictionaryUrl: {
      dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/pt/index.dic',
      aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/pt/index.aff'
    }
  },
  {
    code: 'pt-BR',
    name: 'Portuguese (Brazil)',
    enabled: false,
    dictionaryUrl: {
      dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/pt-BR/index.dic',
      aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/pt-BR/index.aff'
    }
  },
  {
    code: 'it',
    name: 'Italian',
    enabled: false,
    dictionaryUrl: {
      dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/it/index.dic',
      aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/it/index.aff'
    }
  },
  {
    code: 'nl',
    name: 'Dutch',
    enabled: false,
    dictionaryUrl: {
      dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/nl/index.dic',
      aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/nl/index.aff'
    }
  },
  {
    code: 'pl',
    name: 'Polish',
    enabled: false,
    dictionaryUrl: {
      dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/pl/index.dic',
      aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/pl/index.aff'
    }
  },
  {
    code: 'ru',
    name: 'Russian',
    enabled: false,
    dictionaryUrl: {
      dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/ru/index.dic',
      aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/ru/index.aff'
    }
  },
  {
    code: 'uk',
    name: 'Ukrainian',
    enabled: false,
    dictionaryUrl: {
      dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/uk/index.dic',
      aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/uk/index.aff'
    }
  },
  {
    code: 'sv',
    name: 'Swedish',
    enabled: false,
    dictionaryUrl: {
      dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/sv/index.dic',
      aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/sv/index.aff'
    }
  },
  {
    code: 'da',
    name: 'Danish',
    enabled: false,
    dictionaryUrl: {
      dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/da/index.dic',
      aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/da/index.aff'
    }
  },
  {
    code: 'nb',
    name: 'Norwegian Bokmål',
    enabled: false,
    dictionaryUrl: {
      dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/nb/index.dic',
      aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/nb/index.aff'
    }
  }
];

export function getEnabledLanguages(): LanguageConfig[] {
  // Check for environment variable or config file
  const configPath = process.env.SPELLCHECKER_CONFIG;
  
  if (configPath) {
    try {
      const config = require(configPath);
      if (config.languages) {
        return AVAILABLE_LANGUAGES.filter(lang => 
          config.languages.includes(lang.code)
        );
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  }
  
  // Check for environment variable with comma-separated language codes
  const enabledLangs = process.env.SPELLCHECKER_LANGUAGES;
  if (enabledLangs) {
    const codes = enabledLangs.split(',').map(s => s.trim());
    return AVAILABLE_LANGUAGES.filter(lang => codes.includes(lang.code));
  }
  
  // Default: return languages marked as enabled
  return AVAILABLE_LANGUAGES.filter(lang => lang.enabled);
}