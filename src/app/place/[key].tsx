import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CategoryIcon } from '@/components/CategoryIcon';
import { EmptyState } from '@/components/EmptyState';
import { ThemedText } from '@/components/ThemedText';
import { usePoiData } from '@/data/DataProvider';
import { useTheme } from '@/theme/useTheme';

// Detail sheet. Full field list and actions (navigate, favourite, share, report) arrive in M4 (F6).
export default function PlaceScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { byKey } = usePoiData();
  const { t } = useTranslation();
  const theme = useTheme();
  const poi = key ? byKey.get(key) : undefined;

  if (!poi) return <EmptyState title={t('place.notFound')} />;
  const categoryName = t(`categories.${poi.cat}`);

  return (
    <ScrollView style={{ backgroundColor: theme.surface }} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <CategoryIcon category={poi.cat} size={44} />
        <View style={styles.headerText}>
          <ThemedText variant="title" accessibilityRole="header">
            {poi.name || categoryName}
          </ThemedText>
          <ThemedText secondary>{categoryName}</ThemedText>
        </View>
      </View>
      <ThemedText secondary variant="caption">
        {poi.lat.toFixed(5)}, {poi.lon.toFixed(5)}
      </ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerText: { flex: 1, gap: 2 },
});
