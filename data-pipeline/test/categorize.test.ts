import { classify, isMarine, isTentOnlyCampsite } from '../src/categorize.ts';

const cats = (tags: Record<string, string>) => classify(tags).categories;

describe('classify (OSM tags → category)', () => {
  it.each([
    [{ tourism: 'caravan_site' }, ['caravan_site']],
    [{ tourism: 'camp_site' }, ['camp_site']],
    [{ amenity: 'sanitary_dump_station' }, ['dump_station']],
    [{ amenity: 'water_point' }, ['water']],
    [{ highway: 'rest_area' }, ['rest_area']],
    [{ highway: 'services' }, ['rest_area']],
    [{ amenity: 'fuel', 'fuel:lpg': 'yes' }, ['lpg']],
    [{ shop: 'gas' }, ['lpg']],
  ])('%j → %j', (tags, expected) => {
    expect(cats(tags)).toEqual(expected);
  });

  it('adds dump station / water for features that offer them', () => {
    expect(cats({ tourism: 'camp_site', sanitary_dump_station: 'yes' })).toEqual([
      'camp_site',
      'dump_station',
    ]);
    expect(cats({ amenity: 'fuel', sanitary_dump_station: 'customers' })).toEqual(['dump_station']);
    expect(cats({ amenity: 'sanitary_dump_station', water_point: 'yes' })).toEqual([
      'dump_station',
      'water',
    ]);
    expect(cats({ tourism: 'caravan_site', sanitary_dump_station: 'no' })).toEqual([
      'caravan_site',
    ]);
  });

  it('ignores fuel stations without LPG and unrelated features', () => {
    expect(cats({ amenity: 'fuel' })).toEqual([]);
    expect(cats({ amenity: 'fuel', 'fuel:lpg': 'no' })).toEqual([]);
    expect(cats({ amenity: 'bench' })).toEqual([]);
  });

  it('drops private, disused and closed features', () => {
    expect(cats({ tourism: 'caravan_site', access: 'private' })).toEqual([]);
    expect(cats({ tourism: 'caravan_site', access: 'no' })).toEqual([]);
    expect(cats({ tourism: 'camp_site', disused: 'yes' })).toEqual([]);
    expect(cats({ amenity: 'water_point', opening_hours: 'closed' })).toEqual([]);
    expect(cats({ amenity: 'sanitary_dump_station', access: 'customers' })).toEqual([
      'dump_station',
    ]);
  });

  describe('drinking water', () => {
    it('counts directly when caravans/motorhomes are welcome', () => {
      expect(classify({ amenity: 'drinking_water', caravans: 'yes' })).toEqual({
        categories: ['water'],
        drinkingWaterCandidate: false,
      });
      expect(cats({ amenity: 'drinking_water', motorhome: 'yes' })).toEqual(['water']);
    });

    it('is otherwise only a candidate (decided by distance to a dump station)', () => {
      expect(classify({ amenity: 'drinking_water' })).toEqual({
        categories: [],
        drinkingWaterCandidate: true,
      });
    });
  });
});

describe('isTentOnlyCampsite', () => {
  it.each([
    [{ backcountry: 'yes' }, true],
    [{ camp_site: 'basic' }, true],
    [{ camp_site: 'backcountry' }, true],
    [{ motor_vehicle: 'no' }, true],
    [{ caravans: 'no', motorhome: 'no' }, true],
    [{ caravans: 'no' }, false],
    [{ camp_site: 'basic', motorhome: 'yes' }, false],
    [{ backcountry: 'yes', caravans: 'yes' }, false],
    [{}, false],
  ])('%j → %s', (tags, expected) => {
    expect(isTentOnlyCampsite(tags)).toBe(expected);
  });
});

describe('marine facilities (boats, not motorhomes)', () => {
  it.each([
    [{ amenity: 'sanitary_dump_station', 'seamark:type': 'small_craft_facility' }, []],
    [{ amenity: 'water_point', 'seamark:small_craft_facility:category': 'water_tap' }, []],
    [{ waterway: 'sanitary_dump_station' }, []],
    [{ amenity: 'sanitary_dump_station', boat: 'yes' }, []],
    [{ amenity: 'drinking_water', motorboat: 'yes' }, []],
    [{ leisure: 'marina', water_point: 'yes', sanitary_dump_station: 'yes' }, []],
    // explicitly for motorhomes too → kept
    [{ amenity: 'sanitary_dump_station', boat: 'yes', motorhome: 'yes' }, ['dump_station']],
    // a campsite at a marina keeps its camping category but not a marine dump station
    [
      { tourism: 'camp_site', sanitary_dump_station: 'yes', 'seamark:type': 'harbour' },
      ['camp_site'],
    ],
  ])('%j → %j', (tags, expected) => {
    expect(cats(tags)).toEqual(expected);
  });

  it('isMarine', () => {
    expect(isMarine({ 'seamark:type': 'harbour' })).toBe(true);
    expect(isMarine({ amenity: 'water_point' })).toBe(false);
    expect(isMarine({ boat: 'yes', caravans: 'yes' })).toBe(false);
  });
});
