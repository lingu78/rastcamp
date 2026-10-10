# Framsteg – Rastcamp

Bockas av enligt "Definition of done" i SPEC.md §13. Senast uppdaterad: 2026-10-09.

| #   | Milstolpe                     | Status   |
| --- | ----------------------------- | -------- |
| M1  | Repo & skelett                | ✅ Klar  |
| M2  | Datapipeline                  | ✅ Klar  |
| M3  | Karta & filter                | ✅ Klar  |
| M4  | Lista, detalj, favoriter, sök | ✅ Klar  |
| M5  | Datauppdatering & Mer-flik    | ✅ Klar  |
| M6  | Polish                        | ✅ Klar¹ |
| M7  | Butiksmaterial                | ✅ Klar  |
| M8  | 🔑 Konton & första byggen     | 🔄 Pågår |
| M9  | Closed test / TestFlight      | ⬜       |
| M10 | 🔑 Inskick                    | ⬜       |

---

## M1 – Repo & skelett

Definition of done: _Expo-projekt, TypeScript strict, Expo Router med 4 flikar, i18n sv/nb/en, CI grön._

- [x] Expo SDK 57-projekt (RN 0.86, React 19.2, New Architecture, Hermes) – krav verifierade, se DECISIONS.md §1
- [x] TypeScript strict (+ `noUncheckedIndexedAccess`), `npm run typecheck` grön
- [x] Expo Router med 4 flikar: Karta, Närmast, Favoriter, Mer (egna SVG-ikoner, tillgänglighetsetiketter)
- [x] i18n sv/nb/en via expo-localization + i18next, följer enhetens språk; typade nycklar
- [x] Ljust/mörkt tema med WCAG AA-testade färgtokens
- [x] ESLint (eslint-config-expo) + Prettier
- [x] Jest + React Native Testing Library: 43 tester (språkmappning, nyckelparitet, kontrast, flik-navigering sv/nb)
- [x] GitHub Actions CI: lint, Prettier, typecheck, tester, expo-doctor, bundle-röktest Android+iOS
- [x] Verifierat lokalt: `expo export` bygger Android- och iOS-bundles; `expo prebuild` ger targetSdk 36 / minSdk 24 / iOS 16.4 / iPhone-only / `CFBundleLocalizations` sv, nb, en
- [x] Visuell kontroll via webbexport + Playwright (ljust/sv och mörkt/nb) – inga konsolfel
- [x] `.gitignore` för hemligheter, nyckelfiler och genererade native-mappar
- [x] CI grön på GitHub: https://github.com/lingu78/rastcamp/actions/runs/37919465025

## M2 – Datapipeline

Definition of done: _`pois.json.gz` för SE/NO/FI/DK genereras lokalt och i GitHub Action; antal per kategori loggas; < 5 MB._

