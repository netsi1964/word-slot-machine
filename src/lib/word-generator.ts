export const languageCodes = ['en', 'da', 'es', 'zh-Hans'] as const;
export type Language = (typeof languageCodes)[number];
export type Parts = { prefixes: string[]; roots: string[]; suffixes: string[]; label: string };
export type Dataset = { schemaVersion: number; defaultLanguage: Language; languages: Record<Language, Parts> };
export type Word = { prefix: string; root: string; suffix: string; value: string };

export function pick<T>(items: readonly T[]): T {
  if (items.length === 0) throw new Error('Cannot select from an empty word list');
  const array = new Uint32Array(1);
  const range = 0x100000000;
  const limit = Math.floor(range / items.length) * items.length;
  let num: number;
  do { crypto.getRandomValues(array); num = array[0]; } while (num >= limit);
  return items[num % items.length];
}

export function generate(parts: Parts): Word {
  const prefix = pick(parts.prefixes);
  const root = pick(parts.roots);
  const suffix = pick(parts.suffixes);
  return { prefix, root, suffix, value: prefix + root + suffix };
}

export function isLanguage(value: string): value is Language {
  return (languageCodes as readonly string[]).includes(value);
}
