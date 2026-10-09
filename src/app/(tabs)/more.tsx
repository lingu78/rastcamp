import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Linking, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Row, Section } from '@/components/Section';
import { ThemedText } from '@/components/ThemedText';
import { PRIVACY_POLICY_URL } from '@/config';
import { useDataStatus, usePoiData } from '@/data/DataProvider';
import type { UpdateResult } from '@/data/update';
import {
  setLanguagePreference,
  useLanguagePreference,
  type LanguagePreference,
} from '@/state/language';

const LANGUAGE_OPTIONS: LanguagePreference[] = ['auto', 'sv', 'nb', 'en'];

/** 13153 → "13 153" (thin space works for sv/nb/en without relying on Intl in Hermes). */
const formatCount = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');

/** Settings & about (spec F10). */
export default function MoreScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const preference = useLanguagePreference();
  const { version, pois } = usePoiData();
  const { source, checking, lastResult, checkNow } = useDataStatus();

  const resultText = (result: UpdateResult | null): string | undefined => {
    if (checking) return t('more.checking');
    switch (result?.status) {
      case 'updated':
        return t('more.resultUpdated', { version: result.file.version });
      case 'up-to-date':
        return t('more.resultUpToDate');
      case 'failed':
        return t('more.resultFailed');
      case 'skipped':
        return t('more.resultSkipped');
      default:
        return undefined;
    }
  };
  const status = resultText(lastResult);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Section title={t('more.settings')}>
        {LANGUAGE_OPTIONS.map((option, i) => (
          <Row
            key={option}
            label={t(`language.${option}`)}
            role="radio"
            selected={preference === option}
            onPress={() => setLanguagePreference(option)}
            last={i === LANGUAGE_OPTIONS.length - 1}
          />
        ))}
      </Section>
      <Section title={t('more.units')}>
        <Row label={t('more.units')} value={t('more.unitsKm')} last />
      </Section>

      <Section title={t('more.data')}>
        <Row
          label={t('more.dataVersion', { version })}
          value={source === 'downloaded' ? t('more.dataDownloaded') : t('more.dataBundled')}
        />
        <Row label={t('more.placeCount')} value={formatCount(pois.length)} />
        <Row
          label={checking ? t('more.checking') : t('more.checkNow')}
          onPress={() => void checkNow()}
          last
        />
      </Section>
      {status && !checking && (
        <ThemedText
          secondary
          variant="caption"
          accessibilityLiveRegion="polite"
          style={styles.status}>
          {status}
        </ThemedText>
      )}

      <Section title={t('more.about')}>
        <Row label={t('more.licenses')} onPress={() => router.push('/licenses')} />
        <Row
          label={t('more.privacy')}
          role="link"
          onPress={() => void Linking.openURL(PRIVACY_POLICY_URL).catch(() => undefined)}
        />
        <Row label={t('more.version')} value={Constants.expoConfig?.version ?? '–'} last />
      </Section>

      <ThemedText secondary variant="caption" style={styles.footer}>
        {t('more.privacyShort')}
      </ThemedText>
      <ThemedText secondary variant="caption" style={styles.footer}>
        {t('more.attribution')}
      </ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 20, paddingBottom: 40 },
  status: { marginTop: -12, paddingHorizontal: 4 },
  footer: { paddingHorizontal: 4 },
});