- [x] `data-pipeline/`: Geofabrik-nedladdning (MD5-verifierad) → `osmium tags-filter` → `osmium export` → Node (kategorier, centroid, taggwhitelist, vatten-regel 50 m, dedup 30 m)
- [x] Utdata: `pois.json.gz`, `manifest.json` (version, datum, sha256), `report.json`; bygget failar vid 0 träffar/kategori, > 5 MB eller schemafel
- [x] Antal per kategori × land loggas (konsol + Actions-sammanfattning)
- [x] Enhetstester: taggar → kategori, centroid, haversine, rutnätsindex, dedup, vatten-regel, manifest/checksumma, validering + end-to-end-test av CLI:t mot OSM-fixtur (osmium installeras i CI)
- [x] Genereras lokalt: verifierat end-to-end med fixtur (riktiga Geofabrik-filer är blockerade i molnmiljön – se nedan)
- [x] GitHub Action `data.yml`: månadsvis + manuellt (publicerar till `gh-pages`) och vid pipeline-ändringar (bygger på riktig data)
- [x] Riktig körning i GitHub Action ([Data #1](https://github.com/lingu78/rastcamp/actions/runs/37920598778), OSM-data 2026-10-08): **13 327 platser, `pois.json.gz` 0,38 MB** (okomprimerat 1,42 MB), 397 dubbletter borttagna, 208 dricksvattenposter vid tömningsstationer. Hela körningen inkl. nedladdning av 3,5 GB PBF tar ~7 min.

  | Kategori   | SE    | NO    | FI    | DK    | Totalt |
  | ---------- | ----- | ----- | ----- | ----- | ------ |
  | Ställplats | 648   | 382   | 238   | 328   | 1 596  |
  | Camping    | 1 417 | 1 342 | 430   | 615   | 3 804  |
  | Tömning    | 594   | 498   | 268   | 409   | 1 769  |
  | Vatten     | 267   | 247   | 105   | 297   | 916    |
  | Rastplats  | 773   | 1 774 | 1 186 | 1 319 | 5 052  |
  | Gasol      | 44    | 104   | 34    | 8     | 190    |

## M3 – Karta & filter

Definition of done: _F1–F4 klara, development build körbar på Android-emulator._

- [x] F1 MapLibre (v11) + OpenFreeMap `liberty` (ljust) / `dark` (mörkt), zoom/panorering; attribution "© OpenMapTiles · © OpenStreetMap contributors" alltid synlig (två länkar)
- [x] F2 kategorimarkörer (egen ikon + färg) i 6 klustrade GeoJSON-källor; tryck på kluster zoomar in, tryck på markör öppnar detaljvyn
- [x] F3 filterchips (flerval, "Alla"), påverkar karta och lista direkt, senaste val sparas
- [x] F4 plats efter tillstånd, "centrera på mig"; nekad → Skandinavien + lista från kartans mittpunkt
- [x] Offline-reserv: lokal bakgrundsstil + banner om bakgrundskartan inte laddas
- [x] Komponenttester (karta/filter/nekad plats) gröna
- [x] Release-APK körbar på Android-emulator (API 35) i GitHub Actions ([Android-workflow](https://github.com/lingu78/rastcamp/actions/workflows/android.yml)): nekad plats → Skandinavien, plats i Oslo → kartan centreras med blå prick, mörkt läge, ingen krasch
- [x] Egen positionsprick från appens GPS-position; färgad cirkel under varje ikon (syns även om en GPU inte ritar symboler)

## M4 – Lista, detalj, favoriter, sök

Definition of done: _F5–F8, F11 klara, offline verifierad._

- [x] F5 Närmast: 100 närmaste, km med en decimal under 10 km, riktning; sortering = haversine (testat mot brute force)
- [x] F6 detaljvy (bottom sheet): bara fält med data; Navigera dit (Apple Kartor / geo-intent), Spara favorit, Dela, Rapportera fel (OSM-anteckning)
- [x] F7 all platsdata inbyggd; lista/filter/detalj/favoriter använder ingen nätverkstrafik
- [x] F8 favoriter i AsyncStorage, överlever omstart (testat)
- [x] F11 namnsökning < 10 ms på 13 000 platser (krav < 200 ms, testat på riktig data)
- [x] Komponenttester för lista och detaljvy
- [x] Offline verifierad på emulator i flygplansläge: lista, sök, filter, detaljvy och favoriter fungerar; kartan visar cachade plattor eller reservbakgrund
- [x] Detaljvyn som bottenblad (halv höjd, dras till helskärm) verifierad på emulator med och utan animationer

## M5 – Datauppdatering & Mer-flik

Definition of done: _F9–F10 klara, licenser i appen._

- [x] F9 manifest-kontroll max 1 gång/dygn (+ manuellt), nedladdning i bakgrunden, storlek + SHA-256 (gzip och JSON) + schema verifieras, atomisk skrivning, faller tillbaka på inbyggd data; testat för korrupt/trunkerad/offline
- [x] F10 Mer: språk (auto/sv/nb/en), enheter (km), datakällor & licenser, integritetspolicy-länk, appversion, datadatum + källa
- [x] Licenstexter i appen: ODbL 1.0 (fulltext), OpenMapTiles, OpenFreeMap, MapLibre Native, OkHttp + alla 78 npm-paket i bundlen

## M6 – Polish

Definition of done: _Ikon, splash, mörkt läge, tillgänglighet, prestandamål uppfyllda, alla tester gröna._

- [x] Appikon (husbil + kartnål, ingen text) i alla storlekar inkl. Android adaptiv/tema-ikon, splash på grönt
- [x] Mörkt läge (app + karta), glyffärger anpassade och kontrasttestade
- [x] Tillgänglighet: etiketter på alla knappar/länkar, roller (button/link/radio/header), textskalning, WCAG AA-kontrast testad automatiskt
- [x] Alla tester gröna (232 st)
- [x] Starttid mäts i varje emulatorkörning (från aktivitetsstart: platsdata klar, kartstil laddad, karta renderad)
- [ ] ¹ Målet kallstart < 3 s kan inte bekräftas i CI-emulatorn (mjukvaru-GPU, 2 kärnor: platsdata klar efter 2–3 s vid omstart, 7–9 s första gången; kartan väntar dessutom på nätet). Verifieras på en riktig mellanklass-Android enligt TESTPLAN.md under det slutna testet (M9).

## M7 – Butiksmaterial

Definition of done: _Allt i avsnitt 9–10 klart i `store/`, integritetspolicy publicerad._

- [x] Butikstexter sv/nb/en (namn, undertitel, kort/lång beskrivning, nyckelord, reklamtext, What's new) inom teckengränserna – `store/listing/`
- [x] Notes for review (Apple, inkl. riktlinje 4.2) – `store/apple-review-notes.md`
- [x] Apple App Privacy + Google Data safety + åldersgräns/IARC – `store/`
- [x] Feature graphic 1024×500 (sv/nb/en) och Play-ikon 512²
- [x] Integritetspolicy sv/nb/en (`site/privacy/`) + Pages-startsida och öppen-data-sida
- [x] Material för slutet test och TestFlight (inbjudan, guide, påminnelser dag 7/12, svar till produktionsansökan) – `store/testing/`
- [x] Skärmdumpar Android 1080×1920 sv/nb/en (5 st/språk) – `store/screenshots/final/android/`, metod i `store/screenshots/README.md`
- [x] Skärmdumpar iPhone 6,9" (1320×2868) sv/nb/en (5 st/språk) – `store/screenshots/final/ios/`
- [x] Integritetspolicy publicerad (sv/nb/en): <https://lingu78.github.io/rastcamp/privacy/>

## M8 – 🔑 Konton & första byggen

Definition of done: _Android-bygge i Internal testing, iOS-bygge i TestFlight._

- [x] Repot publikt, arbetsgrenen sammanslagen till `main` ([PR #1](https://github.com/lingu78/rastcamp/pull/1))
- [x] Datapipelinen publicerad till `gh-pages`, GitHub Pages på: <https://lingu78.github.io/rastcamp/>
- [x] Expo-konto + `EXPO_TOKEN`; EAS-projekt skapat i Actions: [@lingu78_app/rastcamp](https://expo.dev/accounts/lingu78_app/projects/rastcamp) (projectId i `app.json`)
- [x] Integritetspolicy publicerad med kontaktadress (repo-variabeln `CONTACT_EMAIL`; publiceringssteget fick först inte variabeln – rättat och testat)
- [x] Apple Developer Program (Individual, team `MKSMHVZ5AM`); distributionscertifikat + App Store-profil skapade med `eas credentials:configure-build` (giltiga till 2027-10-10); App Store Connect API-nyckel (Admin) lagrad hos EAS
- [x] App i App Store Connect: Rastcamp, `no.rastcamp.app`, Apple ID `6821287622` (`ascAppId` i `eas.json`)
- [ ] Första iOS-bygget i GitHub Actions → TestFlight
- [ ] Google Play Console → app → service account → Android-bygge → Internal testing (senare)

## Kända begränsningar i utvecklingsmiljön

- Molnmiljön blockerar bl.a. `download.geofabrik.de`, `openfreemap.org`, `expo.dev`/`docs.expo.dev` och `play.google.com`. Påverkar M2 (PBF-nedladdning lokalt) och M3 (kartstil). Pipelinen kan ändå köras i GitHub Actions, som har fri nätåtkomst.
