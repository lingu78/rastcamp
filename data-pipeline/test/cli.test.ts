/**
 * End-to-end run of the CLI on a hand-made OSM fixture (needs osmium-tool).
 * Skipped locally when osmium is missing; CI installs it and sets REQUIRE_OSMIUM=1.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const hasOsmium = spawnSync('osmium', ['--version']).status === 0;
if (!hasOsmium && process.env.REQUIRE_OSMIUM) throw new Error('osmium-tool is required');
const maybe = hasOsmium ? describe : describe.skip;

maybe('pipeline CLI on fixture', () => {
  const dir = mkdtempSync(join(tmpdir(), 'rastcamp-pipeline-'));
  let stdout = '';

  beforeAll(() => {
    stdout = execFileSync(
      process.execPath,
      [
        resolve(__dirname, '../src/run.ts'),
        '--input',
        resolve(__dirname, 'fixtures/sample.osm'),
        '--work',
        join(dir, 'work'),
        '--out',
        join(dir, 'out'),
      ],
      { encoding: 'utf8' },
    );
  }, 60_000);

  it('logs counts per category and succeeds', () => {
    expect(stdout).toMatch(/caravan_site\s+1/);
    expect(stdout).toMatch(/camp_site\s+3/);
    expect(stdout).toContain('✔ Build OK');
  });

  it('writes the expected POIs', () => {
    const file = JSON.parse(readFileSync(join(dir, 'out/pois.json'), 'utf8'));
    const keys = file.pois.map((p: [string, number]) => `${p[0]}/${file.categories[p[1]]}`);
    expect(keys.sort()).toEqual(
      [
        'n1/caravan_site',
        'w100/camp_site',
        'n23/camp_site',
        'r200/camp_site',
        'w100/dump_station',
        'n30/dump_station',
        'n31/water',
        'n33/water',
        'n40/water',
        'n50/rest_area',
        'w101/rest_area',
        'n60/lpg',
        'n61/lpg',
      ].sort(),
    );
    const manifest = JSON.parse(readFileSync(join(dir, 'out/manifest.json'), 'utf8'));
    expect(manifest.count).toBe(13);
  });
});
