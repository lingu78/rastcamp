import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { FilterChips } from '@/components/FilterChips';
import { LocateButton } from '@/components/map/LocateButton';
import { MapAttribution } from '@/components/map/MapAttribution';
import { PoiMap, type PoiMapHandle } from '@/components/map/PoiMap';
import type { Poi } from '@/data/pois';
import { useSelectedCategories, visibleCategories } from '@/state/filters';
import { requestLocationFromUser, useLocationState } from '@/state/location';
import { useTheme } from '@/theme/useTheme';

export default function MapScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const selected = useSelectedCategories();
  const { permission, position } = useLocationState();
  const mapRef = useRef<PoiMapHandle>(null);
  const [baseMapFailed, setBaseMapFailed] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  const openPoi = (poi: Poi) => router.push({ pathname: '/place/[key]', params: { key: poi.key } });

  const onLocate = () => {
    if (mapRef.current?.centerOnUser()) return;
    if (permission !== 'granted') {
      Alert.alert(t('map.locationOffTitle'), t('map.locationOffBody'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('map.allowLocation'), onPress: () => void requestLocationFromUser() },
      ]);
    }
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={styles.flex} accessibilityLabel={t('map.a11yLabel')}>
        <PoiMap
          key={mapKey}
          ref={mapRef}
          visible={visibleCategories(selected)}
          onSelectPoi={openPoi}
          onBaseMapStatus={(status) => setBaseMapFailed(status === 'failed')}
        />
      </View>

      <View style={[styles.top, { paddingTop: insets.top }]} pointerEvents="box-none">
        <FilterChips />
        {baseMapFailed && (
          <View
            style={[styles.banner, { backgroundColor: theme.surface, borderColor: theme.border }]}
            accessibilityRole="alert">
            <Text style={[styles.bannerText, { color: theme.text }]}>{t('map.offlineBody')}</Text>
            <View style={styles.bannerActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.navigate('/nearby')}
                style={[styles.bannerButton, { backgroundColor: theme.primary }]}>
                <Text style={[styles.bannerButtonText, { color: theme.onPrimary }]}>
                  {t('map.showList')}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setBaseMapFailed(false);
                  setMapKey((k) => k + 1);
                }}
                style={[styles.bannerButton, { borderColor: theme.border, borderWidth: 1 }]}>
                <Text style={[styles.bannerButtonText, { color: theme.text }]}>
                  {t('map.retry')}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      <View style={styles.bottomLeft} pointerEvents="box-none">
        <MapAttribution />
      </View>
      <View style={styles.bottomRight}>
        <LocateButton onPress={onLocate} active={permission === 'granted' && position !== null} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { position: 'absolute', top: 0, left: 0, right: 0 },
  banner: {
    marginHorizontal: 12,
    marginTop: 4,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  bannerText: { fontSize: 15, lineHeight: 20 },
  bannerActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  bannerButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  bannerButtonText: { fontSize: 15, fontWeight: '600' },
  bottomLeft: { position: 'absolute', left: 8, bottom: 8 },
  bottomRight: { position: 'absolute', right: 16, bottom: 24 },
});
