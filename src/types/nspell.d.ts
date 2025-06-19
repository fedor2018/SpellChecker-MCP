declare module 'nspell' {
  interface NSpell {
    correct(word: string): boolean;
    suggest(word: string): string[];
    add(word: string): void;
    remove(word: string): void;
    wordCharacters(): string;
    dictionary(words: string[]): void;
    personal(words: string[]): void;
  }

  function nspell(aff: Buffer | string, dic: Buffer | string): NSpell;

  export = nspell;
}