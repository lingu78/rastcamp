import type { AppLanguage } from '@/i18n/language';

export { haversine } from '../../data-pipeline/src/geo';

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** Initial great-circle bearing from point 1 to point 2, degrees clockwise from north (0–360). */
export function bearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

const CARDINALS: Record<AppLanguage, readonly string[]> = {
  sv: ['N', 'NO', 'O', 'SO', 'S', 'SV', 'V', 'NV'],
  nb: ['N', 'NØ', 'Ø', 'SØ', 'S', 'SV', 'V', 'NV'],
  en: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
};

/** 8-point compass direction, e.g. "NO" (sv) for 45°. */
export function cardinal(degrees: number, language: AppLanguage): string {
  const index = Math.round((((degrees % 360) + 360) % 360) / 45) % 8;
  return CARDINALS[language][index]!;
}

/**
 * Distance for display (spec F5): kilometres, one decimal below 10 km, whole km above.
 * Decimal comma for sv/nb.
 */
export function formatDistance(meters: number, language: AppLanguage): string {
  const km = meters / 1000;
  if (km >= 10) return `${Math.round(km)} km`;
  const text = km < 0.05 ? '< 0.1' : km.toFixed(1);
  return `${language === 'en' ? text : text.replace('.', ',')} km`;
}
