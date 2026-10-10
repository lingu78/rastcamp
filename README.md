# Rastcamp

Mobilapp (iOS + Android) som hjälper husbils- och husvagnsfolk i Norden att snabbt hitta närmaste
ställplats, camping, tömningsstation, vattenpåfyllning, rastplats och gasol – gratis, utan konto,
utan reklam och offline.

- Kravspecifikation: [SPEC.md](SPEC.md)
- Status per milstolpe: [PROGRESS.md](PROGRESS.md)
- Tekniska beslut och verifierade butikskrav: [DECISIONS.md](DECISIONS.md)
- Publicering och 🔑-steg: [RELEASE.md](RELEASE.md) · Manuell testplan: [TESTPLAN.md](TESTPLAN.md)
- Butiksmaterial: [`store/`](store/)

## Teknik

Expo SDK 57 · React Native 0.86 · TypeScript (strict) · Expo Router · MapLibre React Native
(OpenFreeMap-kartor) · i18next (sv/nb/en) · KDBush/geokdbush · Jest + React Native Testing
Library · Maestro (skärmdumpar) · EAS Build/Submit.

## Kom igång

Krav: Node.js 22 (se `.nvmrc`) och npm.

```bash
npm install
npm start          # Metro dev-server
npm run web        # snabb förhandsvisning i webbläsaren (endast för utveckling)
```

Appen använder MapLibre (native-modul) och kräver ett eget bygge – Expo Go räcker inte:

```bash
npm run android    # = expo run:android, kräver Android SDK + emulator/telefon lokalt
npm run ios        # = expo run:ios, kräver macOS + Xcode ≥ 26.4
# eller i molnet (ingen Mac/Android Studio krävs) – installerbar APK:
npx eas-cli@latest build --profile preview --platform android
```

Webbförhandsvisningen (`npm run web`) visar allt utom kartan (platshållare) och används bara för
snabb visuell kontroll.

## Kvalitetskontroller

```bash
npm run lint          # ESLint (eslint-config-expo)
npm run format:check  # Prettier (npm run format för att formatera)
npm run typecheck     # tsc --noEmit
npm test              # Jest
npm run check         # allt ovan i följd – samma som CI
```

GitHub Actions:

| Workflow          | Vad                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `ci.yml`          | lint, Prettier, typecheck, Jest (app + pipeline, inkl. osmium end-to-end), `expo-doctor`, bundle-röktest                                   |
| `android.yml`     | release-APK → Android-emulator (API 35): start med/utan platsbehörighet, mörkt läge, lista/detalj, flygplansläge; skärmdumpar + starttider |
| `data.yml`        | datapipeline månadsvis → GitHub Pages (`gh-pages`)                                                                                         |
| `screenshots.yml` | butiksskärmdumpar med Maestro (Android-emulator + iOS-simulator), sv/nb/en                                                                 |
| `eas.yml`         | `eas init` / `eas build` / `eas submit` (kräver secret `EXPO_TOKEN`)                                                                       |

## Platsdata

Platsdatan byggs från OpenStreetMap av pipelinen i [`data-pipeline/`](data-pipeline/README.md)
(kräver `osmium-tool`):

```bash
npm run data:build
```

En GitHub Action (`.github/workflows/data.yml`) kör den månadsvis och publicerar
`pois.json.gz` + `manifest.json` på GitHub Pages; appen hämtar nyare data själv (max 1 gång/dygn).
Den inbyggda datafilen (`assets/data/pois.json`) uppdateras före varje release:

```bash
npm run data:update                          # från GitHub Pages
npm run data:update -- --dir data-pipeline/out   # från ett lokalt pipelinebygge
```

## Övriga skript

```bash
npm run icons:app        # appikon/splash/Play-ikon från assets/brand/icon-artwork.svg
npm run icons:map        # kartmarkörer från kategoriglyferna
npm run licenses         # licenstexter i appen (från bundlens source maps)
npm run store:graphics   # Play feature graphic (sv/nb/en)
npm run screenshots:frame  # bildtext + butiksstorlek på råa skärmdumpar
```

## Projektstruktur

```
src/
  app/            Expo Router-rutter (varje fil = skärm)
    _layout.tsx   rot-layout (tema, i18n, data, Stack)
    (tabs)/       flikarna Karta (index), Närmast, Favoriter, Mer
    place/[key]   detaljvy (bottom sheet)
    licenses.tsx  datakällor och licenser
  components/     UI-komponenter (karta, filterchips, rader, ikoner …)
  data/           dataset, rumsligt index, sök, fält, datauppdatering (F9)
  state/          filter, favoriter, plats, språk (små externa stores)
  i18n/           i18next-setup, språkmappning, översättningar
  theme/          färgtokens, kategorifärger och glyfer
  legal/          genererade licenstexter
assets/           ikoner, kartmarkörer, inbyggd platsdata
data-pipeline/    OSM → pois.json.gz (Node + osmium), egna tester
site/             GitHub Pages (startsida, integritetspolicy, öppen data)
store/            butikstexter, integritet, åldersgräns, grafik, skärmdumpar, testmaterial
scripts/          generatorer (ikoner, licenser, grafik, skärmdumpar) och CI-hjälpskript
```

Native-mapparna `ios/` och `android/` genereras (Continuous Native Generation) och checkas inte in.
All native-konfiguration görs i `app.json` och config plugins.

## Hemligheter

Inga tokens eller nycklar i repot. `EXPO_TOKEN`, App Store Connect API-nyckel och Google Play
service account läses från miljövariabler, GitHub Secrets eller EAS. `.env*` och nyckelfiler är
gitignorerade.

## Licens

Koden: alla rättigheter förbehållna (ingen öppen licens vald ännu – se DECISIONS.md).
Platsdata: © OpenStreetMap contributors, ODbL – fritt tillgänglig på
<https://lingu78.github.io/rastcamp/data/>. Karta: © OpenMapTiles, OpenFreeMap.
