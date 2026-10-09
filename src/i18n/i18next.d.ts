import 'i18next';

import type sv from './locales/sv.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof sv };
  }
}
