import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme/useTheme';

type Props = {
  value: string;
  onChange: (text: string) => void;
  /** Defaults to the "Närmast" name search texts. */
  placeholder?: string;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function SearchField({ value, onChange, placeholder, autoFocus, style }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const label = placeholder ?? t('nearby.searchPlaceholder');
  return (
    <View
      style={[styles.box, { backgroundColor: theme.surface, borderColor: theme.border }, style]}>
      <Svg width={20} height={20} viewBox="0 0 24 24" accessible={false}>
        <Circle cx={11} cy={11} r={6.5} stroke={theme.textSecondary} strokeWidth={2} fill="none" />
        <Path
          d="m16 16 4.5 4.5"
          stroke={theme.textSecondary}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </Svg>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={label}
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel={label}
        autoFocus={autoFocus}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        clearButtonMode="never"
        style={[styles.input, { color: theme.text }]}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChange('')}
          accessibilityRole="button"
          accessibilityLabel={t('nearby.clearSearch')}
          hitSlop={10}>
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 12,
    marginTop: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 46,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 10 },
});
