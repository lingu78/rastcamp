# Rastcamp – kravspecifikation för mobilapp (iOS + Android)

> **Till Claude Code:** Det här dokumentet är din uppdragsbeskrivning. Läs det i sin helhet innan du börjar. Arbeta så självständigt som möjligt genom milstolparna i avsnitt 13. Stanna och fråga Linus **endast** vid de checkpoints som är markerade med 🔑 (konton, inloggning, betalning, identitet) eller om ett krav i detta dokument visar sig vara omöjligt/felaktigt. Allt annat – tekniska val inom ramarna, kod, tester, ikon, texter, skärmdumpar, integritetspolicy – avgör du själv och dokumenterar i `DECISIONS.md`.

---

## 0. Arbetsregler för Claude Code

1. **Verifiera aktuella krav själv.** Butikernas regler ändras (t.ex. Googles krav på target API level, Apples krav på Xcode/SDK-version, Expo SDK-version). Slå upp gällande krav i officiell dokumentation innan du konfigurerar build/release, och notera vad du hittade i `DECISIONS.md`.
2. **Inga hemligheter i repot.** Tokens och nycklar (EXPO_TOKEN, App Store Connect API-nyckel, Google Play service account JSON) läses från miljövariabler eller EAS Secrets. Lägg `.env*` och nyckelfiler i `.gitignore`.
3. **Du skapar aldrig konton, anger aldrig lösenord och betalar aldrig något.** Det gör Linus vid 🔑-checkpoints. Du förbereder exakt vad han behöver göra som en kort checklista med länkar.
4. **Minsta möjliga beroenden.** Inget backend, ingen databas på server, inga användarkonton, ingen analys/spårning, inga annonser.
5. **Commit ofta**, med tydliga meddelanden. Håll `README.md` uppdaterad med hur man bygger och kör.
6. **Definition of done per milstolpe** står i avsnitt 13 – bocka av i `PROGRESS.md`.

---

## 1. Produkt i en mening

**Rastcamp hjälper husbils- och husvagnsfolk i Norden att snabbt hitta närmaste ställplats, camping, tömningsstation, vattenpåfyllning, rastplats och gasol – gratis, utan konto, utan reklam och fungerar offline.**

### Varför den här appen (bakgrund, behöver inte implementeras)

- Linus har redan en webbprototyp ("Rastcamp", Leaflet + OSRM + Overpass). Den här appen är en förenklad, mobil, offline-först-version.
- Befintliga alternativ (t.ex. Park4Night, Campercontact) är stora men bygger på konto, reklam och/eller betalvägg. Rastcamps vinkel: **snabbast till svaret "var kan jag tömma/tanka vatten/sova i natt?"**, på svenska/norska, offline, noll friktion.

### Målgrupp

Husbils- och husvagnsägare samt hyrare i Sverige och Norge (sekundärt Finland och Danmark), 35–75 år, ofta med dålig täckning i fjällen.

---

## 2. Avgränsning

### I MVP (v1.0)

- Karta med POI:er (platser) i SE, NO, FI, DK från OpenStreetMap, förpackade i appen (offline).
- Filtrering per kategori.
- Lista "Närmast mig" sorterad på avstånd.
- Detaljvy per plats med tillgänglig info + "Navigera dit" (öppnar Apple Kartor/Google Maps).
- Favoriter (lokalt på enheten).
- Språk: svenska, norska (bokmål), engelska – följer enhetens språk.
- Mörkt läge.

### Uttryckligen INTE i v1.0 (icke-mål)

- Egen ruttplanering/turn-by-turn (vi lämnar över till kartappen).
- Användarkonton, recensioner, foton, kommentarer.
- Bokning eller betalning.
- Push-notiser, analys, annonser, köp i appen.
- Offline-kartbakgrund (bakgrundskartan kräver nät; POI-datan fungerar alltid offline – se F7).

---

## 3. Användarflöden

1. **"Var kan jag tömma?"** Öppna appen → kartan centreras på min position → tryck filterchip "Tömning" → se närmaste i lista → tryck → "Navigera dit".
2. **"Var sover vi i natt?"** Filter "Ställplats" + "Camping" → panorera kartan längs planerad väg → tryck på kluster/markör → detaljvy → spara som favorit.
3. **Utan täckning i fjällen.** Bakgrundskartan laddar inte → appen visar ändå listvyn "Närmast mig" (bygger på GPS + lokal data) och detaljvyer.

---

## 4. Funktionella krav

