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

- **iOS-signering i CI (verifierat 2026-10-10 mot Expo-dokumentationen och eas-cli 24.12-källkoden):** `eas build --non-interactive` kan inte skapa det _första_ distributionscertifikatet eller registrera bundle-ID:t – det kräver en interaktiv körning en gång (`eas credentials:configure-build -p ios -e production`, Apple-ID + 2FA) på Linus dator. En App Store Connect-**teamnyckel med rollen Admin** lagras därefter hos EAS (via `eas credentials`) och används av både `eas submit` och icke-interaktiva byggen för att förnya provisioning-profilen; GitHub behöver bara `EXPO_TOKEN`. Appposten i App Store Connect skapas för hand (Apples API kan inte skapa appar) och dess numeriska Apple ID läggs som `ascAppId` i `eas.json` (krävs för icke-interaktiv submit). Android-nyckelarkivet skapas däremot automatiskt i CI. Integritetsmanifestet (Apples "required reason"-API:er, krav vid uppladdning) slås ihop av React Natives `pod install` från RN och beroendenas egna manifest (AsyncStorage, expo-file-system, expo-constants, expo-localization, expo-system-ui; MapLibre har eget i sitt ramverk) – inget `ios.privacyManifests` behövs om inte Apple anmärker (ITMS-91053). (M8)

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

## 8. Karta och filter (M3)

- **`@maplibre/maplibre-react-native` v11.5** (senaste stabila; stöder New Architecture, kräver Expo ≥ 54). Config-pluginen behövs för iOS (`$MLRN.post_install` i Podfile). Ingen Expo Go – development build/EAS. (M3)
- **Bakgrundskarta: OpenFreeMaps publika instans** – `liberty` i ljust läge, `dark` i mörkt läge. Gratis, ingen API-nyckel, inga cookies/registrering och inga gränser för antal visningar enligt projektets README. Kartbakgrunden kräver nät (spec: icke-mål att ha den offline); MapLibre-cache gör tidigare visade områden tillgängliga. (M3)
- **Attribution alltid synlig** som egen text ("© OpenMapTiles · © OpenStreetMap contributors", länk till osm.org/copyright) nere till vänster; MapLibres egen attributionsknapp och logga är avslagna (OpenFreeMap kräver attribution, inte loggan). (M3)
- **En klustrad GeoJSON-källa per kategori** (6 st) i stället för en gemensam: klustren räknar då bara synliga kategorier, och filtrering blir en ren `visibility`-växling på lagren – ingen data skickas om till native vid filterbyte. Ikoner = symbol-lager med PNG-markörer (genererade från samma SVG-glyfer som UI:t, `npm run icons:map`), kluster = cirkel-lager i kategorifärg med antal. Tryck på kluster zoomar in (`getClusterExpansionZoom`), tryck på markör öppnar detaljvyn. (M3)
- **Offline-reserv för kartan:** om stilen inte kan laddas (`onDidFailLoadingMap`) byts till en lokal stil med bara bakgrundsfärg, så att POI-markörerna (och klustren, utan siffror – typsnitt kräver nät) ändå syns. En banner förklarar och erbjuder "Visa lista" och "Försök igen". (M3)
- **Filterlogik:** inget valt = allt visas; första tryck på t.ex. "Tömning" visar bara tömning (snabbaste vägen för spec §3 flöde 1). Flerval; alla sex valda normaliseras till "inget filter". "Alla"-chip nollställer. Senaste val sparas i AsyncStorage och återställs vid start. Filtret delas av karta och lista. (M3)
- **Plats (F4):** behörighet efterfrågas vid start (en gång). Nekad/ej tillgänglig → kartan startar över Skandinavien (63° N, 17° Ö, zoom 3,6) och "närmast"-referensen blir kartans mittpunkt (uppdateras vid varje kartrörelse). Beviljad → kartan centreras på positionen (zoom 11) när första positionen kommer, om användaren inte redan har panorerat. Knappen "Centrera på mig" ber om behörighet igen eller öppnar systeminställningarna om den är permanent nekad. Positionen bevakas bara i förgrunden (`watchPositionAsync`, Balanced, 50 m), aldrig i bakgrunden. (M3)
- **Android-behörigheter begränsade** till `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION` (+ `INTERNET` från RN). Expo-mallens `SYSTEM_ALERT_WINDOW`, `READ/WRITE_EXTERNAL_STORAGE`, `VIBRATE` och `RECORD_AUDIO` blockeras uttryckligen (`android.blockedPermissions`) – renare för Play Data safety och användarnas förtroende. iOS: endast `NSLocationWhenInUseUsageDescription` (Always/Motion avstängda), lokaliserad till sv/nb/en via `expo.locales`. (M3)
- **Liten egen store** (`useSyncExternalStore`) för filter, plats och kartmittpunkt i stället för Zustand/Redux – tre värden motiverar inget beroende. (M3)
- **Inbyggd data som JSON-modul** (`assets/data/pois.json`, ~1,4 MB, laddas med `require`): ingen fil-I/O eller dekomprimering vid kallstart, fungerar identiskt i Jest/webb. Hermes kompilerar den till bytekod i bygget. Uppdateras före varje release med `npm run data:update` (verifierar manifestets SHA-256 + schema). (M3)
- **Android-verifiering i GitHub Actions** (`.github/workflows/android.yml`) eftersom molnmiljön saknar Android SDK/KVM: `expo prebuild` → `assembleRelease` (x86_64, JS inbäddad, debug-signerad) → emulator API 35 → tre startscenarier (plats nekad, plats beviljad i Oslo, mörkt läge) med kraschkontroll, skärmdumpar och kallstartstid. Release-varianten används i stället för en dev-client-build eftersom den inte behöver en Metro-server och testar det som faktiskt skeppas; EAS `development`-profil läggs till i M8 för Linus egen felsökning. (M3)

