import appJson from '../../../app.json';
import en from '../../../locales/en.json';
import nb from '../../../locales/nb.json';
import sv from '../../../locales/sv.json';

// iOS permission texts (Info.plist, localized via app.json "locales").
describe('iOS Info.plist strings', () => {
  it('has the same keys in every language', () => {
    const keys = Object.keys(en.ios).sort();
    expect(Object.keys(sv.ios).sort()).toEqual(keys);
    expect(Object.keys(nb.ios).sort()).toEqual(keys);
  });

  it('declares a motion purpose string', () => {
    // expo-location links CoreMotion, so App Store Connect rejects uploads without
    // NSMotionUsageDescription (ITMS-90683) even though the app never asks for motion data.
    const location = appJson.expo.plugins.find(
      (p): p is [string, Record<string, unknown>] => Array.isArray(p) && p[0] === 'expo-location',
    );
    expect(typeof location?.[1].motionUsagePermission).toBe('string');
    for (const strings of [sv, nb, en]) {
      expect(strings.ios.NSMotionUsageDescription.length).toBeGreaterThan(20);
    }
  });
});
