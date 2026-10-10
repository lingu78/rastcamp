import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import type { Poi } from '@/data/pois';
import type { AppLanguage } from '@/i18n/language';
import type { LatLon } from '@/state/location';
import { bearing, cardinal, formatDistance, haversine } from '@/utils/geo';
import { useTheme } from '@/theme/useTheme';

import { CategoryIcon } from './CategoryIcon';
import { ThemedText } from './ThemedText';

type Props = { poi: Poi; from: LatLon; onPress: (poi: Poi) => void };

/** One row in the nearby/favourites/search lists (spec F5). */
export const PoiRow = memo(function PoiRow({ poi, from, onPress }: Props) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const language = i18n.language as AppLanguage;
  const category = t(`categories.${poi.cat}`);
  const name = poi.name || category;
  const distance = formatDistance(haversine(from.lat, from.lon, poi.lat, poi.lon), language);
  const deg = bearing(from.lat, from.lon, poi.lat, poi.lon);
  const direction = cardinal(deg, language);

  return (
    <Pressable
      onPress={() => onPress(poi)}
      accessibilityRole="button"
      accessibilityLabel={
        poi.name
          ? t('nearby.rowA11y', { name, category, distance, direction })
          : t('nearby.rowA11yUnnamed', { category, distance, direction })
      }
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? theme.surfaceAlt : theme.surface, borderColor: theme.border },
      ]}>
      <CategoryIcon category={poi.cat} size={40} />
      <View style={styles.text}>
        <ThemedText variant="subtitle" numberOfLines={2}>
          {name}
        </ThemedText>
        {poi.name ? (
          <ThemedText secondary variant="caption">
            {category}
          </ThemedText>
        ) : null}
      </View>
      <View style={styles.distance} accessible={false}>
        <ThemedText style={styles.distanceText}>{distance}</ThemedText>
        <View style={styles.direction}>
          <Svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            style={{ transform: [{ rotate: `${deg}deg` }] }}>
            <Path d="M12 3 6 20l6-4 6 4Z" fill={theme.textSecondary} />
          </Svg>
          <ThemedText secondary variant="caption">
            {direction}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 64,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  text: { flex: 1, gap: 2 },
  distance: { alignItems: 'flex-end', gap: 2 },
  distanceText: { fontWeight: '600', fontVariant: ['tabular-nums'] },
  direction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