## 9. Lista, detalj, favoriter, sök (M4)

- **Närmast (F5):** `geokdbush.around` på ett KDBush-index (geodetiskt avstånd, samma resultat som en brute-force-sortering på haversine – testat på 5 000 slumpade punkter). Max 100 rader. Avstånd i km med en decimal under 10 km ("< 0,1 km" under 50 m), heltal därefter; decimalkomma på sv/nb. Riktning som 8-delad kompassriktning (N/NO/O… resp. N/NØ/Ø… och N/NE/E…) plus en roterad pil. (M4)
- **Sök (F11):** normaliserad namnsökning (gemener + vikning av å/ä/ö/ø/æ m.fl. utan `String.normalize`, som inte är garanterat i Hermes); alla sökord måste förekomma; respekterar kategorifiltret; resultaten sorteras på avstånd, max 100. < 10 ms på hela datasetet (krav < 200 ms, testat på den riktiga datan). (M4)
- **Detaljvy (F6) som `formSheet`** (react-native-screens native bottom sheet, detents 50 % / 100 %) – inget extra bottom-sheet-bibliotek. Egen stängknapp för skärmläsare. Fält utan data visas inte; yes/no översätts; `charge` går före `fee`; `24/7` → "Dygnet runt"; beskrivning på användarens språk om OSM har en. (M4)
- **Navigera dit:** iOS `https://maps.apple.com/?daddr=…` (öppnar Apple Kartor), Android `geo:lat,lon?q=lat,lon(namn)` (Google Maps eller valfri kartapp). Fallback till Google Maps webblänk. (M4)
- **Dela via React Natives `Share`** (text + koordinater + osm.org-länk) i stället för `expo-sharing`, som är till för filer – ett beroende mindre. (M4)
- **Rapportera fel:** `https://www.openstreetmap.org/note/new?lat=…&lon=…#map=18/…` i webbläsaren – rättelser hamnar där datan kommer ifrån och kommer alla till del. (M4)
- **Favoriter (F8):** ögonblicksbild (nyckel, namn, kategori, koordinater) i AsyncStorage, så att favoriter överlever en datauppdatering även om platsen ändras/försvinner. Listan sorteras på avstånd. (M4)
- **Marina objekt utesluts** från Tömning/Vatten (`seamark:*`, `waterway=*`, `boat/motorboat=yes`, `leisure=marina`) om inte husbil/husvagn uttryckligen välkomnas – båttömning i hamnar dök annars upp som tömningsstationer. (M4, pipeline)
- **Deep links:** `rastcamp://nearby`, `rastcamp://place/<osm-id>%2F<kategori>` (Expo Router). Används av emulatortest och skärmdumpar; `initialRouteName: (tabs)` gör att en djuplänk till en plats har flikarna under sig. (M4)

