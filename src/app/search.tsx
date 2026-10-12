import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { PlaceRow } from '@/components/PlaceRow';
import { PoiRow } from '@/components/PoiRow';
import { SearchField } from '@/components/SearchField';
import { ThemedText } from '@/components/ThemedText';
import { usePoiData } from '@/data/DataProvider';
import {
  getPlaceIndex,
  searchPlaces,
  type Place,
  type PlaceHit,
  type PlaceIndex,
} from '@/data/places';
import type { Poi } from '@/data/pois';
import { CATEGORIES } from '@/data/schema';
import { searchPois } from '@/data/search';
import { useLocationState, useReferencePoint } from '@/state/location';
import {
  clearSearchedPlace,
  requestCamera,
  selectSearchedPlace,
  useSearchedPlace,
} from '@/state/searchedPlace';
import { useTheme } from '@/theme/useTheme';
import { haversine } from '@/utils/geo';

const MAX_PLACES = 15;
const MAX_POIS = 15;
const POI_ZOOM = 14;

type Row = { kind: 'place'; hit: PlaceHit } | { kind: 'poi'; poi: Poi };
type Section = { key: 'places' | 'pois'; title: string; data: Row[] };

/**
 * Location search (offline): towns, districts, islands and national parks from the bundled
 * place names, plus the app's own places by name. Choosing a place moves the map there and
 * makes "Närmast" measure from it.
 */
export default function SearchScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const data = usePoiData();
  const reference = useReferencePoint();
  const { position } = useLocationState();
  const active = useSearchedPlace();
  const [query, setQuery] = useState('');
  // The place names are parsed after the first frame so the screen opens instantly.
  const [index, setIndex] = useState<PlaceIndex | null>(null);
  useEffect(() => {
    const id = setTimeout(() => setIndex(getPlaceIndex()), 0);
    return () => clearTimeout(id);
  }, []);

  const sections = useMemo<Section[]>(() => {
    if (!query.trim()) return [];
    const from = position ?? reference;
    const places = index ? searchPlaces(index, query, { limit: MAX_PLACES, from }) : [];
    const pois = searchPois(data.pois, data.searchIndex, query, CATEGORIES)
      .map((poi) => ({ poi, d: haversine(from.lat, from.lon, poi.lat, poi.lon) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, MAX_POIS)
      .map(({ poi }) => poi);
    return [
      {
        key: 'places' as const,
        title: t('search.places'),
        data: places.map((hit): Row => ({ kind: 'place', hit })),
      },
      {
        key: 'pois' as const,
        title: t('search.pois'),
        data: pois.map((poi): Row => ({ kind: 'poi', poi })),
      },
    ].filter((s) => s.data.length > 0);
  }, [query, index, data, position, reference, t]);

  const close = useCallback(() => router.back(), [router]);

  const choosePlace = useCallback(
    (place: Place) => {
      selectSearchedPlace(place);
      router.back();
    },
    [router],
  );

  const choosePoi = useCallback(
    (poi: Poi) => {
      requestCamera(poi.lat, poi.lon, POI_ZOOM);
      router.replace({ pathname: '/place/[key]', params: { key: poi.key } });
    },
    [router],
  );

  return (
    <View style={[styles.flex, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder={t('search.placeholder')}
          autoFocus
          style={styles.field}
        />
        <Pressable onPress={close} accessibilityRole="button" hitSlop={8} style={styles.cancel}>
          <ThemedText style={{ color: theme.primary }}>{t('common.cancel')}</ThemedText>
        </Pressable>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(row) => (row.kind === 'place' ? `p${row.hit.place.id}` : row.poi.key)}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <ThemedText
            secondary
            variant="caption"
            accessibilityRole="header"
            style={styles.sectionTitle}>
            {section.title}
          </ThemedText>
        )}
        renderItem={({ item }) =>
          item.kind === 'place' ? (
            <PlaceRow
              place={item.hit.place}
              matchedAlias={item.hit.matchedAlias}
              from={position}
              onPress={choosePlace}
            />
          ) : (
            <PoiRow poi={item.poi} from={position ?? reference} onPress={choosePoi} />
          )
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <ThemedText secondary>
              {!query.trim()
                ? t('search.hint')
                : index
                  ? t('search.noResults', { query: query.trim() })
                  : t('search.loading')}
            </ThemedText>
            {!query.trim() && active ? (
              <Pressable
                onPress={() => {
                  clearSearchedPlace();
                  router.back();
                }}
                accessibilityRole="button"
                style={[styles.myPosition, { borderColor: theme.border }]}>
                <ThemedText style={{ color: theme.primary }}>
                  {t('search.useMyPosition')}
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingRight: 12, paddingBottom: 8 },
  field: { flex: 1 },
  cancel: { marginTop: 8, minHeight: 44, justifyContent: 'center' },
  sectionTitle: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 },
  empty: { padding: 16, gap: 16 },
  myPosition: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
});
