# Testplan – Rastcamp (manuell)

Checklista för Linus och testare att gå igenom på sin egen telefon innan en release och under
det slutna testet (Android) / TestFlight (iOS). Tar ca 20 minuter. Bocka av, och skriv ner
telefonmodell, OS-version och appversion (Mer → Appversion) om något inte stämmer.

| Enhet | OS-version | Appversion | Datum | Testare |
| ----- | ---------- | ---------- | ----- | ------- |
|       |            |            |       |         |

## 1. Första start

- [ ] Appen startar på under ca 3 sekunder och visar kartan.
- [ ] Frågan om platsbehörighet visas, med text på telefonens språk som förklarar att positionen bara används i telefonen.
- [ ] **Tillåt** → kartan flyttar sig till din position och den blå positionsmarkören syns.
- [ ] Attribution "© OpenMapTiles · © OpenStreetMap contributors" syns nere till vänster. Båda länkarna går att trycka på.

## 2. Karta och filter (F1–F4)

- [ ] Zooma och panorera – det går mjukt, även när många platser syns (kluster med siffror).
- [ ] Tryck på ett kluster → kartan zoomar in.
- [ ] Tryck **Tömning** → bara orange tömningsmarkörer syns. Tryck **Vatten** också → båda syns.
- [ ] Tryck **Alla** → alla kategorier syns igen.
- [ ] Välj ett filter, stäng appen helt (svep bort den) och starta igen → filtret är kvar.
- [ ] Panorera bort och tryck på knappen "centrera på mig" (nere till höger) → kartan flyttar tillbaka.
- [ ] Tryck på en markör → detaljvyn öppnas som ett blad nerifrån.

## 3. Närmast och sök (F5, F11)

- [ ] Fliken **Närmast** visar platser sorterade efter avstånd, med namn, kategori, avstånd (t.ex. "3,2 km", en decimal under 10 km) och väderstreck.
- [ ] Filterchipsen fungerar likadant här som på kartan.
- [ ] Sök "camping" → träffar visas direkt (utan fördröjning). Sök utan å/ä/ö (t.ex. "ostersund") → hittar "Östersund".
- [ ] Rensa sökningen med krysset.

## 4. Detaljvy (F6)

- [ ] Namnet visas (eller kategorinamnet om platsen saknar namn), kategori, avstånd och koordinater.
- [ ] Bara fält som har data visas (avgift, öppettider, telefon, webbplats, el, dusch, toalett, vatten, tömning gråvatten/kassett, max antal, hundar, beskrivning).
- [ ] **Navigera dit** öppnar Apple Kartor (iPhone) / Google Maps eller vald kartapp (Android) med vägbeskrivning dit.
- [ ] Telefonnummer går att ringa, webbplats öppnas i webbläsaren.
- [ ] **Dela** öppnar delningsmenyn med namn, koordinater och kartlänk.
- [ ] **Rapportera fel** öppnar openstreetmap.org i webbläsaren med en ny anteckning på platsen.
- [ ] Bladet går att dra upp till helskärm och stänga (dra ned eller tryck ×).

## 5. Favoriter (F8)

- [ ] **Spara favorit** i en detaljvy → stjärnan fylls och platsen syns under fliken **Favoriter**.
- [ ] Starta om appen → favoriten finns kvar.
- [ ] **Ta bort favorit** → den försvinner från listan.

## 6. Utan täckning – flygplansläge (F7)

Slå på flygplansläge (och stäng av Wi-Fi), stäng appen helt och starta den igen.

- [ ] Appen startar utan krasch.
- [ ] Kartan visar antingen tidigare sedda områden eller en tom bakgrund med platsmarkörer och en ruta "Bakgrundskartan kunde inte laddas …" med knappen **Visa lista**.
- [ ] **Närmast**-listan, filter, sök, detaljvy och favoriter fungerar som vanligt.
- [ ] **Mer → Sök efter ny data** ger ett lugnt meddelande om att det inte gick (ingen krasch).
- [ ] Stäng av flygplansläget, tryck **Försök igen** på kartan → bakgrundskartan laddas.

## 7. Nekad platsbehörighet (F4)

Gå till telefonens Inställningar → Rastcamp → Plats → **Aldrig** (iOS) / **Tillåt inte** (Android). Starta appen.

- [ ] Kartan startar över Skandinavien.
- [ ] **Närmast** visar "Avstånd från kartans mittpunkt" och sorterar efter kartans mitt – panorera kartan till t.ex. Bergen och se att listan ändras.
- [ ] Knappen "centrera på mig" visar en förklaring och erbjuder att tillåta plats (eller öppnar inställningarna).

## 8. Mer, språk och utseende (F10)

- [ ] **Mer → Språk**: byt mellan Svenska, Norsk (bokmål) och English → all text byter språk direkt. **Automatiskt** följer telefonens språk.
- [ ] Platsdata visar version (datum) och om den är inbyggd eller nedladdad.
- [ ] **Datakällor och licenser** visar OpenStreetMap/ODbL, OpenMapTiles, OpenFreeMap och programvarulicenser; licenstexter går att fälla ut.
- [ ] **Integritetspolicy** öppnas i webbläsaren.
- [ ] Byt telefonen till mörkt läge → appen (inkl. kartan) blir mörk och allt är läsbart.
- [ ] Öka telefonens textstorlek till max → texter blir större och inget viktigt klipps bort.
- [ ] (Valfritt) Slå på VoiceOver/TalkBack → alla knappar läses upp med begriplig etikett.

## 9. Datauppdatering (F9)

- [ ] Med nät: **Mer → Sök efter ny data** svarar "Du har den senaste datan" eller "Uppdaterad till …".
- [ ] Efter en uppdatering: starta om appen → Mer visar "Nedladdad uppdatering" och samma version.

## Rapportera fel

Skicka till Linus: vad du gjorde, vad som hände, vad du väntade dig, och gärna en skärmdump.
Testare på Android rapporterar även via Play Butikens "Skicka feedback" på appsidan.