| ID  | Krav                                                                                                                                                                                                                                                                                                                                                                                               | Acceptanskriterier                                                                                                              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| F1  | **Karta** med vektorkarta från OpenFreeMap (stil `liberty` eller motsvarande), MapLibre.                                                                                                                                                                                                                                                                                                           | Kartan visas, går att zooma/panorera, attribution "© OpenMapTiles, data © OpenStreetMap contributors" syns.                     |
| F2  | **POI-markörer** med ikon och färg per kategori, klustrade vid utzoomning.                                                                                                                                                                                                                                                                                                                         | Tusentals punkter laggar inte (≥ 50 fps på mellanklass-Android vid panorering).                                                 |
| F3  | **Kategorifilter** som chips överst: Ställplats, Camping, Tömning, Vatten, Rastplats, Gasol. Flerval. Senaste val sparas.                                                                                                                                                                                                                                                                          | Filter påverkar både karta och lista direkt.                                                                                    |
| F4  | **Min position** (efter tillstånd). Knapp "centrera på mig".                                                                                                                                                                                                                                                                                                                                       | Appen fungerar även om användaren nekar plats – då startar kartan över Skandinavien och listan sorteras på kartans mittpunkt.   |
| F5  | **Lista "Närmast"** (växla karta/lista). Visar namn, kategori, avstånd (km, 1 decimal under 10 km), riktning. Max 100 rader.                                                                                                                                                                                                                                                                       | Sorteringen stämmer mot haversine-avstånd.                                                                                      |
| F6  | **Detaljvy** (bottom sheet): namn (eller kategori-namn om namn saknas), kategori, koordinater, och de av följande OSM-fält som finns: avgift, öppettider, telefon, webbplats, el, dusch, toalett, vatten, tömning gråvatten/kassett, max antal, hundar tillåtna, `description`. Knappar: Navigera dit, Spara favorit, Dela, "Rapportera fel" (öppnar osm.org-anteckning på platsen i webbläsaren). | Fält utan data visas inte. "Navigera dit" öppnar Apple Kartor på iOS och Google Maps (geo-intent) på Android med koordinaterna. |
| F7  | **Offline**: all POI-data ligger i appen.                                                                                                                                                                                                                                                                                                                                                          | Med flygplansläge: lista, filter, detaljvy och favoriter fungerar.                                                              |
| F8  | **Favoriter**, lokalt lagrade (AsyncStorage eller expo-sqlite). Egen flik.                                                                                                                                                                                                                                                                                                                         | Överlever omstart. Ingen data lämnar enheten.                                                                                   |
| F9  | **Datauppdatering**: appen kontrollerar vid start (om nät finns, max 1 gång/dygn) om en nyare datafil finns publicerad (se 5.4) och laddar ner den i bakgrunden. Faller tillbaka på inbyggd data.                                                                                                                                                                                                  | Fungerande med och utan nät; trasig nedladdning ersätter aldrig fungerande data (validera checksumma).                          |
| F10 | **Inställningar/Om**: språk (auto/sv/nb/en), enheter (km), datakällor & licenser (ODbL, OpenFreeMap, MapLibre m.fl.), länk till integritetspolicy, appversion, datadatum.                                                                                                                                                                                                                          | Licenstexter finns i appen.                                                                                                     |
| F11 | **Sök på namn** (enkel textsökning bland POI:er, lokal).                                                                                                                                                                                                                                                                                                                                           | Svar < 200 ms.                                                                                                                  |

---

## 5. Data

### 5.1 Källa

OpenStreetMap via **Geofabrik-extrakt** (`sweden-latest.osm.pbf`, `norway-latest.osm.pbf`, `finland-latest.osm.pbf`, `denmark-latest.osm.pbf`). Använd **inte** publika Overpass- eller OSRM-servrar i den publicerade appen (deras användarvillkor tillåter inte appbelastning).

### 5.2 Kategorier → OSM-taggar (utgångspunkt, justera om du hittar bättre taggning och dokumentera)

| Kategori   | Taggar                                                                                                                                    |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Ställplats | `tourism=caravan_site`                                                                                                                    |
| Camping    | `tourism=camp_site` (exkludera `backcountry=yes` och `camp_site=basic` utan fordonstillträde om möjligt)                                  |
| Tömning    | `amenity=sanitary_dump_station` samt platser med `sanitary_dump_station=yes`                                                              |
| Vatten     | `amenity=water_point`, samt `amenity=drinking_water` **endast** om `caravans=yes`/`motorhome=yes` eller inom 50 m från en tömningsstation |
| Rastplats  | `highway=rest_area`, `highway=services`                                                                                                   |
| Gasol      | `amenity=fuel` med `fuel:lpg=yes`, samt `shop=gas`                                                                                        |

Ytor (ways/relations) reduceras till en punkt (centroid).

### 5.3 Pipeline

- Skript i `data-pipeline/` (Node eller Python, ditt val) som: laddar ner PBF → filtrerar med `osmium tags-filter` → konverterar till kompakt JSON (eller SQLite) med fält: `id`, `cat`, `lat`, `lon`, `name`, `tags` (endast whitelistade nycklar från F6).
- Deduplicera punkter av samma kategori inom 30 m.
- Rimlighetskontroll: skriv ut antal per kategori och land; bygget failar om en kategori har 0 träffar.
- Mål: datafilen < 5 MB komprimerad.

