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

## 7. Data och datapipeline

- **Node (TypeScript) + osmium-tool, inga npm-beroenden.** Pipelinen körs med Nodes inbyggda typ-strippning (Node ≥ 22.18), så samma TypeScript-typer och valideringskod delas med appen utan byggsteg. osmium gör det tunga PBF-arbetet (`tags-filter` + `export` till GeoJSON-seq). (M2)
- **Geofabrik-MD5 verifieras** efter varje nedladdning; cachad PBF återanvänds om MD5 stämmer. (M2)
- **Taggningsjusteringar mot spec §5.2** (spec tillåter justering):
  - Camping exkluderar `backcountry=yes`, `camp_site=basic|backcountry`, `motor_vehicle=no`/`motorcar=no` och `caravans=no`+`motorhome=no` – _utom_ när `motorhome`/`caravans=yes` uttryckligen anges. (M2)
  - `sanitary_dump_station=customers/public` räknas som tömning (inte bara `=yes`); `=no` gör det inte. (M2)
  - **Tillagt:** `water_point=yes` på annat objekt (typiskt en tömningsstation) ger en Vatten-plats – samma logik som specens `sanitary_dump_station=yes`. (M2)
  - **Alla kategorier:** `access=private|no`, `disused=yes`, `abandoned=yes`, `opening_hours=closed|off` utesluts. (M2)
  - Vatten-regeln "drinking_water inom 50 m från tömningsstation" räknar även tömning från `sanitary_dump_station=yes` på andra objekt. (M2)
- **Ett OSM-objekt kan ge flera platser** (camping med tömning → en Camping- och en Tömning-plats på samma koordinat). Unik nyckel i appen: `<osm-id>/<kategori>`. (M2)
- **Ytor → punkt:** ytviktad tyngdpunkt av yttre ringen; multipolygon → största delytan; öppen väg → medelvärde av noderna. osmium exporterar slutna vägar både som linje och yta – ytan föredras. osmiums yt-id (`a<2×id(+1)>`) normaliseras tillbaka till `w<id>`/`r<id>`. (M2)
- **Dedup 30 m per kategori:** objektet med namn > flest taggar > yta (före nod) behålls; den bortslagnas namn/taggar fyller luckor. Exakt sökning via rutnätsindex (cellstorlek ≥ radien upp till 82° N, dvs. även Svalbard). (M2)
- **Namn:** `name` → `name:sv/nb/no/en` → `official_name` → `brand` (t.ex. bensinstationskedja). Tomt namn = appen visar kategorinamnet (F6). (M2)
- **Taggwhitelist (F6):** fee, charge, opening_hours, phone (← contact:phone, contact:mobile), website (← contact:website, url), power_supply, shower, toilets, drinking_water, water_point, sanitary_dump_station (+ `:grey_water`, `:chemical_toilet`, `:black_water`), capacity (+ `:caravans`, `:motorhome`), dog, description (+ `:sv`, `:nb` ← `:no`, `:en`). Text normaliseras (blanksteg) och kortas (500 tecken för beskrivningar, annars 200). Listan finjusteras mot verklig data via `report.json` (vanligaste nycklar per kategori). (M2)
- **Filformat:** kompakta tupler `[id, kategoriindex, lat, lon, namn, taggar?]`, koordinater avrundade till 5 decimaler (~1 m), sorterat på kategori/lat/lon → stabil, deterministisk och välkomprimerande fil (gzip nivå 9). Manifestet innehåller SHA-256 för både gzip-filen och den okomprimerade JSON:en så att appen kan verifiera nedladdningen (F9). (M2)
- **Byggkontroller:** misslyckas vid 0 träffar i någon kategori, gzip > 5 MB eller schemavalideringsfel. Antal per kategori × land loggas och skrivs till Actions-sammanfattningen. (M2)
- **Publicering via `gh-pages`-grenen** (en squashad commit per publicering, så repot inte växer) i stället för `actions/deploy-pages`. Skäl: Pages-sajten ska innehålla både data (månadsvis) och integritetspolicy (M7); med deploy-pages ersätter varje deploy hela sajten, medan `publish.sh` lägger nytt ovanpå befintligt innehåll. (M2)

- **Gasol har låg täckning i OSM** (190 platser, varav 44 i Sverige): `fuel:lpg=yes` och `shop=gas` är sparsamt taggat, och gasolflaskor som säljs på vanliga bensinstationer/järnhandlar taggas sällan. Vi gissar inte (t.ex. utifrån kedjenamn) – felaktiga träffar är värre än få. Kan förbättras genom bättre taggning i OSM (appens "Rapportera fel" leder dit). (M2)
- **Förhandsdata via `data-preview`-grenen:** pipelinekörningar från andra grenar än `main` pushar sitt resultat till grenen `data-preview` (en commit, force-push), så att utvecklare och appens inbyggda data kan hämtas med vanlig git utan att publicera på Pages. (M2)

### ODbL (spec §5.5)

- Datafilen är en **härledd databas** (Derivative Database) av OSM; appen som visar den är ett **Produced Work**. Krav som följs: (M2)
  1. **Attribution** "© OpenStreetMap contributors" + ODbL-hänvisning i appen (kartan, Mer-fliken – F1/F10), i butikstexterna (M7) och i själva datafilen/manifestet (`attribution`, `license`).
  2. **Härledd databas tillgänglig för alla:** publiceras öppet på GitHub Pages under ODbL (`data/pois.json.gz`). Eftersom en appversion kan innehålla en äldre inbyggd datafil arkiveras de 24 senaste versionerna (`data/archive/`), så den databas som finns i varje appbygge går att hämta.
  3. Datan licensieras vidare under ODbL 1.0 (står i datafilen och i `data-pipeline/README.md`); inga tekniska skydd (DRM) läggs på datan.
- **Förutsättning:** GitHub Pages måste vara aktiverat och publikt (🔑 §14 punkt 1). Repot `lingu78/rastcamp` är i dag **privat** och GitHub Pages för privata repon kräver betald plan (GitHub Pro/Team). Rekommendation: göra repot publikt (gratis Pages, och öppenheten passar ODbL) – alternativt GitHub Pro. Detta tas upp vid närmaste 🔑-checkpoint.
