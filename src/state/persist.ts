import AsyncStorage from '@react-native-async-storage/async-storage';

/** JSON helpers around AsyncStorage that never throw (storage failures must not crash the app). */
export async function loadJson<T>(
  key: string,
  isValid: (value: unknown) => value is T,
): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return null;
    const value: unknown = JSON.parse(raw);
    return isValid(value) ? value : null;
  } catch {
    return null;
  }
}

export async function saveJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Best effort – losing a preference is not worth crashing for.
  }
}