### 5.4 Automatisk uppdatering

GitHub Action som kör pipelinen **månadsvis**, publicerar `pois.json.gz` + `manifest.json` (version, datum, sha256) på GitHub Pages. Appen läser manifestet (F9). Inbyggd datafil uppdateras vid varje appsläpp.

### 5.5 Licens

OSM-data är ODbL: attribution i appen (F1, F10) och i butikstexten. Datafilen är en "produced work"/databas – notera ODbL-kraven i `DECISIONS.md` och följ dem (öppen tillgång till den härledda databasen via GitHub Pages räcker).

---

## 6. Teknisk stack

- **Expo** (senaste stabila SDK) + **React Native** + **TypeScript** (strict).
- **Expo Router** för navigering (flikar: Karta, Närmast, Favoriter, Mer).
- **@maplibre/maplibre-react-native** för kartan (kräver development build, inte Expo Go – konfigurera config plugin).
- `expo-location`, `expo-localization` + `i18next`, `expo-linking`, `expo-file-system`, `expo-sharing`.
- Rumslig sökning: `kdbush` + `geokdbush` (eller motsvarande) i minnet.
- **EAS Build** för molnbyggen av både iOS och Android (ingen Mac krävs). **EAS Submit** för uppladdning till butikerna.
- Lint/format: ESLint + Prettier. Tester: Jest (+ React Native Testing Library).

Bundle identifier / package name: `no.rastcamp.app` (kontrollera att namnet "Rastcamp" inte krockar med befintlig app i butikerna; föreslå alternativ i `DECISIONS.md` om det gör det).

---

## 7. Icke-funktionella krav

- **Integritet:** Ingen data samlas in. Plats används endast på enheten. Inga tredjeparts-SDK:er för analys/krasch-rapportering.
- **Prestanda:** Kallstart till interaktiv karta < 3 s på mellanklass-Android. Listsortering < 100 ms.
- **Storlek:** Installationsstorlek < 40 MB.
- **Tillgänglighet:** Alla knappar har tillgänglighetsetiketter; text skalar med systemets textstorlek; kontrast WCAG AA.
- **Stöd:** iOS och Android enligt Expo SDK:ns minimikrav; telefon i stående läge (surfplatta: fungerar men inte optimerad).
- **Robusthet:** Ingen krasch när nät saknas, tillstånd nekas eller datafil saknas.

---

## 8. Design

- Lugn, utomhusinspirerad: grundfärg skogsgrön, accent varm orange (tömning/gasol), neutral grå bakgrund. Ljust och mörkt läge.
- Kategoriikoner: enkla, egenritade SVG (inga tredjepartsvarumärken).
- **Appikon:** du tar fram den själv (SVG → alla storlekar via Expo). Motiv: stiliserad husbil + kartnål. Ingen text i ikonen.
- Splash: ikon på grön bakgrund.

---

## 9. Juridik och butikskrav (förbered allt, Linus skickar in)

- **Integritetspolicy** (sv/nb/en) publicerad på GitHub Pages: ingen data samlas in, platsbehörighet används lokalt, kontakt-e-post (🔑 Linus anger vilken).
- **Google Play Data safety:** "No data collected / no data shared". Förbered svaren i `store/google-data-safety.md`.
- **Apple App Privacy:** "Data Not Collected". Förbered i `store/apple-privacy.md`.
- **Behörighetstexter** (iOS `NSLocationWhenInUseUsageDescription` m.fl.) på sv/nb/en.
- **Åldersgräns:** 4+ / Everyone – förbered frågeformulärssvar.
- **Apples riktlinje 4.2 (minimal funktionalitet):** appen måste kännas som en riktig app, inte en inslagen webbsida. Offline-data, favoriter och native-karta ska göra det tydligt – nämn detta i "Notes for review".
- Inga användarkonton → inget krav på kontoradering.

---

## 10. Butiksmaterial (du tar fram allt i `store/`)

