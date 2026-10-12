import { gunzipSync } from 'node:zlib';

import type { InputFeature } from '../src/build.ts';
import {
  buildPlaces,
  buildPlacesOutput,
  classifyPlace,
  nearestTowns,
  placeAliases,
  type Place,
} from '../src/places.ts';

const point = (lat: number, lon: number) => ({
  type: 'Point' as const,
  coordinates: [lon, lat] as [number, number],
});
const feature = (
  id: string,
  tags: Record<string, string>,
  lat = 63,
  lon = 14,
  country = 'sweden',
): InputFeature => ({ id, tags, geometry: point(lat, lon), country });
const place = (name: string, type: Place['type'], lat: number, lon: number): Place => ({
  id: `n${name}`,
  name,
  aliases: [],
  type,
  lat,
  lon,
  country: 'sweden',
  population: 0,
});

describe('classifyPlace', () => {
  it('accepts named settlements, notable islands and national parks', () => {
    expect(classifyPlace({ place: 'town', name: 'Östersund' })).toBe('town');
    expect(classifyPlace({ place: 'hamlet', name: 'Byn' })).toBe('hamlet');
    expect(classifyPlace({ place: 'suburb', name: 'Södermalm' })).toBe('suburb');
    expect(classifyPlace({ place: 'island', name: 'Gotland', wikidata: 'Q10691' })).toBe('island');
    expect(classifyPlace({ boundary: 'national_park', name: 'Sarek' })).toBe('national_park');
  });

  it('rejects unnamed places, minor islets and other place types', () => {
    expect(classifyPlace({ place: 'village' })).toBeNull();
    expect(classifyPlace({ place: 'village', name: '  ' })).toBeNull();
    expect(classifyPlace({ place: 'island', name: 'Lilla Kobben' })).toBeNull();
    expect(classifyPlace({ place: 'locality', name: 'Gamla kvarnen' })).toBeNull();
    expect(classifyPlace({ place: 'neighbourhood', name: 'Kvarteret' })).toBeNull();
  });
});

describe('placeAliases', () => {
  it('collects translated and alternative names once, without the main name', () => {
    expect(
      placeAliases(
        {
          'name:sv': 'Helsingfors',
          'name:fi': 'Helsinki',
          'name:en': 'helsinki',
          alt_name: 'Stadi; Helsingfors ;',
        },
        'Helsinki',
      ),
    ).toEqual(['Helsingfors', 'Stadi']);
  });
});

describe('buildPlaces', () => {
  it('drops the same place mapped twice and keeps the better-described one', () => {
    const { places, stats } = buildPlaces([
      feature('n1', { place: 'village', name: 'Odensala' }, 63.18, 14.64),
      feature('n2', { place: 'village', name: 'Odensala', population: '300' }, 63.181, 14.641),
      feature('n3', { place: 'village', name: 'Odensala' }, 59.0, 17.0),
    ]);
    expect(places).toHaveLength(2);
    expect(stats.duplicatesRemoved).toBe(1);
    expect(places.find((p) => p.lat > 63)?.population).toBe(300);
  });

  it('uses the centroid for areas and counts per type and country', () => {
    const area: InputFeature = {
      id: 'w9',
      tags: { boundary: 'national_park', name: 'Abisko nationalpark' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [18, 68],
            [18.2, 68],
            [18.2, 68.1],
            [18, 68.1],
            [18, 68],
          ],
        ],
      },
      country: 'sweden',
    };
    const { places, stats } = buildPlaces([
      area,
      feature('n1', { place: 'city', name: 'Oslo' }, 59.9, 10.7, 'norway'),
    ]);
    const park = places.find((p) => p.type === 'national_park')!;
    expect(park.lat).toBeCloseTo(68.05, 3);
    expect(park.lon).toBeCloseTo(18.1, 3);
    expect(stats.counts.national_park.sweden).toBe(1);
    expect(stats.counts.city.norway).toBe(1);
    // Ordered by type: cities first.
    expect(places[0]!.name).toBe('Oslo');
  });
});

describe('nearestTowns', () => {
  it('labels smaller places with the nearest city or town within 50 km', () => {
    const places = [
      place('Östersund', 'town', 63.176, 14.636),
      place('Odensala', 'village', 63.18, 14.64),
      place('Långt bort', 'hamlet', 66.0, 20.0),
      place('Frösön', 'island', 63.19, 14.55),
    ];
    expect(nearestTowns(places)).toEqual([-1, 0, -1, 0]);
  });
});

describe('buildPlacesOutput', () => {
  it('writes compact tuples with type, country, near index, population and aliases', () => {
    const { places } = buildPlaces([
      feature('n1', { place: 'town', name: 'Östersund', population: '52 000' }, 63.176, 14.636),
      feature('n2', { place: 'village', name: 'Odensala' }, 63.18, 14.64),
      feature(
        'n3',
        { place: 'city', name: 'Helsinki', 'name:sv': 'Helsingfors' },
        60.17,
        24.94,
        'finland',
      ),
    ]);
    const { file, json, gzip } = buildPlacesOutput(places, '2026-10-12');
    expect(file.countries).toEqual(['FI', 'SE']);
    expect(file.types[file.places[0]![3]]).toBe('city');
    const helsinki = file.places.find((p) => p[0] === 'Helsinki')!;
    expect(helsinki[7]).toEqual(['Helsingfors']);
    expect(file.countries[helsinki[4]]).toBe('FI');
    const odensala = file.places.find((p) => p[0] === 'Odensala')!;
    expect(file.places[odensala[5]]![0]).toBe('Östersund');
    expect(odensala).toHaveLength(7);
    expect(file.places.find((p) => p[0] === 'Östersund')![6]).toBe(52000);
    expect(JSON.parse(gunzipSync(gzip).toString('utf8'))).toEqual(JSON.parse(json));
  });
});
