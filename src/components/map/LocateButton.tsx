import { Pressable, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme/useTheme';

type Props = { onPress: () => void; active: boolean };

/** "Centrera på mig" (spec F4). */
export function LocateButton({ onPress, active }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const color = active ? theme.primary : theme.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('map.centerOnMe')}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
      ]}>
      <Svg width={26} height={26} viewBox="0 0 24 24">
        <Circle cx={12} cy={12} r={7} stroke={color} strokeWidth={2} fill="none" />
        <Circle cx={12} cy={12} r={2.6} fill={color} />
        <Path
          d="M12 2v3M12 19v3M2 12h3M19 12h3"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});
