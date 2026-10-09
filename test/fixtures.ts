import type { PoiFile } from '@/data/schema';

/** Small, hand-made dataset around Oslo/Stockholm for component tests. */
export const testPoiFile: PoiFile = {
  schema: 1,
  version: '2026-10-08',
  dataTimestamp: '2026-10-08T20:21:06Z',
  generated: '2026-10-09T00:00:00.000Z',
  attribution: '© OpenStreetMap contributors',
  license: 'ODbL-1.0',
  categories: ['caravan_site', 'camp_site', 'dump_station', 'water', 'rest_area', 'lpg'],
  pois: [
    ['n1', 0, 59.91, 10.75, 'Bobilparkering Sentrum', { fee: 'yes', power_supply: 'yes' }],
    [
      'w2',
      1,
      59.95,
      10.8,
      'Fjordcamping',
      { shower: 'yes', toilets: 'yes', website: 'https://example.no' },
    ],
    ['w2', 2, 59.95, 10.8, 'Fjordcamping'],
    ['n3', 2, 59.33, 18.06, '', { fee: 'no', 'sanitary_dump_station:grey_water': 'yes' }],
    ['n4', 3, 59.34, 18.07, 'Vattenpost'],
    ['n5', 4, 60.5, 15.0, ''],
    ['n6', 5, 59.3, 18.1, 'Gasolbutiken', { opening_hours: 'Mo-Fr 08:00-17:00' }],
  ],
};
