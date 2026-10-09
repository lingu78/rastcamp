import * as Linking from 'expo-linking';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

/** Always-visible attribution required by OpenFreeMap/OpenMapTiles/OSM (spec F1). */
export function MapAttribution() {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={() => void Linking.openURL('https://www.openstreetmap.org/copyright')}
      accessibilityRole="link"
      accessibilityLabel={t('map.attributionA11y')}
      style={styles.box}>
      <Text style={styles.text} numberOfLines={2}>
        © OpenMapTiles · © OpenStreetMap contributors
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: '70%',
  },
  // Fixed dark-on-light so it stays readable on any map style.
  text: { fontSize: 11, color: '#1A1F1B' },
});
