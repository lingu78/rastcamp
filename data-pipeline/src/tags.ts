import type { OsmTags } from './categorize.ts';
import { TAG_KEYS, type PoiTags, type TagKey } from './schema.ts';

/** Output key ← OSM keys to read it from, in priority order. */
const SOURCES: Partial<Record<TagKey, string[]>> = {
  phone: ['phone', 'contact:phone', 'contact:mobile', 'mobile'],
  website: ['website', 'contact:website', 'url'],
  'description:nb': ['description:nb', 'description:no'],
};

const MAX_LENGTH: Partial<Record<TagKey, number>> = {
  description: 500,
  'description:sv': 500,
  'description:nb': 500,
  'description:en': 500,
};
const DEFAULT_MAX_LENGTH = 200;

function clean(value: string, max: number): string {
  const trimmed = value.replace(/\s+/g, ' ').trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1).trimEnd()}…` : trimmed;
}

/** Keeps only the whitelisted keys (spec F6), normalising contact aliases. */
export function pickTags(tags: OsmTags): PoiTags {
  const out: PoiTags = {};
  for (const key of TAG_KEYS) {
    for (const source of SOURCES[key] ?? [key]) {
      const value = tags[source];
      if (value !== undefined && value.trim() !== '') {
        out[key] = clean(value, MAX_LENGTH[key] ?? DEFAULT_MAX_LENGTH);
        break;
      }
    }
  }
  return out;
}

/** Best display name; empty string means "use the category name" in the app. */
export function pickName(tags: OsmTags): string {
  const value =
    tags.name ??
    tags['name:sv'] ??
    tags['name:nb'] ??
    tags['name:no'] ??
    tags['name:en'] ??
    tags.official_name ??
    tags.brand ??
    '';
  return clean(value, DEFAULT_MAX_LENGTH);
}
