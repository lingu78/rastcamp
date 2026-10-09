import type { TFunction } from 'i18next';

import type { AppLanguage } from '@/i18n/language';

import type { Poi } from './pois';
import type { PoiTags } from './schema';

export type Field = {
  id: string;
  label: string;
  value: string;
  /** How the value is presented/acted on in the detail view. */
  kind: 'text' | 'phone' | 'url' | 'paragraph';
  /** Raw value for actions (phone number / URL). */
  raw?: string;
};

const VALUE_KEYS: Record<string, string> = {
  yes: 'values.yes',
  no: 'values.no',
  customers: 'values.customers',
  limited: 'values.limited',
  leashed: 'values.leashed',
  outside: 'values.outside',
  designated: 'values.yes',
  permissive: 'values.yes',
  free: 'values.no',
};

function translateValue(value: string, t: TFunction): string {
  const key = VALUE_KEYS[value.toLowerCase()];
  return key ? t(key as never) : value;
}

/** Description in the user's language if OSM has one, else the generic one. */
function description(tags: PoiTags, language: AppLanguage): string | undefined {
  const localized = tags[`description:${language}` as keyof PoiTags];
  return (
    localized ??
    tags.description ??
    tags['description:en'] ??
    tags['description:sv'] ??
    tags['description:nb']
  );
}

/** First phone number of a possibly ";"-separated list. */
const firstOf = (value: string) => value.split(';')[0]!.trim();

/**
 * The OSM fields shown in the detail view (spec F6), in display order.
 * Fields without data are omitted.
 */
export function detailFields(poi: Poi, t: TFunction, language: AppLanguage): Field[] {
  const tags = poi.tags;
  const fields: Field[] = [];
  const add = (
    id: string,
    label: string,
    value: string | undefined,
    kind: Field['kind'] = 'text',
    raw?: string,
  ) => {
    if (value !== undefined && value !== '') fields.push({ id, label, value, kind, raw });
  };
  const yesNo = (id: string, labelKey: string, value: string | undefined) =>
    add(id, t(labelKey as never), value === undefined ? undefined : translateValue(value, t));

  if (tags.charge) add('fee', t('fields.fee'), tags.charge);
  else yesNo('fee', 'fields.fee', tags.fee);

  if (tags.opening_hours) {
    add(
      'opening_hours',
      t('fields.opening_hours'),
      tags.opening_hours === '24/7' ? t('values.always') : tags.opening_hours,
    );
  }
  if (tags.phone)
    add('phone', t('fields.phone'), firstOf(tags.phone), 'phone', firstOf(tags.phone));
  if (tags.website) {
    const url = /^https?:\/\//i.test(tags.website) ? tags.website : `https://${tags.website}`;
    add(
      'website',
      t('fields.website'),
      url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, ''),
      'url',
      url,
    );
  }

  yesNo('power_supply', 'fields.power_supply', tags.power_supply);
  yesNo('shower', 'fields.shower', tags.shower);
  yesNo('toilets', 'fields.toilets', tags.toilets);

  const water = tags.water_point === 'yes' ? 'yes' : tags.drinking_water;
  if (poi.cat !== 'water') yesNo('water', 'fields.water', water);

  if (poi.cat !== 'dump_station')
    yesNo('dump_station', 'fields.dump_station', tags.sanitary_dump_station);
  yesNo('grey_water', 'fields.grey_water', tags['sanitary_dump_station:grey_water']);
  yesNo('chemical_toilet', 'fields.chemical_toilet', tags['sanitary_dump_station:chemical_toilet']);
  yesNo('black_water', 'fields.black_water', tags['sanitary_dump_station:black_water']);

  add('capacity', t('fields.capacity'), tags.capacity);
  add('capacity_motorhome', t('fields.capacity_motorhome'), tags['capacity:motorhome']);
  add('capacity_caravans', t('fields.capacity_caravans'), tags['capacity:caravans']);

  yesNo('dog', 'fields.dog', tags.dog);

  add('description', t('fields.description'), description(tags, language), 'paragraph');
  return fields;
}
