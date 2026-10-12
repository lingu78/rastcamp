import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import type { Place } from '@/data/places';
import type { AppLanguage } from '@/i18n/language';
import type { LatLon } from '@/state/location';
import { useTheme } from '@/theme/useTheme';
import { formatDistance, haversine } from '@/utils/geo';

import { ThemedText } from './ThemedText';

type Props = {
  place: Place;
  matchedAlias: string | null;
  /** Device position, for the distance on the right; omitted without a fix. */
  from: LatLon | null;
  onPress: (place: Place) => void;
};

/** A town, district, island or national park in the location search. */
export const PlaceRow = memo(function PlaceRow({ place, matchedAlias, from, onPress }: Props) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const language = i18n.language as AppLanguage;
  const details = [
    t(`placeTypes.${place.type}`),
    place.near ? t('search.near', { place: place.near }) : null,
    place.country ? t(`countries.${place.country}`, { defaultValue: place.country }) : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const distance = from
    ? formatDistance(haversine(from.lat, from.lon, place.lat, place.lon), language)
    : null;

  return (
    <Pressable
      onPress={() => onPress(place)}
      accessibilityRole="button"
      accessibilityLabel={t('search.placeRowA11y', {
        name: matchedAlias ? `${place.name} (${matchedAlias})` : place.name,
        details: distance ? `${details}, ${distance}` : details,
      })}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? theme.surfaceAlt : theme.surface, borderColor: theme.border },
      ]}>
      <View style={[styles.icon, { backgroundColor: theme.surfaceAlt }]}>
        <Svg width={22} height={22} viewBox="0 0 24 24" accessible={false}>
          <Path
            d="M12 21s-6.5-6.1-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.9 12 21 12 21Z"
            fill={theme.text}
          />
          <Circle cx={12} cy={9.8} r={2.6} fill={theme.surfaceAlt} />
        </Svg>
      </View>
      <View style={styles.text}>
        <ThemedText variant="subtitle" numberOfLines={2}>
          {place.name}
          {matchedAlias ? <ThemedText secondary>{` (${matchedAlias})`}</ThemedText> : null}
        </ThemedText>
        <ThemedText secondary variant="caption" numberOfLines={2}>
          {details}
        </ThemedText>
      </View>
      {distance ? (
        <ThemedText secondary style={styles.distance} accessible={false}>
          {distance}
        </ThemedText>
      ) : null}
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 64,
  },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  distance: { fontVariant: ['tabular-nums'] },
});
