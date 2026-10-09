import type { Category } from './schema.ts';

export type OsmTags = Record<string, string>;

/**
 * Result of classifying one OSM object. `drinkingWaterCandidate` marks an
 * `amenity=drinking_water` that only counts as "Vatten" if it lies within 50 m of a
 * dump station (decided later, once all dump stations are known).
 */
export type Classification = { categories: Category[]; drinkingWaterCandidate: boolean };

const YES = new Set(['yes', 'designated', 'permissive']);
const NO_ACCESS = new Set(['no', 'private']);
const DUMP_STATION_VALUES = new Set(['yes', 'customers', 'public', 'permissive']);

const isYes = (value: string | undefined) => value !== undefined && YES.has(value);

/** Motorhomes/caravans explicitly welcome. */
export function vehiclesWelcome(tags: OsmTags): boolean {
  return isYes(tags.motorhome) || isYes(tags.caravans) || isYes(tags.caravan);
}

function isClosedOrPrivate(tags: OsmTags): boolean {
  if (tags.access && NO_ACCESS.has(tags.access)) return true;
  if (tags.disused === 'yes' || tags.abandoned === 'yes') return true;
  if (tags.opening_hours === 'closed' || tags.opening_hours === 'off') return true;
  return false;
}

/**
 * Campsites that are useless for a motorhome/caravan: backcountry/wild sites and
 * basic tent sites without vehicle access – unless motorhomes are explicitly allowed.
 */
export function isTentOnlyCampsite(tags: OsmTags): boolean {
  if (vehiclesWelcome(tags)) return false;
  if (tags.backcountry === 'yes') return true;
  if (tags.camp_site === 'basic' || tags.camp_site === 'backcountry') return true;
  if (tags.motor_vehicle === 'no' || tags.motorcar === 'no') return true;
  if (tags.caravans === 'no' && tags.motorhome === 'no') return true;
  return false;
}

/** Maps the tags of one OSM object to Rastcamp categories (spec §5.2, see DECISIONS.md). */
export function classify(tags: OsmTags): Classification {
  const categories: Category[] = [];
  let drinkingWaterCandidate = false;

  if (isClosedOrPrivate(tags)) return { categories, drinkingWaterCandidate };

  if (tags.tourism === 'caravan_site') categories.push('caravan_site');
  if (tags.tourism === 'camp_site' && !isTentOnlyCampsite(tags)) categories.push('camp_site');

  const dumpTagged =
    tags.sanitary_dump_station !== undefined && DUMP_STATION_VALUES.has(tags.sanitary_dump_station);
  if (tags.amenity === 'sanitary_dump_station' || dumpTagged) categories.push('dump_station');

  if (tags.amenity === 'water_point' || tags.water_point === 'yes') {
    categories.push('water');
  } else if (tags.amenity === 'drinking_water') {
    if (vehiclesWelcome(tags)) categories.push('water');
    else drinkingWaterCandidate = true;
  }

  if (tags.highway === 'rest_area' || tags.highway === 'services') categories.push('rest_area');

  if ((tags.amenity === 'fuel' && tags['fuel:lpg'] === 'yes') || tags.shop === 'gas') {
    categories.push('lpg');
  }

  return { categories, drinkingWaterCandidate };
}

/**
 * Filter expressions for `osmium tags-filter` – a superset of what `classify` accepts,
 * so the expensive PBF pass keeps everything we might need.
 */
export const OSMIUM_FILTERS = [
  'nwr/tourism=caravan_site,camp_site',
  'nwr/amenity=sanitary_dump_station,water_point,drinking_water',
  'nwr/sanitary_dump_station',
  'nwr/water_point',
  'nwr/highway=rest_area,services',
  'nwr/fuel:lpg=yes',
  'nwr/shop=gas',
];
