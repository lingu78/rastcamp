import type { ColorValue } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

export type TabIconName = 'map' | 'nearby' | 'favorites' | 'more';

type Props = { name: TabIconName; color: ColorValue; size?: number };

/** Hand-drawn 24×24 stroke icons for the tab bar. */
export function TabIcon({ name, color, size = 26 }: Props) {
  const stroke = {
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      {name === 'map' && (
        <>
          <Path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20Z" {...stroke} />
          <Path d="M9 4v13.5M15 6.5V20" {...stroke} />
        </>
      )}
      {name === 'nearby' && <Path d="M12 3 5 20l7-3.8 7 3.8Z" {...stroke} />}
      {name === 'favorites' && (
        <Path
          d="m12 3.5 2.6 5.3 5.9.9-4.25 4.15 1 5.85L12 16.95 6.75 19.7l1-5.85L3.5 9.7l5.9-.9Z"
          {...stroke}
        />
      )}
      {name === 'more' && (
        <>
          <Circle cx={5} cy={12} r={1.8} fill={color} />
          <Circle cx={12} cy={12} r={1.8} fill={color} />
          <Circle cx={19} cy={12} r={1.8} fill={color} />
        </>
      )}
    </Svg>
  );
}
