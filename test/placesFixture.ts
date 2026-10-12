/** Small places.json for tests (same format as the pipeline output). */
export const testPlaceFile = {
  schema: 1,
  version: '2026-10-12',
  attribution: '© OpenStreetMap contributors',
  license: 'ODbL-1.0',
  types: ['city', 'town', 'village', 'hamlet', 'suburb', 'island', 'archipelago', 'national_park'],
  countries: ['FI', 'NO', 'SE'],
  places: [
    ['Helsinki', 60.17, 24.94, 0, 0, -1, 674500, ['Helsingfors', 'Stadi']],
    ['Stockholm', 59.33, 18.07, 0, 2, -1, 984748],
    ['Östersund', 63.176, 14.636, 1, 2, -1, 52000],
    ['Storuman', 65.1, 17.1, 1, 2, -1, 2200],
    ['Åre', 63.399, 13.081, 2, 2, -1, 0],
    ['Odensala', 63.18, 14.64, 2, 2, 2, 0],
    ['Berg', 63.0, 14.0, 3, 2, 2, 0],
    ['Berg', 59.5, 17.5, 3, 2, 1, 0],
    ['Södermalm', 59.31, 18.07, 4, 2, 1, 0],
    ['Gotland', 57.5, 18.5, 5, 2, -1, 0],
    ['Lofoten', 68.2, 14.0, 6, 1, -1, 0],
    ['Abisko nationalpark', 68.05, 18.1, 7, 2, -1, 0, ['Abisko National Park']],
  ],
};
