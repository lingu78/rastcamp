import { StyleSheet, Text, type TextProps } from 'react-native';

import { useTheme } from '@/theme/useTheme';

type Variant = 'body' | 'title' | 'subtitle' | 'caption';

export type ThemedTextProps = TextProps & { variant?: Variant; secondary?: boolean };

export function ThemedText({ style, variant = 'body', secondary, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  return (
    <Text
      style={[{ color: secondary ? theme.textSecondary : theme.text }, styles[variant], style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 16, lineHeight: 22 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  subtitle: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  caption: { fontSize: 14, lineHeight: 19 },
});
