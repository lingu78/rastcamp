import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/EmptyState';

// Placeholder until M4 (distance-sorted list).
export default function NearbyScreen() {
  const { t } = useTranslation();
  return <EmptyState title={t('nearby.empty')} />;
}
