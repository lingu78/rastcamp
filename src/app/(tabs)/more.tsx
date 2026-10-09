import Constants from 'expo-constants';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/ThemedText';
import type { AppLanguage } from '@/i18n/language';
import { useTheme } from '@/theme/useTheme';

// Settings, licences and privacy policy link arrive in M5 (F10).
export default function MoreScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const language = i18n.language as AppLanguage;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ThemedText>{t('more.language')}</ThemedText>
        <ThemedText secondary>{t(`language.${language}`)}</ThemedText>
      </View>
      <View style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ThemedText>{t('more.version')}</ThemedText>
        <ThemedText secondary>{Constants.expoConfig?.version ?? '–'}</ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
