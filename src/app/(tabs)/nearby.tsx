import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/EmptyState';
import { FilterChips } from '@/components/FilterChips';
import { PoiRow } from '@/components/PoiRow';
import { SearchField } from '@/components/SearchField';
import { ThemedText } from '@/components/ThemedText';
import { usePoiData } from '@/data/DataProvider';
import type { Poi } from '@/data/pois';
import { nearbyRows } from '@/data/nearbyRows';
import { useSelectedCategories, visibleCategories } from '@/state/filters';
import { useReferencePoint } from '@/state/location';

/** "Närmast" (spec F5) + name search (F11). Works fully offline (F7). */
export default function NearbyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const data = usePoiData();
  const selected = useSelectedCategories();
  const reference = useReferencePoint();
  const [query, setQuery] = useState('');
  const { lat, lon } = reference;

  const rows = useMemo(
    () => nearbyRows(data, visibleCategories(selected), query, lat, lon),
    [data, selected, query, lat, lon],
  );

  const openPoi = useCallback(
    (poi: Poi) => router.push({ pathname: '/place/[key]', params: { key: poi.key } }),
    [router],
  );

  return (
    <View style={styles.flex}>
      <FlatList
        data={rows}
        keyExtractor={(poi) => poi.key}
        renderItem={({ item }) => <PoiRow poi={item} from={reference} onPress={openPoi} />}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        initialNumToRender={15}
        ListHeaderComponent={
          <View>
            <SearchField value={query} onChange={setQuery} />
            <FilterChips />
            <ThemedText secondary variant="caption" style={styles.reference}>
              {reference.source === 'gps' ? t('nearby.fromPosition') : t('nearby.fromMapCenter')}
            </ThemedText>
          </View>
        }
        ListEmptyComponent={
          <EmptyState title={query ? t('nearby.noResults') : t('nearby.empty')} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  reference: { paddingHorizontal: 16, paddingBottom: 8 },
});
