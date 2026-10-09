import en from '../locales/en.json';
import nb from '../locales/nb.json';
import sv from '../locales/sv.json';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') acc[path] = value;
    else Object.assign(acc, flatten(value, path));
    return acc;
  }, {});
}

const locales = { sv, nb, en } as Record<string, Tree>;
const reference = Object.keys(flatten(sv)).sort();

describe.each(Object.entries(locales))('locale %s', (_name, tree) => {
  const flat = flatten(tree);

  it('has exactly the same keys as sv', () => {
    expect(Object.keys(flat).sort()).toEqual(reference);
  });

  it('has no empty strings', () => {
    for (const [key, value] of Object.entries(flat)) {
      expect({ key, empty: value.trim() === '' }).toEqual({ key, empty: false });
    }
  });
});
