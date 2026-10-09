import { resolveLanguage } from '../language';

const loc = (languageTag: string) => ({
  languageTag,
  languageCode: languageTag.split('-')[0] ?? null,
});

describe('resolveLanguage', () => {
  it.each([
    ['sv-SE', 'sv'],
    ['sv-FI', 'sv'],
    ['nb-NO', 'nb'],
    ['no-NO', 'nb'],
    ['nn-NO', 'nb'],
    ['da-DK', 'nb'],
    ['en-GB', 'en'],
    ['en-US', 'en'],
    ['de-DE', 'en'],
    ['fi-FI', 'en'],
  ])('%s → %s', (tag, expected) => {
    expect(resolveLanguage([loc(tag)])).toBe(expected);
  });

  it('walks the preferred-locale list until it finds a supported language', () => {
    expect(resolveLanguage([loc('fi-FI'), loc('sv-FI'), loc('en-US')])).toBe('sv');
    expect(resolveLanguage([loc('de-DE'), loc('nb-NO')])).toBe('nb');
  });

  it('falls back to English for an empty list', () => {
    expect(resolveLanguage([])).toBe('en');
  });

  it('uses the language tag when languageCode is missing', () => {
    expect(resolveLanguage([{ languageCode: null, languageTag: 'sv-SE' }])).toBe('sv');
  });
});
