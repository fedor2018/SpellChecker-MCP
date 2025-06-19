#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the language configuration
async function loadLanguageConfig() {
  try {
    const configModule = await import('../dist/config.js');
    return configModule.AVAILABLE_LANGUAGES;
  } catch (error) {
    // Fallback to basic config if dist doesn't exist
    return [
      { code: 'en-US', name: 'English (US)', enabled: true },
      { code: 'es', name: 'Spanish', enabled: false },
      { code: 'fr', name: 'French', enabled: false }
    ];
  }
}

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

async function downloadDictionaries(languagesToDownload = null) {
  const dictDir = path.join(__dirname, '..', 'dictionaries');
  
  // Create dictionaries directory if it doesn't exist
  await fs.mkdir(dictDir, { recursive: true });
  
  // Load language configuration
  const availableLanguages = await loadLanguageConfig();
  
  // Determine which languages to download
  let languages;
  if (languagesToDownload) {
    // Download specific languages from command line args
    const requestedCodes = languagesToDownload.split(',').map(s => s.trim());
    languages = availableLanguages.filter(lang => requestedCodes.includes(lang.code));
  } else if (process.env.SPELLCHECKER_LANGUAGES) {
    // Download languages from environment variable
    const envCodes = process.env.SPELLCHECKER_LANGUAGES.split(',').map(s => s.trim());
    languages = availableLanguages.filter(lang => envCodes.includes(lang.code));
  } else {
    // Download only enabled languages
    languages = availableLanguages.filter(lang => lang.enabled);
  }
  
  console.log(`Downloading dictionaries for: ${languages.map(l => l.code).join(', ')}`);
  
  for (const lang of languages) {
    console.log(`\nDownloading ${lang.name} (${lang.code}) dictionary...`);
    
    if (!lang.dictionaryUrl) {
      console.error(`No dictionary URL configured for ${lang.code}`);
      continue;
    }
    
    try {
      await Promise.all([
        downloadFile(lang.dictionaryUrl.dic, path.join(dictDir, `${lang.code}.dic`)),
        downloadFile(lang.dictionaryUrl.aff, path.join(dictDir, `${lang.code}.aff`))
      ]);
    } catch (error) {
      console.error(`Failed to download ${lang.code} dictionary:`, error.message);
      // Continue with other dictionaries even if one fails
    }
  }
  
  console.log('\nDictionary download complete!');
}

// Run the download if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Check for command line arguments
  const args = process.argv.slice(2);
  const languageArg = args.find(arg => arg.startsWith('--languages='));
  const languages = languageArg ? languageArg.split('=')[1] : null;
  
  downloadDictionaries(languages).catch(console.error);
}

export { downloadDictionaries };