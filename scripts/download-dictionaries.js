#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Duplicate of src/config.ts AVAILABLE_LANGUAGES dictionary URLs so that
// postinstall (plain node, dist/ not built yet) can download without tsx.
// Source: https://github.com/wooorm/dictionaries — keep in sync with config.ts.
const DICTIONARY_URLS = {
  'en-US': {
    dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/en/index.dic',
    aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/en/index.aff',
  },
  'en-GB': {
    dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/en-GB/index.dic',
    aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/en-GB/index.aff',
  },
  es: {
    dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/es/index.dic',
    aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/es/index.aff',
  },
  fr: {
    dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/fr/index.dic',
    aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/fr/index.aff',
  },
  de: {
    dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/de/index.dic',
    aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/de/index.aff',
  },
  pt: {
    dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/pt/index.dic',
    aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/pt/index.aff',
  },
  'pt-BR': {
    dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/pt-BR/index.dic',
    aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/pt-BR/index.aff',
  },
  it: {
    dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/it/index.dic',
    aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/it/index.aff',
  },
  nl: {
    dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/nl/index.dic',
    aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/nl/index.aff',
  },
  pl: {
    dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/pl/index.dic',
    aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/pl/index.aff',
  },
  ru: {
    dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/ru/index.dic',
    aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/ru/index.aff',
  },
  uk: {
    dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/uk/index.dic',
    aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/uk/index.aff',
  },
  sv: {
    dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/sv/index.dic',
    aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/sv/index.aff',
  },
  da: {
    dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/da/index.dic',
    aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/da/index.aff',
  },
  nb: {
    dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/nb/index.dic',
    aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/nb/index.aff',
  },
};

const dictDir = path.join(__dirname, '..', 'dictionaries');

async function downloadFile(url, filepath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.statusText}`);
  }
  const data = await response.text();
  await fs.writeFile(filepath, data, 'utf-8');
  console.log(`Downloaded: ${path.basename(filepath)}`);
}

async function downloadDictionaries(languagesToDownload = null) {
  await fs.mkdir(dictDir, { recursive: true });

  const force = process.env.SPELLCHECKER_FORCE_DOWNLOAD === '1';
  let codes;
  if (languagesToDownload) {
    codes = languagesToDownload.split(',').map((s) => s.trim()).filter(Boolean);
  } else if (process.env.SPELLCHECKER_LANGUAGES) {
    codes = process.env.SPELLCHECKER_LANGUAGES.split(',').map((s) => s.trim()).filter(Boolean);
  } else {
    codes = Object.keys(DICTIONARY_URLS).filter((code) => DICTIONARY_URLS[code]);
  }

  console.log(`Downloading dictionaries for: ${codes.join(', ')}`);
  for (const code of codes) {
    const urls = DICTIONARY_URLS[code];
    if (!urls) {
      console.error(`No dictionary URL configured for ${code}`);
      continue;
    }
    const dicPath = path.join(dictDir, `${code}.dic`);
    const affPath = path.join(dictDir, `${code}.aff`);
    const hasDic = force ? false : (await fs.stat(dicPath).then(() => true).catch(() => false));
    const hasAff = force ? false : (await fs.stat(affPath).then(() => true).catch(() => false));
    if (hasDic && hasAff) {
      console.log(`Skipping ${code} — already present`);
      continue;
    }
    console.log(`\nDownloading ${code} dictionary...`);
    try {
      await Promise.all([
        downloadFile(urls.dic, dicPath),
        downloadFile(urls.aff, affPath),
      ]);
    } catch (error) {
      console.error(`Failed to download ${code} dictionary:`, error.message);
    }
  }
  console.log('\nDictionary download complete!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const languageArg = args.find((arg) => arg.startsWith('--languages='));
  const languages = languageArg ? languageArg.split('=')[1] : null;
  downloadDictionaries(languages).catch(console.error);
}

export { downloadDictionaries };
