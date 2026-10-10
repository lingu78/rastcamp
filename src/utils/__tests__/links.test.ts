import type { Poi } from '@/data/pois';

import { mapLinkUrl, navigationUrl, osmUrl, reportUrl } from '../links';

const poi: Poi = {
  key: 'w42/caravan_site',
  osmId: 'w42',
  cat: 'caravan_site',
  lat: 59.91,
  lon: 10.75,
  name: 'Bobil & Co',
  tags: {},
};

describe('links (F6)', () => {
  it('opens Apple Maps on iOS', () => {
    expect(navigationUrl(poi, 'Bobil & Co', 'ios')).toBe(
      'https://maps.apple.com/?daddr=59.910000,10.750000&q=Bobil%20%26%20Co&dirflg=d',
    );
  });

  it('uses a geo: intent on Android', () => {
    expect(navigationUrl(poi, 'Bobil & Co', 'android')).toBe(
      'geo:59.910000,10.750000?q=59.910000,10.750000(Bobil%20%26%20Co)',
    );
  });

  it('reports errors as a new OSM note at the place', () => {
    expect(reportUrl(poi)).toBe(
      'https://www.openstreetmap.org/note/new?lat=59.910000&lon=10.750000#map=18/59.910000/10.750000',
    );
  });

  it('links to the OSM object and map', () => {
    expect(osmUrl(poi)).toBe('https://www.openstreetmap.org/way/42');
    expect(osmUrl({ ...poi, osmId: 'n7' })).toBe('https://www.openstreetmap.org/node/7');
    expect(mapLinkUrl(poi)).toContain('mlat=59.910000&mlon=10.750000');
  });
});
