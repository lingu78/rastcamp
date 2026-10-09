import { useLocalSearchParams, useRouter } from 'expo-router';
import { Linking, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { CategoryIcon } from '@/components/CategoryIcon';
import { EmptyState } from '@/components/EmptyState';
import { ThemedText } from '@/components/ThemedText';
import { usePoiData } from '@/data/DataProvider';
import { detailFields, type Field } from '@/data/fields';
import type { Poi } from '@/data/pois';
import type { AppLanguage } from '@/i18n/language';
import { favoriteToPoi, toggleFavorite, useFavorites } from '@/state/favorites';
import { useReferencePoint } from '@/state/location';
import { useTheme } from '@/theme/useTheme';
import { bearing, cardinal, formatDistance, haversine } from '@/utils/geo';
import { mapLinkUrl, openNavigation, reportUrl } from '@/utils/links';

const ICONS = {
  navigate: 'M3 11.5 21 3l-8.5 18-2-7.5Z',
  star: 'm12 3.5 2.6 5.3 5.9.9-4.25 4.15 1 5.85L12 16.95 6.75 19.7l1-5.85L3.5 9.7l5.9-.9Z',
  share: 'M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7',
  report: 'M5 21V4m0 0h11l-2 4 2 4H5',
  close: 'M6 6l12 12M18 6 6 18',
};

/** Place detail as a bottom sheet (spec F6). */
export default function PlaceScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { byKey } = usePoiData();
  const favorites = useFavorites();
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const reference = useReferencePoint();
  const language = i18n.language as AppLanguage;

  const favorite = favorites.find((f) => f.key === key);
  const poi: Poi | undefined =
    (key ? byKey.get(key) : undefined) ?? (favorite && favoriteToPoi(favorite));
  if (!poi) return <EmptyState title={t('place.notFound')} />;

  const categoryName = t(`categories.${poi.cat}`);
  const title = poi.name || categoryName;
  const fields = detailFields(poi, t, language);
  const distance = formatDistance(
    haversine(reference.lat, reference.lon, poi.lat, poi.lon),
    language,
  );
  const direction = cardinal(bearing(reference.lat, reference.lon, poi.lat, poi.lon), language);
  const isFavorite = favorite !== undefined;

  const share = () =>
    void Share.share({
      message: `${t('place.shareMessage', { name: title, category: categoryName })}\n${poi.lat.toFixed(5)}, ${poi.lon.toFixed(5)}\n${mapLinkUrl(poi)}`,
    }).catch(() => undefined);

  const action = (
    id: keyof typeof ICONS,
    label: string,
    onPress: () => void,
    primary = false,
    filled = false,
  ) => (
    <Pressable
      key={id}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={id === 'star' ? { selected: isFavorite } : undefined}
      style={({ pressed }) => [
        styles.action,
        primary
          ? { backgroundColor: theme.primary }
          : { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
        { opacity: pressed ? 0.8 : 1 },
      ]}>
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Path
          d={ICONS[id]}
          stroke={primary ? theme.onPrimary : theme.text}
          fill={filled ? theme.accent : 'none'}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <ThemedText style={[styles.actionLabel, { color: primary ? theme.onPrimary : theme.text }]}>
        {label}
      </ThemedText>
    </Pressable>
  );

  const renderField = (field: Field) => {
    const pressable = field.kind === 'phone' || field.kind === 'url';
    const onPress = () =>
      void Linking.openURL(
        field.kind === 'phone' ? `tel:${field.raw?.replace(/\s/g, '')}` : field.raw!,
      ).catch(() => undefined);
    const body =
      field.kind === 'paragraph' ? (
        <View key={field.id} style={styles.paragraph}>
          <ThemedText secondary variant="caption">
            {field.label}
          </ThemedText>
          <ThemedText>{field.value}</ThemedText>
        </View>
      ) : (
        <View key={field.id} style={[styles.field, { borderColor: theme.border }]}>
          <ThemedText secondary style={styles.fieldLabel}>
            {field.label}
          </ThemedText>
          <ThemedText
            style={[
              styles.fieldValue,
              pressable && { color: theme.primary, textDecorationLine: 'underline' },
            ]}>
            {field.value}
          </ThemedText>
        </View>
      );
    if (!pressable) return body;
    return (
      <Pressable
        key={field.id}
        onPress={onPress}
        accessibilityRole="link"
        accessibilityLabel={
          field.kind === 'phone'
            ? t('place.call', { number: field.value })
            : `${t('place.openWebsite')}: ${field.value}`
        }>
        {body}
      </Pressable>
    );
  };

  return (
    <ScrollView style={{ backgroundColor: theme.surface }} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <CategoryIcon category={poi.cat} size={48} />
        <View style={styles.headerText}>
          <ThemedText variant="title" accessibilityRole="header">
            {title}
          </ThemedText>
          <ThemedText secondary>
            {categoryName} · {t('place.distanceFrom', { distance, direction })}
          </ThemedText>
        </View>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          hitSlop={12}
          style={[styles.close, { backgroundColor: theme.surfaceAlt }]}>
          <Svg width={18} height={18} viewBox="0 0 24 24">
            <Path d={ICONS.close} stroke={theme.text} strokeWidth={2.4} strokeLinecap="round" />
          </Svg>
        </Pressable>
      </View>

      <View style={styles.actions}>
        {action('navigate', t('place.navigate'), () => void openNavigation(poi, title), true)}
        {action(
          'star',
          isFavorite ? t('place.removeFavorite') : t('place.saveFavorite'),
          () => toggleFavorite(poi),
          false,
          isFavorite,
        )}
        {action('share', t('place.share'), share)}
      </View>

      <View>{fields.map(renderField)}</View>

      <View style={[styles.field, { borderColor: theme.border }]}>
        <ThemedText secondary style={styles.fieldLabel}>
          {t('fields.coordinates')}
        </ThemedText>
        <ThemedText selectable style={[styles.fieldValue, styles.mono]}>
          {poi.lat.toFixed(5)}, {poi.lon.toFixed(5)}
        </ThemedText>
      </View>

      <Pressable
        onPress={() => void Linking.openURL(reportUrl(poi)).catch(() => undefined)}
        accessibilityRole="link"
        accessibilityLabel={t('place.report')}
        accessibilityHint={t('place.reportHint')}
        style={styles.report}>
        <Svg width={18} height={18} viewBox="0 0 24 24">
          <Path
            d={ICONS.report}
            stroke={theme.primary}
            strokeWidth={2}
            fill="none"
            strokeLinejoin="round"
          />
        </Svg>
        <ThemedText style={{ color: theme.primary, textDecorationLine: 'underline' }}>
          {t('place.report')}
        </ThemedText>
      </Pressable>
      <ThemedText secondary variant="caption">
        {t('place.dataSource')}
      </ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 24, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  headerText: { flex: 1, gap: 4 },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 46,
    borderRadius: 23,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  actionLabel: { fontWeight: '600' },
  field: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fieldLabel: { flexShrink: 0, maxWidth: '45%' },
  fieldValue: { flex: 1, textAlign: 'right' },
  mono: { fontVariant: ['tabular-nums'] },
  paragraph: { gap: 4, paddingVertical: 12 },
  report: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
});
