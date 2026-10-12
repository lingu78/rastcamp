import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
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
import { useLocationState, useReferencePoint } from '@/state/location';
import { clearSearchedPlace } from '@/state/searchedPlace';
import { useTheme } from '@/theme/useTheme';

/** "Närmast" (spec F5) + name search (F11). Works fully offline (F7). */
export default function NearbyScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const data = usePoiData();
  const selected = useSelectedCategories();
  const reference = useReferencePoint();
  const { permission } = useLocationState();
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
            <View style={styles.referenceRow}>
              <ThemedText secondary variant="caption" style={styles.reference}>
                {reference.source === 'place'
                  ? t('nearby.fromPlace', { place: reference.name })
                  : reference.source === 'gps'
                    ? t('nearby.fromPosition')
                    : permission === 'granted'
                      ? t('nearby.waitingForPosition')
                      : t('nearby.fromMapCenter')}
              </ThemedText>
              {reference.source === 'place' ? (
                <Pressable
                  onPress={clearSearchedPlace}
                  accessibilityRole="button"
                  accessibilityLabel={t('search.clearPlace', { place: reference.name })}
                  hitSlop={8}
                  style={styles.referenceAction}>
                  <ThemedText variant="caption" style={{ color: theme.primary }}>
                    {t('search.clear')}
                  </ThemedText>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => router.push('/search')}
                  accessibilityRole="button"
                  hitSlop={8}
                  style={styles.referenceAction}>
                  <ThemedText variant="caption" style={{ color: theme.primary }}>
                    {t('nearby.choosePlace')}
                  </ThemedText>
                </Pressable>
              )}
            </View>
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
  referenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  reference: { flex: 1 },
  referenceAction: { minHeight: 44, justifyContent: 'center' },
});
