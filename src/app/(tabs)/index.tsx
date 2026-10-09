import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/theme/useTheme';

// Placeholder until M3 (MapLibre map, markers, filter chips).
export default function MapScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.flex}>
        <EmptyState title={t('tabs.map')} hint={t('map.placeholder')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
