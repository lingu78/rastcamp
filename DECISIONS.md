# Beslutslogg – Rastcamp

Tekniska val, verifierade krav och avvägningar. Senaste överst inom varje avsnitt.
Format: **Beslut** – motivering – (datum, milstolpe).

---

## 1. Verifierade plattforms- och butikskrav

Slogs upp 2026-10-09 (M1). Kontrollera igen innan M8 (första butiksbyggena).

| Krav                                          | Värde                                                                                                                                                   | Källa                                                                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Senaste stabila Expo SDK                      | **SDK 57** (`expo@57.0.27`, npm-tagg `latest`; SDK 58 är i beta)                                                                                        | npm-registret, `expo/docs/package.json` (`version: 57.0.0`, `betaVersion: 58.0.0`)                                        |
| React Native / React i SDK 57                 | RN **0.86** (0.86.3), React **19.2.3**                                                                                                                  | Expo `@expo/sdk-compatibility` (den data som docs.expo.dev renderar sina tabeller från)                                   |
| Android min / compileSdk / targetSdk i SDK 57 | Android **7 (API 24)** / **36** / **36**                                                                                                                | samma + bekräftat i genererat Android-projekt (`react-native/gradle/libs.versions.toml`)                                  |
| iOS min / Xcode i SDK 57                      | iOS **16.4** / Xcode **≥ 26.4**                                                                                                                         | samma + bekräftat i genererat Xcode-projekt (`IPHONEOS_DEPLOYMENT_TARGET = 16.4`)                                         |
| Node.js för SDK 57                            | ≥ **22.13** (vi kör 22 i CI och lokalt)                                                                                                                 | samma                                                                                                                     |
| Google Play target API                        | Sedan **31 aug 2026**: nya appar och uppdateringar måste ha **targetSdk ≥ 36** (Android 16). Förlängning kan begäras till 1 nov 2026.                   | [developer.android.com – Target API level requirement](https://developer.android.com/google/play/requirements/target-sdk) |
| Apple SDK-krav                                | Sedan **28 apr 2026**: byggd med **Xcode 26+ och iOS 26 SDK**                                                                                           | [developer.apple.com/news/upcoming-requirements](https://developer.apple.com/news/upcoming-requirements/)                 |
| Apple min-OS för uppladdning                  | Sedan 9 sep 2026: appar måste ha deployment target **iOS 13+** (vi har 16.4 ✔)                                                                          | samma                                                                                                                     |
| Apples åldersgränssystem                      | Nytt system sedan 31 jan 2026 (nya frågor i App Store Connect). Påverkar M7-förberedelserna (inte "4+" rakt av – frågeformuläret ska besvaras på nytt). | samma                                                                                                                     |
| EU DSA trader status                          | Appar utan angiven trader-status tas bort ur App Store i EU. Linus måste ange status i App Store Connect (🔑, M8).                                      | samma                                                                                                                     |

**Slutsats:** Expo SDK 57 uppfyller både Googles krav (targetSdk 36) och Apples krav (EAS bygger med Xcode 26.x). Inget i SPEC.md krockar med kraven.

**Om nätåtkomst i utvecklingsmiljön:** docs.expo.dev, expo.dev, play.google.com, support.google.com, geofabrik.de och openfreemap.org är blockerade i molnmiljön där detta byggs. Expo-kraven verifierades därför mot källfilerna till Expos dokumentation på GitHub (`expo/expo` → `docs/` och `packages/@expo/sdk-compatibility`), som är exakt den data docs-sajten visar. `npx expo install` körs med `EXPO_OFFLINE=1` (löser versioner mot `expo/bundledNativeModules.json` lokalt i stället för Expos API).

---

## 2. Stack och projektstruktur

- **Expo SDK 57 + React Native 0.86 + TypeScript strict** (plus `noUncheckedIndexedAccess`). New Architecture och Hermes är obligatoriska/standard i SDK 57. (M1)
- **Expo Router med JavaScript-flikar (`Tabs` från `expo-router`)**, inte `expo-router/unstable-native-tabs`. Native tabs är fortfarande märkta _unstable_; JS-flikarna är stabila och sedan SDK 56 bundlade i Expo Router. Ger full kontroll över ikoner (egna SVG:er) och tillgänglighetsetiketter. (M1)
- **`src/app/`-struktur** (SDK 57-mallens standard). Flikar i `src/app/(tabs)/`: `index` (Karta), `nearby` (Närmast), `favorites` (Favoriter), `more` (Mer). Kod som inte är routes ligger utanför `src/app/`. (M1)
- **Egenritade SVG-ikoner via `react-native-svg`** (krävs ändå för kategoriikonerna enligt spec §8). Inga ikonbibliotek/typsnitt från tredje part. (M1)
- **React Compiler påslaget** (SDK 57-mallens standard, `experiments.reactCompiler`). (M1)
- **Webbmål behålls endast som utvecklings-/förhandsvisningsverktyg** (`react-native-web`, `react-dom`). Används för snabba visuella kontroller med Playwright i CI/molnmiljö (och ev. skärmdumpar för icke-kartvyer). Webben publiceras inte. (M1)
- **Kodlicens: `UNLICENSED` (alla rättigheter förbehållna)** tills Linus väljer annat. Konservativt standardval; ODbL kräver öppen tillgång till den _härledda databasen_ (löses via GitHub Pages i M2), inte till appens källkod. Byte till t.ex. MIT är en ändring på två rader. (M1)
- **Pakethanterare: npm** (`package-lock.json`). Node-version i `.nvmrc`. (M1)
- **Lint/format:** `eslint-config-expo` (flat config) + `eslint-config-prettier`, Prettier körs separat med `--check` i CI. (M1)
- **Tester:** `jest-expo` + `@testing-library/react-native` v14 (asynkron `render`) + `expo-router/testing-library` för navigeringstester. (M1)
- **CI:** GitHub Actions (`actions/checkout@v7`, `actions/setup-node@v7` – senaste majorversionerna enligt respektive repos README/taggar): lint, Prettier, typecheck, Jest, `expo-doctor`, samt en bundle-röktest (`expo export` för Android + iOS) som fångar Metro-fel utan att behöva native-bygge. (M1)

## 3. App-identitet

- **Bundle identifier / package name: `no.rastcamp.app`** enligt spec. Omvänd domän-konvention; kräver inte att domänen rastcamp.no ägs, men det är rekommenderat om den finns ledig. (M1)
- **Namnkrock:** Webbsökning (2026-10-09) hittade ingen app som heter "Rastcamp". Närmast är **"Rast"** (betalapp för lastbilschaufförer i Norden) – annat namn och annan målgrupp, bedöms inte som krock. Den slutgiltiga kontrollen sker när Linus skapar appposten i App Store Connect (namnet måste vara unikt där). Reservnamn om det skulle vara upptaget: **"Rastcamp – ställplatser"**, **"Rastcamp Norden"**. Bundle-id påverkas inte av visningsnamnet. (M1)
- **iPhone-only (`ios.supportsTablet: false`).** Spec: "surfplatta fungerar men inte optimerad". Med `supportsTablet: false` körs appen på iPad i iPhone-kompatibilitetsläge – och App Store kräver då inga iPad-skärmdumpar. (M1)
- **Stående läge** (`orientation: portrait`). (M1)
- **`ITSAppUsesNonExemptEncryption = false`** (`ios.config.usesNonExemptEncryption`). Appen använder bara systemets HTTPS → slipper exportfrågan vid varje TestFlight-uppladdning. (M1)

## 4. Språk (i18n)

- **i18next + react-i18next + expo-localization**, resurser inbakade i bundeln (synkron init, fungerar offline). Egen i18next-instans (`createInstance`) i stället för global singleton. (M1)
- **Språkmappning från enhetens språklista** (första träff vinner): `sv`→sv; `nb`/`no`/`nn`→nb; **`da`→nb** (skriven danska och bokmål är ömsesidigt begripliga, närmare än engelska); allt annat→nästa språk i enhetens lista, annars **en**. Exempel: finsk telefon med svenska som andraspråk → svenska. (M1)
- **`supportedLocales: en, sv, nb`** i expo-localization-pluginen → iOS `CFBundleLocalizations` och Android `localeConfig`, så att systemets "språk per app" (iOS-inställningar, Android 13+) visar våra tre språk. Manuellt språkval i appen (auto/sv/nb/en, F10) kommer i M5. (M1)
- **Typade översättningsnycklar** (`src/i18n/i18next.d.ts`, svenska är referens). Ett test kontrollerar att sv/nb/en har exakt samma nycklar och inga tomma strängar. (M1)
- **Undviker plural-nycklar** tills vidare: Hermes stöd för `Intl.PluralRules` är inte garanterat på alla enheter; i18next faller tillbaka men vi slipper beroendet. (M1)
- **Engelska termer:** "Motorhome stop" (ställplats), "Dump station", "LPG", brittisk stavning ("Favourites") eftersom målgruppen är europeisk. Norska: "Bobilplass", "Tømming", "Gass". (M1)

## 5. Design

- **Färgtokens** i `src/theme/colors.ts`: skogsgrön primärfärg (`#2E6B3F` ljus / `#7CC392` mörk), varm orange accent (`#B4530F` / `#F2A05A`), neutral grå bakgrund (`#F2F3F1` / `#111412`). Alla text/bakgrunds-par testas automatiskt mot **WCAG AA** (4,5:1 för text, 3:1 för stora glyfer) i `src/theme/__tests__/contrast.test.ts`. (M1)
- **Mörkt läge följer systemet** (`userInterfaceStyle: automatic`). (M1)

## 6. Säkerhet och hemligheter

- **Inga hemligheter i repot.** `.gitignore` utesluter `.env*`, signeringsfiler (`*.jks`, `*.keystore`, `*.p8`, `*.p12`, `*.mobileprovision`, `*.pem`, `*.key`) och service account-JSON. Tokens (EXPO_TOKEN m.fl.) läses från miljövariabler / GitHub Secrets / EAS. (M1)
- **Inga native-mappar i repot** (`/ios`, `/android` ignoreras) – Continuous Native Generation via `expo prebuild`/EAS. All native-konfiguration sker i `app.json` och config plugins. (M1)
