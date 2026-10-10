import { useState } from 'react';
import { Linking, Pressable, SectionList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/ThemedText';
import licenses from '@/legal/licenses.json';
import { useTheme } from '@/theme/useTheme';

type Entry = { name: string; version?: string; license: string; url?: string; text: string };

function LicenseItem({ entry }: { entry: Entry }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={[styles.item, { borderColor: theme.border }]}>
      <ThemedText variant="subtitle">{entry.name}</ThemedText>
      <ThemedText secondary variant="caption">
        {[entry.version, entry.license].filter(Boolean).join(' · ')}
      </ThemedText>
      {entry.url && (
        <ThemedText
          variant="caption"
          accessibilityRole="link"
          onPress={() => void Linking.openURL(entry.url!).catch(() => undefined)}
          style={{ color: theme.primary, textDecorationLine: 'underline' }}>
          {entry.url}
        </ThemedText>
      )}
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        hitSlop={8}>
        <ThemedText style={{ color: theme.primary }}>
          {open ? t('licenses.hideText') : t('licenses.showText')}
        </ThemedText>
      </Pressable>
      {open && (
        <ThemedText variant="caption" selectable style={styles.text}>
          {entry.text}
        </ThemedText>
      )}
    </View>
  );
}

/** Licence texts for data, map and open source software (spec F10). */
export default function LicensesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <SectionList
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      sections={[
        { title: t('licenses.data'), data: licenses.data as Entry[] },
        { title: t('licenses.software'), data: licenses.software as Entry[] },
      ]}
      keyExtractor={(entry) => entry.name}
      renderSectionHeader={({ section }) => (
        <ThemedText
          variant="title"
          accessibilityRole="header"
          style={[styles.header, { backgroundColor: theme.background }]}>
          {section.title}
        </ThemedText>
      )}
      renderItem={({ item }) => <LicenseItem entry={item} />}
      initialNumToRender={12}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  header: { paddingTop: 16, paddingBottom: 8 },
  item: { paddingVertical: 12, gap: 4, borderBottomWidth: StyleSheet.hairlineWidth },
  text: { marginTop: 8 },
});