## 10. Datauppdatering och Mer (M5)

- **F9-flöde:** 4 s efter start (aldrig i vägen för kallstarten), högst en gång per dygn (tidsstämpel i AsyncStorage, sätts bara när manifestet faktiskt hämtats – en start utan nät "förbrukar" inte dagens kontroll): hämta `manifest.json` → jämför version → hämta `pois.json.gz` → kontrollera **storlek + SHA-256 för gzip + SHA-256 för JSON + schema + version** → skriv till temporär fil och flytta över (atomiskt) → byt dataset live. Alla fel ger `failed` och lämnar nuvarande data orörd. All logik är injicerbar och enhetstestad (korrupt, trunkerad, fel checksumma, fel schema, offline, en gång per dygn). (M5)
- **Bibliotek:** `expo-file-system` (nya `File`/`Directory`-API:t), `expo-crypto` (`digest` SHA-256), `fflate` (gunzip i ren JS, 8 kB – Hermes saknar `DecompressionStream`). (M5)
- **Lagrad data vinner bara om den är nyare** än den inbyggda (efter en appuppdatering med nyare inbyggd data används den). (M5)
- **Språk (F10):** auto/sv/nb/en sparas i AsyncStorage; "auto" följer enhetens (eller systemets per-app-) språk och omvärderas när appen kommer till förgrunden. (M5)
- **Licenser i appen:** genereras av `npm run licenses` från Metros source maps (= exakt de 78 npm-paket som faktiskt ligger i bundlen, inte alla 800+ i `node_modules`), plus MapLibre Native och OkHttp, plus datalicenser: ODbL 1.0 i fulltext, OpenMapTiles (BSD-3 + CC-BY 4.0) och OpenFreeMap. (M5)
- **Kartattribution med två länkar:** OpenMapTiles kräver en synlig kreditering _med länk till openmaptiles.org_, OSM en länk till copyright-sidan. (M5)

## 11. Polish (M6)

- **Appikon:** egen SVG (`assets/brand/icon-artwork.svg`): stiliserad husbil under en orange kartnål på skogsgrön bakgrund, ingen text. `npm run icons:app` renderar iOS/standard (1024², utan transparens), Android adaptiv förgrund (inom 66 % säkerhetszon) + monokrom (Android 13+ temaikoner), Play-ikon 512² och favicon. (M6)
- **Splash:** ikonen på grön bakgrund (spec §8), mörk variant med mörkare grönt. (M6)
- **Ljusare kategoriglyfer i mörkt läge** för chipsen (≥ 3:1 mot mörk yta, testat); markörfärgerna har ≥ 4,5:1 mot vit glyf. (M6)
- **Prestandamätning:** `[perf]`-markörer (data klar, kartstil laddad, karta renderad) i enhetsloggen + `am start -W` samlas in av emulatortestet och visas i Actions-sammanfattningen. Listsortering/sök mäts i Jest (< 100 ms resp. < 200 ms). (M6)

## 12. Butiksmaterial (M7)

