#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DICTIONARY_SOURCES = {
  'en-US': {
    dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/en/index.dic',
    aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/en/index.aff'
  },
  'es': {
    dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/es/index.dic',
    aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/es/index.aff'
  },
  'fr': {
    dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/fr/index.dic',
    aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/fr/index.aff'
  },
  'de': {
    dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/de/index.dic',
    aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/de/index.aff'
  },
  'pt': {
    dic: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/pt/index.dic',
    aff: 'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/pt/index.aff'
  }
};

async function downloadFile(url, filepath) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download ${url}: ${response.statusText}`);
    }
    const data = await response.text();
    await fs.writeFile(filepath, data, 'utf-8');
    console.log(`Downloaded: ${path.basename(filepath)}`);
  } catch (error) {
    console.error(`Error downloading ${url}:`, error.message);
    throw error;
  }
}

async function downloadDictionaries() {
  const dictDir = path.join(__dirname, '..', 'dictionaries');
  
  // Create dictionaries directory if it doesn't exist
  await fs.mkdir(dictDir, { recursive: true });
  
  console.log('Downloading dictionaries...');
  
  for (const [lang, sources] of Object.entries(DICTIONARY_SOURCES)) {
    console.log(`\nDownloading ${lang} dictionary...`);
    
    try {
      await Promise.all([
        downloadFile(sources.dic, path.join(dictDir, `${lang}.dic`)),
        downloadFile(sources.aff, path.join(dictDir, `${lang}.aff`))
      ]);
    } catch (error) {
      console.error(`Failed to download ${lang} dictionary:`, error.message);
      // Continue with other dictionaries even if one fails
    }
  }
  
  console.log('\nDictionary download complete!');
}

// Run the download if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  downloadDictionaries().catch(console.error);
}

export { downloadDictionaries };