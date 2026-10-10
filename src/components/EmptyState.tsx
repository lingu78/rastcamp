import { StyleSheet, View } from 'react-native';

import { ThemedText } from './ThemedText';

type Props = { title: string; hint?: string };

export function EmptyState({ title, hint }: Props) {
  return (
    <View style={styles.container} accessibilityRole="summary">
      <ThemedText variant="subtitle" style={styles.center}>
        {title}
      </ThemedText>
      {hint ? (
        <ThemedText secondary style={styles.center}>
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  center: { textAlign: 'center' },
});
