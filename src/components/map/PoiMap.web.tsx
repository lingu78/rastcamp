// Web is only a development preview target (see DECISIONS.md) – MapLibre RN has no web
// renderer, so the map is replaced by a placeholder there.
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/theme/useTheme';

import type { PoiMapHandle } from './PoiMap';

export { MAP_STYLES } from './PoiMap.styles';
export type { PoiMapHandle };

export function PoiMap(_props: { ref?: unknown }) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: theme.surfaceAlt }]}>
      <ThemedText secondary>{t('map.a11yLabel')}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center', justifyContent: 'center' } });
