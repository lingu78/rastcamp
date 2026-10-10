import '@/i18n';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { PoiDataProvider } from '@/data/DataProvider';
import { restoreFavorites } from '@/state/favorites';
import { restoreFilters } from '@/state/filters';
import { restoreLanguage } from '@/state/language';
import { initLocation } from '@/state/location';
import { palette } from '@/theme/colors';
import { useColorSchemeName } from '@/theme/useTheme';

// Deep links straight into a place still get the tabs underneath (so "close" has somewhere to go).
export const unstable_settings = { initialRouteName: '(tabs)' };

function navigationTheme(scheme: 'light' | 'dark'): Theme {
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const c = palette[scheme];
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: c.primary,
      background: c.background,
      card: c.surface,
      text: c.text,
      border: c.border,
      notification: c.accent,
    },
  };
}

export default function RootLayout() {
  const scheme = useColorSchemeName();
  const { t } = useTranslation();

  useEffect(() => {
    void restoreFilters();
    void restoreFavorites();
    void restoreLanguage();
    void initLocation();
  }, []);

  return (
    <ThemeProvider value={navigationTheme(scheme)}>
      <PoiDataProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="place/[key]"
            options={{
              title: t('place.title'),
              presentation: 'formSheet',
              sheetAllowedDetents: [0.5, 1],
              sheetGrabberVisible: true,
              headerShown: false,
            }}
          />
          <Stack.Screen name="licenses" options={{ title: t('licenses.title') }} />
        </Stack>
      </PoiDataProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
