import { pickName, pickTags } from '../src/tags.ts';

describe('pickTags', () => {
  it('keeps whitelisted keys only', () => {
    expect(
      pickTags({ fee: 'yes', shower: 'no', operator: 'X', 'addr:street': 'Y', toilets: 'yes' }),
    ).toEqual({ fee: 'yes', shower: 'no', toilets: 'yes' });
  });

  it('normalises contact aliases with priority', () => {
    expect(pickTags({ 'contact:phone': '+47 1', 'contact:website': 'https://a.no' })).toEqual({
      phone: '+47 1',
      website: 'https://a.no',
    });
    expect(pickTags({ phone: '+46 1', 'contact:phone': '+46 2' })).toEqual({ phone: '+46 1' });
    expect(pickTags({ url: 'https://b.se' })).toEqual({ website: 'https://b.se' });
    expect(pickTags({ 'description:no': 'Fin plass' })).toEqual({ 'description:nb': 'Fin plass' });
  });

  it('collapses whitespace, drops empty values and truncates long text', () => {
    expect(pickTags({ description: '  a \n  b  ', fee: '  ' })).toEqual({ description: 'a b' });
    const long = 'x'.repeat(800);
    const out = pickTags({ description: long, opening_hours: long });
    expect(out.description).toHaveLength(500);
    expect(out.description!.endsWith('…')).toBe(true);
    expect(out.opening_hours).toHaveLength(200);
  });
});

describe('pickName', () => {
  it('prefers name, then localized names, then brand', () => {
    expect(pickName({ name: 'A', brand: 'B' })).toBe('A');
    expect(pickName({ 'name:sv': 'Svenska', brand: 'B' })).toBe('Svenska');
    expect(pickName({ brand: 'Circle K' })).toBe('Circle K');
    expect(pickName({ operator: 'Kommun' })).toBe('');
  });
});
