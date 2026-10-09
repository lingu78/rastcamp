import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CATEGORIES, type Category } from '@/data/schema';
import { clearFilters, toggleCategory, useSelectedCategories } from '@/state/filters';
import { CATEGORY_COLORS } from '@/theme/categories';
import { useTheme } from '@/theme/useTheme';

import { CategoryIcon } from './CategoryIcon';

/** Multi-select category chips (spec F3). No selection = everything is shown. */
export function FilterChips() {
  const { t } = useTranslation();
  const theme = useTheme();
  const selected = useSelectedCategories();
  const allActive = selected.length === 0;

  const chip = (
    key: string,
    label: string,
    active: boolean,
    onPress: () => void,
    category?: Category,
  ) => {
    const activeColor = category ? CATEGORY_COLORS[category] : theme.primary;
    return (
      <Pressable
        key={key}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        accessibilityLabel={label}
        hitSlop={4}
        style={({ pressed }) => [
          styles.chip,
          {
            backgroundColor: active ? activeColor : theme.surface,
            borderColor: active ? activeColor : theme.border,
            opacity: pressed ? 0.8 : 1,
          },
        ]}>
        {category && (
          <CategoryIcon
            category={category}
            variant="glyph"
            size={18}
            color={active ? '#FFFFFF' : CATEGORY_COLORS[category]}
          />
        )}
        <Text
          style={[
            styles.label,
            { color: active ? (category ? '#FFFFFF' : theme.onPrimary) : theme.text },
          ]}>
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityRole="toolbar"
      accessibilityLabel={t('filter.label')}>
      {chip('all', t('filter.all'), allActive, clearFilters)}
      {CATEGORIES.map((category) =>
        chip(
          category,
          t(`categories.${category}`),
          selected.includes(category),
          () => toggleCategory(category),
          category,
        ),
      )}
      <View style={styles.endSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, alignItems: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  label: { fontSize: 15, fontWeight: '600' },
  endSpacer: { width: 4 },
});
