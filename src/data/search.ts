import type { Category } from './schema';
import type { Poi } from './pois';

const FOLD: Record<string, string> = {
  å: 'a',
  ä: 'a',
  à: 'a',
  á: 'a',
  â: 'a',
  ã: 'a',
  æ: 'ae',
  ö: 'o',
  ø: 'o',
  ó: 'o',
  ò: 'o',
  ô: 'o',
  õ: 'o',
  é: 'e',
  è: 'e',
  ê: 'e',
  ë: 'e',
  ü: 'u',
  ú: 'u',
  ù: 'u',
  û: 'u',
  í: 'i',
  ì: 'i',
  î: 'i',
  ï: 'i',
  ç: 'c',
  ñ: 'n',
  ß: 'ss',
  ð: 'd',
  þ: 'th',
  š: 's',
  ž: 'z',
};

/**
 * Lower-cases and folds Nordic/Latin diacritics ("Östersund" → "ostersund") so a search
 * works without special characters. No String.normalize – not guaranteed on Hermes.
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\x00-\x7f]/g, (ch) => FOLD[ch] ?? ch)
    .replace(/[^a-z0-9\u0080-￿]+/g, ' ')
    .trim();
}

export function buildSearchIndex(pois: Poi[]): string[] {
  return pois.map((poi) => normalizeText(poi.name));
}

/**
 * Local name search (spec F11): every query word must occur in the name.
 * Returns matching POIs of the visible categories; caller sorts by distance.
 */
export function searchPois(
  pois: Poi[],
  index: string[],
  query: string,
  categories: readonly Category[],
): Poi[] {
  const words = normalizeText(query).split(' ').filter(Boolean);
  if (words.length === 0) return [];
  const allowed = new Set(categories);
  const result: Poi[] = [];
  for (let i = 0; i < pois.length; i++) {
    const name = index[i]!;
    if (name && allowed.has(pois[i]!.cat) && words.every((w) => name.includes(w)))
      result.push(pois[i]!);
  }
  return result;
}
