import i18n from '@/i18n';

import { detailFields } from '../fields';
import type { Poi } from '../pois';

const poi = (tags: Poi['tags'], cat: Poi['cat'] = 'camp_site'): Poi => ({
  key: `w1/${cat}`,
  osmId: 'w1',
  cat,
  lat: 60,
  lon: 15,
  name: 'Test',
  tags,
});

describe('detailFields (F6)', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('sv');
  });
  const fields = (p: Poi) => detailFields(p, i18n.t, 'sv');

  it('shows nothing for a POI without data', () => {
    expect(fields(poi({}))).toEqual([]);
  });

  it('translates yes/no values and labels the spec fields', () => {
    const result = fields(
      poi({
        fee: 'yes',
        power_supply: 'yes',
        shower: 'no',
        toilets: 'yes',
        drinking_water: 'yes',
        sanitary_dump_station: 'yes',
        capacity: '40',
        dog: 'leashed',
      }),
    );
    expect(result.map((f) => [f.label, f.value])).toEqual([
      ['Avgift', 'Ja'],
      ['El', 'Ja'],
      ['Dusch', 'Nej'],
      ['Toalett', 'Ja'],
      ['Vatten', 'Ja'],
      ['Tömning', 'Ja'],
      ['Max antal', '40'],
      ['Hundar tillåtna', 'Ja, kopplade'],
    ]);
  });

  it('prefers charge over fee and turns 24/7 into words', () => {
    const result = fields(poi({ fee: 'yes', charge: '150 SEK', opening_hours: '24/7' }));
    expect(result.map((f) => f.value)).toEqual(['150 SEK', 'Dygnet runt']);
  });

  it('makes phone and website actionable', () => {
    const result = fields(poi({ phone: '+46 8 123 45 67;+46 70 000', website: 'www.example.se/' }));
    expect(result).toEqual([
      expect.objectContaining({ kind: 'phone', value: '+46 8 123 45 67', raw: '+46 8 123 45 67' }),
      expect.objectContaining({ kind: 'url', value: 'example.se', raw: 'https://www.example.se/' }),
    ]);
  });

  it('shows grey water / cassette disposal for dump stations, without repeating "Tömning"', () => {
    const result = fields(
      poi(
        {
          sanitary_dump_station: 'yes',
          'sanitary_dump_station:grey_water': 'yes',
          'sanitary_dump_station:chemical_toilet': 'no',
        },
        'dump_station',
      ),
    );
    expect(result.map((f) => [f.label, f.value])).toEqual([
      ['Tömning gråvatten', 'Ja'],
      ['Tömning kassett', 'Nej'],
    ]);
  });

  it('uses the description in the user language when available', () => {
    const tags = {
      description: 'Generic',
      'description:sv': 'Svensk text',
      'description:nb': 'Norsk tekst',
    };
    expect(fields(poi(tags)).at(-1)).toMatchObject({ kind: 'paragraph', value: 'Svensk text' });
    expect(detailFields(poi(tags), i18n.t, 'nb').at(-1)?.value).toBe('Norsk tekst');
    expect(detailFields(poi({ description: 'Generic' }), i18n.t, 'en').at(-1)?.value).toBe(
      'Generic',
    );
  });
});
