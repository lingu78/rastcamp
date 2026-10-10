import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '@/theme/useTheme';

import { ThemedText } from './ThemedText';

export function Section({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <ThemedText secondary variant="caption" accessibilityRole="header" style={styles.title}>
        {title.toUpperCase()}
      </ThemedText>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {children}
      </View>
    </View>
  );
}

type RowProps = {
  label: string;
  value?: string;
  onPress?: () => void;
  role?: 'button' | 'link' | 'radio';
  selected?: boolean;
  last?: boolean;
  hint?: string;
};

export function Row({ label, value, onPress, role = 'button', selected, last, hint }: RowProps) {
  const theme = useTheme();
  const content = (
    <View
      style={[
        styles.row,
        !last && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      {value !== undefined && (
        <ThemedText secondary style={styles.value}>
          {value}
        </ThemedText>
      )}
      {role === 'radio' && selected && (
        <Svg width={20} height={20} viewBox="0 0 24 24">
          <Path
            d="m5 12.5 4.5 4.5L19 7.5"
            stroke={theme.primary}
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      )}
      {onPress && role !== 'radio' && (
        <Svg width={16} height={16} viewBox="0 0 24 24">
          <Path
            d="m9 5 7 7-7 7"
            stroke={theme.textSecondary}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      )}
    </View>
  );
  if (!onPress) {
    return (
      <View accessible accessibilityLabel={value ? `${label}: ${value}` : label}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={role}
      accessibilityLabel={value ? `${label}: ${value}` : label}
      accessibilityHint={hint}
      accessibilityState={role === 'radio' ? { checked: !!selected } : undefined}
      style={({ pressed }) => pressed && { backgroundColor: theme.surfaceAlt }}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: 6 },
  title: { paddingHorizontal: 4, letterSpacing: 0.5 },
  card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  label: { flex: 1 },
  value: { flexShrink: 1, textAlign: 'right' },
});
