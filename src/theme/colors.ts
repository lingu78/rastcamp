/**
 * Design tokens. Forest green base, warm orange accent, neutral grey background.
 * Every text/background pair used in the UI is checked for WCAG AA contrast in
 * `src/theme/__tests__/contrast.test.ts`.
 */
export const palette = {
  light: {
    primary: '#2E6B3F',
    onPrimary: '#FFFFFF',
    accent: '#B4530F',
    onAccent: '#FFFFFF',
    background: '#F2F3F1',
    surface: '#FFFFFF',
    surfaceAlt: '#E4E7E3',
    border: '#C9CEC8',
    text: '#1A1F1B',
    textSecondary: '#4F5A53',
    tabInactive: '#5E6962',
  },
  dark: {
    primary: '#7CC392',
    onPrimary: '#0E1F14',
    accent: '#F2A05A',
    onAccent: '#24140A',
    background: '#111412',
    surface: '#1B201D',
    surfaceAlt: '#262C28',
    border: '#3A423D',
    text: '#ECEFEC',
    textSecondary: '#A8B2AB',
    tabInactive: '#97A39B',
  },
} as const;

export type ColorScheme = keyof typeof palette;
export type ThemeColors = { [K in keyof (typeof palette)['light']]: string };
