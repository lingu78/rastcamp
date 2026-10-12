import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/ThemedText';
import { clearSearchedPlace, useSearchedPlace } from '@/state/searchedPlace';
import { useTheme } from '@/theme/useTheme';

/** "Sök ort eller plats" on the map; shows the chosen place with a clear button. */
export function MapSearchBar() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const place = useSearchedPlace();

  return (
    <View style={[styles.bar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Pressable
        onPress={() => router.push('/search')}
        accessibilityRole="search"
        accessibilityLabel={
          place ? `${t('search.placeholder')}: ${place.name}` : t('search.placeholder')
        }
        style={styles.open}>
        <Svg width={20} height={20} viewBox="0 0 24 24" accessible={false}>
          <Circle
            cx={11}
            cy={11}
            r={6.5}
            stroke={theme.textSecondary}
            strokeWidth={2}
            fill="none"
          />
          <Path
            d="m16 16 4.5 4.5"
            stroke={theme.textSecondary}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
        <ThemedText
          numberOfLines={1}
          secondary={!place}
          style={[styles.text, place && styles.placeText]}>
          {place ? place.name : t('search.placeholder')}
        </ThemedText>
      </Pressable>
      {place ? (
        <Pressable
          onPress={clearSearchedPlace}
          accessibilityRole="button"
          accessibilityLabel={t('search.clearPlace', { place: place.name })}
          hitSlop={10}
          style={styles.clear}>
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Circle cx={12} cy={12} r={9} fill={theme.textSecondary} />
            <Path
              d="m9 9 6 6M15 9l-6 6"
              stroke={theme.surface}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Svg>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 46,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  open: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    minHeight: 46,
  },
  text: { flex: 1, fontSize: 16 },
  placeText: { fontWeight: '600' },
  clear: { paddingHorizontal: 12, minHeight: 46, justifyContent: 'center' },
});