- Appnamn, undertitel (iOS 30 tecken), kort beskrivning (Play 80 tecken), lång beskrivning, nyckelord (iOS 100 tecken) – på **sv, nb, en**.
- Skärmdumpar i krävda storlekar (minst iPhone 6,9" och Android telefon), 4–6 st per språk: karta med filter, närmast-lista, detaljvy, offline, favoriter. Generera dem automatiskt (t.ex. via webbyggnad/Playwright med enhetsram eller via emulator i CI) – dokumentera metoden så de kan genereras om.
- Feature graphic för Google Play (1024×500).
- "What's new"-text för v1.0.
- "Notes for review" till Apple.

---

## 11. Tester och kvalitet

- Enhetstester: avståndsberäkning, filtrering, datapipeline-mappning (taggar → kategori), dedup, manifest/checksumma.
- Komponenttester för lista och detaljvy.
- Manuell testchecklista i `TESTPLAN.md` som Linus/testare kan följa på sin telefon (inkl. flygplansläge och nekad plats).
- CI (GitHub Actions): lint + typecheck + tester på varje push.

---

## 12. Release-pipeline

### Android (Google Play)

1. EAS Build → `.aab`.
2. EAS Submit → **Internal testing** (för snabb egen test).
3. **Closed testing**-spår: nya personliga utvecklarkonton måste ha **minst 12 testare som är anmälda i 14 dagar i följd** innan man kan ansöka om produktion. Förbered: testarinbjudan (text + länk), instruktion till testare på svenska/norska, och en påminnelse dag 7 och 12.
4. Efter 14 dagar: 🔑 Linus ansöker om produktionsåtkomst (du förbereder svaren på Googles frågor om testet).
5. Produktion.

### iOS (App Store)

1. EAS Build → `.ipa` (EAS hanterar certifikat/profiler när Linus loggat in en gång).
2. EAS Submit → TestFlight.
3. App Store Connect: metadata, skärmdumpar, integritet, ålder – allt förberett i `store/`.
4. 🔑 Linus trycker "Submit for Review".

---

## 13. Milstolpar

| #   | Milstolpe                                    | Definition of done                                                                                                                 |
| --- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| M1  | **Repo & skelett**                           | Expo-projekt, TypeScript strict, Expo Router med 4 flikar, i18n sv/nb/en, CI grön.                                                 |
| M2  | **Datapipeline**                             | `pois.json.gz` för SE/NO/FI/DK genereras lokalt och i GitHub Action; antal per kategori loggas; < 5 MB.                            |
| M3  | **Karta & filter**                           | F1–F4 klara, development build körbar på Android-emulator.                                                                         |
| M4  | **Lista, detalj, favoriter, sök**            | F5–F8, F11 klara, offline verifierad.                                                                                              |
| M5  | **Datauppdatering & Mer-flik**               | F9–F10 klara, licenser i appen.                                                                                                    |
| M6  | **Polish**                                   | Ikon, splash, mörkt läge, tillgänglighet, prestandamål uppfyllda, alla tester gröna.                                               |
| M7  | **Butiksmaterial**                           | Allt i avsnitt 9–10 klart i `store/`, integritetspolicy publicerad.                                                                |
| M8  | 🔑 **Konton & första byggen**                | Se avsnitt 14. Android-bygge i Internal testing, iOS-bygge i TestFlight.                                                           |
| M9  | **Closed test (Android) / TestFlight (iOS)** | 12+ testare inbjudna; 14-dagarsklockan igång. Under tiden: åtgärda buggar från testare.                                            |
| M10 | 🔑 **Inskick**                               | Play: produktionsansökan → release. iOS: inskickad för granskning. Svar på eventuella avslag hanteras av dig (åtgärda + förklara). |

---

## 14. 🔑 Det Linus måste göra själv (komplett lista)

Claude Code förbereder steg-för-steg-instruktioner för varje punkt när den blir aktuell.

1. **GitHub-repo**: skapa (eller låt Claude Code skapa via `gh` om du är inloggad) och aktivera GitHub Pages.
2. **Expo-konto** (gratis): skapa på expo.dev, skapa en access token, ge den som `EXPO_TOKEN`.
3. **Google Play Console**: skapa utvecklarkonto (engångsavgift 25 USD), identitetsverifiering. Välj _personligt_ konto (12-testarkravet gäller) eller _organisation_ (kräver D-U-N-S-nummer och ett företag, men slipper testkravet).
4. **Google Play service account** för automatisk uppladdning (Claude Code skriver exakt guide).
5. **Apple Developer Program**: medlemskap (årsavgift, ca 99 USD), identitetsverifiering, 2FA-inloggning första gången EAS behöver dina certifikat. Skapa App Store Connect API-nyckel.
6. **Hitta 12 testare för Android** som är anmälda i 14 dagar (kollegor, vänner, husbilsforum – eller en betaltjänst för testare).
7. **Kontakt-e-post** för integritetspolicy och butikslistning.
8. **Klicka "skicka in"** i Play Console och App Store Connect.

Uppskattad tid för Linus totalt: ca 2–4 timmar, utspritt.

---

## 15. Idéer för senare versioner (bygg inte nu)

- Ruttläge: visa platser längs en rutt (kräver routingtjänst, t.ex. OpenRouteService med API-nyckel).
- Användarnoteringar per plats (lokalt) → senare delade.
- Offline-bakgrundskarta för valda regioner.
- "Pro" via köp i appen (t.ex. ruttläge + offline-karta) – först när det finns användare.
- Widget: "närmaste tömning".
