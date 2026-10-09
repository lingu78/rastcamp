import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/EmptyState';
import { PoiRow } from '@/components/PoiRow';
import { usePoiData } from '@/data/DataProvider';
import type { Poi } from '@/data/pois';
import { favoriteToPoi, useFavorites } from '@/state/favorites';
import { useReferencePoint } from '@/state/location';
import { haversine } from '@/utils/geo';

/** Favourites (spec F8), nearest first. Uses fresh data when the POI still exists. */
export default function FavoritesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const favorites = useFavorites();
  const { byKey } = usePoiData();
  const reference = useReferencePoint();
  const { lat, lon } = reference;

  const rows = useMemo(
    () =>
      favorites
        .map((f) => byKey.get(f.key) ?? favoriteToPoi(f))
        .sort((a, b) => haversine(lat, lon, a.lat, a.lon) - haversine(lat, lon, b.lat, b.lon)),
    [favorites, byKey, lat, lon],
  );

  const openPoi = useCallback(
    (poi: Poi) => router.push({ pathname: '/place/[key]', params: { key: poi.key } }),
    [router],
  );

  if (rows.length === 0) {
    return <EmptyState title={t('favorites.empty')} hint={t('favorites.emptyHint')} />;
  }
  return (
    <FlatList
      data={rows}
      accessibilityLabel={t('favorites.listA11y')}
      keyExtractor={(poi) => poi.key}
      renderItem={({ item }) => <PoiRow poi={item} from={reference} onPress={openPoi} />}
    />
  );
}
