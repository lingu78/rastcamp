import Svg, { Circle, Path } from 'react-native-svg';

import type { Category } from '@/data/schema';
import { CATEGORY_COLORS, CATEGORY_GLYPHS } from '@/theme/categories';

type Props = {
  category: Category;
  size?: number;
  /** Plain glyph in `color` (chips) instead of a white glyph on a coloured disc. */
  variant?: 'badge' | 'glyph';
  color?: string;
};

export function CategoryIcon({ category, size = 32, variant = 'badge', color }: Props) {
  const glyph = CATEGORY_GLYPHS[category];
  const fg = variant === 'badge' ? '#FFFFFF' : (color ?? CATEGORY_COLORS[category]);
  // Badge: glyph scaled to 60% inside a 24-unit disc.
  const transform = variant === 'badge' ? 'translate(4.8 4.8) scale(0.6)' : undefined;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      {variant === 'badge' && <Circle cx={12} cy={12} r={12} fill={CATEGORY_COLORS[category]} />}
      {glyph.stroke?.map((d) => (
        <Path
          key={d}
          d={d}
          transform={transform}
          stroke={fg}
          strokeWidth={variant === 'badge' ? 2.4 : 2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      ))}
      {glyph.fill?.map((d) => (
        <Path key={d} d={d} transform={transform} fill={fg} />
      ))}
    </Svg>
  );
}
