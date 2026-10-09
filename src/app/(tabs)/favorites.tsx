import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/EmptyState';

export default function FavoritesScreen() {
  const { t } = useTranslation();
  return <EmptyState title={t('favorites.empty')} hint={t('favorites.emptyHint')} />;
}
