import * as Linking from 'expo-linking';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Always-visible map attribution (spec F1). OpenMapTiles requires a visible credit linking
 * to openmaptiles.org; OSM a credit linking to its copyright page.
 */
export function MapAttribution() {
  const { t } = useTranslation();
  const link = (label: string, url: string, a11y: string) => (
    <Text
      style={styles.link}
      onPress={() => void Linking.openURL(url)}
      accessibilityRole="link"
      accessibilityLabel={a11y}
      suppressHighlighting={false}>
      {label}
    </Text>
  );
  return (
    <View style={styles.box}>
      <Text style={styles.text} numberOfLines={2}>
        {link('© OpenMapTiles', 'https://openmaptiles.org/', t('map.attributionOmtA11y'))}
        {' · '}
        {link(
          '© OpenStreetMap contributors',
          'https://www.openstreetmap.org/copyright',
          t('map.attributionOsmA11y'),
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    maxWidth: '72%',
  },
  // Fixed dark-on-light so it stays readable on any map style.
  text: { fontSize: 11, color: '#1A1F1B' },
  link: { color: '#1A1F1B' },
});
