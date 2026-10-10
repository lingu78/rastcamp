/**
 * Runs publish.sh against a local bare repository (PAGES_REMOTE) and checks what lands on
 * the gh-pages branch: the privacy policy gets the contact address, or is left out.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const PUBLISH = resolve(__dirname, '../publish.sh');

function publish(env: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'rastcamp-pages-'));
  const remote = join(dir, 'remote.git');
  execFileSync('git', ['init', '-q', '--bare', remote]);
  const result = spawnSync('bash', [PUBLISH], {
    encoding: 'utf8',
    env: { ...process.env, PAGES_REMOTE: remote, CONTACT_EMAIL: '', ...env },
  });
  const checkout = join(dir, 'site');
  if (result.status === 0) {
    execFileSync('git', ['clone', '-q', '--branch', 'gh-pages', remote, checkout]);
  }
  return { ...result, checkout };
}

describe('publish.sh (GitHub Pages)', () => {
  it('fills the contact address into the privacy policy', () => {
    const run = publish({ CONTACT_EMAIL: ' rastcamp+app@example.org\n' });
    expect(run.status).toBe(0);
    const html = readFileSync(join(run.checkout, 'privacy/index.html'), 'utf8');
    expect(html).toContain('href="mailto:rastcamp+app@example.org"');
    expect(html).not.toContain('{{CONTACT_EMAIL}}');
    expect(existsSync(join(run.checkout, '.nojekyll'))).toBe(true);
  });

  it('leaves the privacy policy out without a contact address', () => {
    const run = publish({});
    expect(run.status).toBe(0);
    expect(run.stdout).toContain('CONTACT_EMAIL is not set');
    expect(existsSync(join(run.checkout, 'privacy'))).toBe(false);
    expect(existsSync(join(run.checkout, 'index.html'))).toBe(true);
  });

  it('gets the repository variable from the Data workflow', () => {
    // Repository variables are not environment variables unless a step passes them on.
    const workflow = readFileSync(resolve(__dirname, '../../.github/workflows/data.yml'), 'utf8');
    expect(workflow).toContain('CONTACT_EMAIL: ${{ vars.CONTACT_EMAIL }}');
  });

  it('fails instead of publishing a malformed address', () => {
    const run = publish({ CONTACT_EMAIL: 'not-an-address' });
    expect(run.status).not.toBe(0);
    expect(run.stdout).toContain('does not look like an e-mail address');
  });
});
