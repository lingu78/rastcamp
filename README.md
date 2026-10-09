# Rastcamp

Mobilapp (iOS + Android) som hjälper husbils- och husvagnsfolk i Norden att snabbt hitta närmaste
ställplats, camping, tömningsstation, vattenpåfyllning, rastplats och gasol – gratis, utan konto,
utan reklam och offline.

- Kravspecifikation: [SPEC.md](SPEC.md)
- Status per milstolpe: [PROGRESS.md](PROGRESS.md)
- Tekniska beslut och verifierade butikskrav: [DECISIONS.md](DECISIONS.md)

## Teknik

Expo SDK 57 · React Native 0.86 · TypeScript (strict) · Expo Router · i18next (sv/nb/en) ·
Jest + React Native Testing Library · EAS Build/Submit.

## Kom igång

Krav: Node.js 22 (se `.nvmrc`) och npm.

```bash
npm install
npm start          # Metro dev-server
npm run web        # snabb förhandsvisning i webbläsaren (endast för utveckling)
```

Appen kommer att använda MapLibre (native-modul) från M3 och kräver då en
**development build** – Expo Go räcker inte:

```bash
npm run android    # = expo run:android, kräver Android SDK/emulator lokalt
# eller i molnet (ingen Mac/Android Studio krävs):
npx eas-cli@latest build --profile development --platform android
```

## Kvalitetskontroller

```bash
npm run lint          # ESLint (eslint-config-expo)
npm run format:check  # Prettier (npm run format för att formatera)
npm run typecheck     # tsc --noEmit
npm test              # Jest
npm run check         # allt ovan i följd – samma som CI
```

CI (GitHub Actions, `.github/workflows/ci.yml`) kör dessutom `expo-doctor` och en
bundle-röktest (`expo export` för Android och iOS) på varje push.

## Projektstruktur

```
src/
  app/            Expo Router-rutter (varje fil = skärm)
    _layout.tsx   rot-layout (tema, i18n, Stack)
    (tabs)/       flikarna Karta (index), Närmast, Favoriter, Mer
  components/     återanvändbara komponenter (SVG-ikoner m.m.)
  i18n/           i18next-setup, språkmappning, översättningar (locales/*.json)
  theme/          färgtokens (ljust/mörkt) och useTheme
```

Native-mapparna `ios/` och `android/` genereras (Continuous Native Generation) och checkas inte in.
All native-konfiguration görs i `app.json` och config plugins.

## Hemligheter

Inga tokens eller nycklar i repot. `EXPO_TOKEN`, App Store Connect API-nyckel och Google Play
service account läses från miljövariabler, GitHub Secrets eller EAS. `.env*` och nyckelfiler är
gitignorerade.

## Licens

Koden: alla rättigheter förbehållna (ingen öppen licens vald ännu – se DECISIONS.md).
Platsdata: © OpenStreetMap contributors, ODbL (se appens "Mer"-flik från M5).