- **Texter** i `store/listing/{sv,nb,en}.md` – alla teckengränser kontrollerade (undertitel 29/30, kort beskrivning ≤ 79/80, nyckelord ≤ 97/100). Nyckelorden upprepar inte ord från namn/undertitel (Apple indexerar dem redan). (M7)
- **Skärmdumpar genereras automatiskt** med Maestro (`store/screenshots/flows/screenshots.yaml`, `scripts/screenshots.sh`) i en riktig Android-emulator (1080×1920 – Play kräver högst 2:1) och iOS-simulator (6,9", 1320×2868) i GitHub Actions (`.github/workflows/screenshots.yml`), för sv/nb/en, med bildtext via `scripts/frame-screenshots.ts`. Flödet trycker på riktiga UI-element (text/tillgänglighetsetiketter), byter språk via Mer-fliken och slår på flygplansläge för offline-bilden (Android). iOS-jobbet bygger dessutom appen för simulator, vilket verifierar iOS-bygget innan EAS (M8). Körs bara på begäran eller när flödena ändras, eftersom macOS-minuter är dyra. (M7)
- **Feature graphic** 1024×500 per språk (24-bit PNG utan alfa, Plays krav) från samma SVG: `npm run store:graphics`. (M7)
- **Integritetspolicy** (sv/nb/en på en sida) i `site/privacy/`, publiceras på GitHub Pages ihop med datan. Kontaktadressen fylls i från repo-variabeln `CONTACT_EMAIL` vid publicering (🔑); utan den publiceras inte policysidan. (M7)
- **Data safety / App Privacy:** "No data collected" resp. "Data Not Collected" – positionen lämnar aldrig enheten, inga SDK:er för analys/krasch/reklam, ingen inloggning. Kartplattor och datafil hämtas utan identifierare. Motivering per datatyp i `store/google-data-safety.md` och `store/apple-privacy.md`. (M7)
- **Åldersgräns:** 4+ (Apples nya frågeformulär 2026) / PEGI 3 / Everyone; webblänkar öppnas i extern webbläsare (ingen "unrestricted web access"). Play "Target audience" 18+ för att inte omfattas av Families-policyn. (M7)

## 13. Lärdomar från emulator- och simulatorkörningar (M3–M7)

- **GPS-noggrannhet "High" i förgrunden** (inte "Balanced"): Balanced bygger på wifi/mobilnät och gav ingen position alls i emulatorn – i fjällen utan täckning (spec §3 flöde 3) riskerar den samma sak. Bevakningen pågår bara när appen är öppen (avstånd ≥ 50 m / 10 s), så batterikostnaden är liten. (M6)
- **"Väntar på position"** visas i listan när behörighet finns men ingen position ännu, i stället för det missvisande "platstjänster avstängda". (M6)
- **Android-runnerns disk räcker inte** för Gradle-bygge + emulatorns systemavbild: CI rensar oanvända verktyg (`scripts/ci-free-disk.sh`) och bygget tas bort innan emulatorn startar. (M6)
- **APK-storlek:** release-APK:n i CI är ~57 MB eftersom förbyggda native-bibliotek (bl.a. MapLibre) innehåller alla fyra CPU-arkitekturer. Google Play levererar `.aab` uppdelad per arkitektur, så nedladdning/installation per telefon blir en bråkdel; `scripts/apk-size.sh` uppskattar storleken för en arkitektur i varje körning (spec §7: < 40 MB). (M6)
- **Kallstart mäts på riktig telefon, inte i CI-emulatorn:** emulatorn kör mjukvaru-GPU (swiftshader) på 2 kärnor; `am start -W` ger där 4–10 s. Siffrorna loggas för trendjämförelse, men målet < 3 s verifieras på en mellanklass-Android enligt TESTPLAN.md. (M6)
- **iOS-bygget verifierat** på GitHubs macOS-runner (Xcode 26, Release, iPhone 17 Pro Max-simulator med iOS 26.5) innan något Apple-konto finns. (M7)
- **Maestro 2.11:** skärmdumpar måste skrivas i körningens `--test-output-dir`; platsbehörighet anges `allow` på Android men `inuse` på iOS. (M7)
- **Egen positionsprick** (blå cirkel ur appens expo-location-position) i stället för MapLibres `NativeUserLocation`: MapLibres platskomponent har en egen platsmotor som inte gav någon prick i emulatorn, och med en enda källa visar kartan exakt den position som "Närmast" räknar från. Ett platsabonnemang i stället för två sparar dessutom batteri. (M6)
- **Cirkel under varje kartikon:** samma färgade skiva ritas som cirkellager under symbollagret med ikonen. Ser identiskt ut när ikonen ritas, men om en GPU-drivrutin inte klarar symbollager (CI-emulatorns SwiftShader ritar varken text eller ikoner, trots att typsnitten hämtas med HTTP 200) syns platserna ändå. (M6)
- **Starttid mäts från aktivitetsstarten** i logcat (`performance.now()` räknar från enhetens uppstart på Android). (M6)
- **Emulatorns GPU-läge: Mesa (`-gpu lavapipe`).** Med SwiftShader (`swiftshader_indirect`, `software`) ritar MapLibre Native inga symbollager – varken ortnamn, klustersiffror eller ikoner – trots att typsnitten hämtas. Med Mesa ritas allt; röktestet och skärmdumparna kör därför på lavapipe. (M7)
- **Känd begränsning – detaljbladet vid kallstart via djuplänk (Android):** öppnas appen _direkt_ på `rastcamp://place/…` mäter react-native-screens bladets behållare innan den fått sin höjd, och bladet blir en smal remsa. Öppnat på vanligt sätt (tryck i lista/karta) fungerar det. Appen delar aldrig sådana länkar (Dela ger en openstreetmap.org-länk), så det påverkar inte användare; röktestet öppnar detaljvyn genom att trycka i listan. (M7)
- **Rörelsetext i Info.plist (`NSMotionUsageDescription`)** trots att appen aldrig läser rörelsedata: `expo-location` länkar CoreMotion (aktivitetsström), och App Store Connect avvisar då uppladdningen (ITMS-90683, första iOS-bygget). Texten säger ärligt att appen inte använder rörelsedata; den visas aldrig eftersom appen aldrig frågar. Ett test hindrar att den tas bort igen. (M8)
- **`sharp` är ett valfritt beroende** (`optionalDependencies`): det används bara av hjälpskripten för ikoner, feature graphic och skärmdumpar. Första EAS-bygget föll i `npm ci` när sharp inte hittade sin förbyggda binär på EAS macOS-maskin och försökte kompilera från källkod; som valfritt beroende hoppas det över utan att stoppa bygget. (M8)
- **EAS-byggloggar läses via GitHub Actions** (`eas.yml` → _logs_): utvecklingsmiljön når inte expo.dev, så arbetsflödet hämtar loggfilernas signerade adresser med `eas build:view --json`, packar upp dem (gzip/brotli) och skriver ut dem per byggfas. (M8)
- **Systemdialoger i CI:** den långsamma emulatorn fick "Pixel Launcher isn't responding" över appen; `settings put global hide_error_dialogs 1` döljer dem. (M7)

## 14. Ruttläge (önskemål 2026-10-10, vilande)

Linus önskemål: välj mål (t.ex. 150 mil bort), max körtid per dag och typ av stopp → förslag på
övernattning vid max körtid, rastplatser under dagen samt tömning/vatten per etapp. Beslut: v1.1 med
en ruttjänst på nätet – därefter **lagt på is** ("vi droppar det för nu"). Underlag till nästa gång:

- **OpenRouteService (HeiGIT):** gratisnivå 2 000 rutter/dygn och 40/min; attribution "© openrouteservice.org by HeiGIT | Map data © OpenStreetMap contributors". Villkoren förbjuder API-nyckeln i en klientapp ("an API key must not be used client-side in an application") – kräver en egen server/proxy (t.ex. Cloudflare Workers) eller att varje användare har egen nyckel. Källa: ORS FAQ (GIScience/openrouteservice docs).
- **FOSSGIS/OSRM publika servrar:** ingen nyckel, "fair use" utan garantier, kan dras in när som helst.
- **Geoapify:** gratisplan, kommersiell användning tillåten med attribution enligt deras FAQ; om nyckeln får ligga i en mobilapp är inte kontrollerat (sidan nåddes inte).
- **Stadia Maps:** gratisplanen tillåter inte kommersiell användning.
- Oavsett tjänst: start/mål lämnar telefonen → integritetspolicy och butikernas integritetsuppgifter måste uppdateras.

## 15. Sök ort eller plats (önskemål 2026-10-12)

- **Helt offline:** ortsnamnen tas ut ur samma Geofabrik-extrakt som platserna (eget osmium-pass, `data-pipeline/src/places.ts`) och följer med appen (`assets/data/places.json`). Ingen geokodningstjänst, inget konto, inget lämnar telefonen – integritetsuppgifterna är oförändrade.
- **Vilka orter:** namngivna `place=city/town/village/hamlet/suburb`, öar och skärgårdar med Wikidata-koppling (Finland har tiotusentals namngivna holmar) samt `boundary=national_park`. Alternativa namn (`name:sv/fi/nb/en/se…`, `alt_name`) är sökbara, så "Helsingfors" hittar Helsinki. Mindre orter får "nära <stad>" (närmaste stad/tätort inom 50 km) för att skilja namnar åt.
- **Rankning:** hela namnet → början av namnet → början av ord → delsträng; därefter ortstyp (stad före by), folkmängd och avstånd från användaren.
- **Beteende:** vald ort flyttar kartan och visar en ringmarkör; "Närmast" mäter från orten tills man rensar. Inte sparad – efter omstart utgår appen från telefonens position igen. Ortsfilen läses in först när sökningen öppnas (inte vid start).

## 16. Android pausad (2026-10-12)

Linus beslut: bara iOS tills vidare. Android-röktestet körs inte längre automatiskt
(`android.yml` startas bara för hand), skärmdumpsflödet tar bara iOS-bilder om man inte väljer
Android, och EAS-arbetsflödet har iOS som standard. Ingen kod tas bort: appen är Expo och
fungerar för båda plattformarna, Android-konfigurationen i `app.json`, Play-material i `store/`
och CI:s bundle-test för Android ligger kvar så att Android kan återupptas utan omtag.

## 17. Simulatorkrasch i skärmdumpsjobbet (2026-10-12)

I iOS-simulatorn på GitHubs macOS-maskiner dog appen ibland (SIGBUS eller SIGSEGV) när
sökskärmen öppnades eller strax efter inmatning, men bara när Maestro först hade installerat om
och startat appen (`launchApp clearState`): 7 av 13 körningar. När skriptet själv installerade och
startade appen med lldb ansluten kraschade den aldrig (0 av 18, även hela skärmdumpsflödet), och
build 4 fungerar på Linus iPhone. Ingen kraschrapport skrivs på maskinerna, så orsaken är inte
fastställd; felsökningsjobbet `ios-repro.yml` finns kvar för att få en anropsstack.

- Skärmdumpsflödet gör upp till tre försök per språk (`scripts/screenshots.sh`).
- Sökindexet gjordes samtidigt lättare (en namnsträng, avkodning bara av träffar: 21 MB i stället
  för 42 MB JS-minne, samma resultat). Det är en förbättring i sig men tog inte bort kraschen.
- Ses kraschen på en riktig telefon (TestFlight-feedback, kraschloggar i App Store Connect) tas
  den upp igen med högsta prioritet.
