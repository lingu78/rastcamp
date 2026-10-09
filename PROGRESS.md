# Framsteg – Rastcamp

Bockas av enligt "Definition of done" i SPEC.md §13. Senast uppdaterad: 2026-10-09.

| #   | Milstolpe                     | Status   |
| --- | ----------------------------- | -------- |
| M1  | Repo & skelett                | ✅ Klar  |
| M2  | Datapipeline                  | 🔄 Pågår |
| M3  | Karta & filter                | ⬜       |
| M4  | Lista, detalj, favoriter, sök | ⬜       |
| M5  | Datauppdatering & Mer-flik    | ⬜       |
| M6  | Polish                        | ⬜       |
| M7  | Butiksmaterial                | ⬜       |
| M8  | 🔑 Konton & första byggen     | ⬜       |
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
- [ ] Riktig körning i GitHub Action med SE/NO/FI/DK: antal per kategori och storlek < 5 MB – kontrolleras efter push

## Kända begränsningar i utvecklingsmiljön

- Molnmiljön blockerar bl.a. `download.geofabrik.de`, `openfreemap.org`, `expo.dev`/`docs.expo.dev` och `play.google.com`. Påverkar M2 (PBF-nedladdning lokalt) och M3 (kartstil). Pipelinen kan ändå köras i GitHub Actions, som har fri nätåtkomst.
