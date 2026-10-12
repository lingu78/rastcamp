# Skärmdumpar

Butiksbilderna tas automatiskt i en riktig Android-emulator och iOS-simulator med
[Maestro](https://maestro.dev), på svenska, norska och engelska, och får sedan en bildtext.

| Plattform | Storlek          | Enhet i CI                                             |
| --------- | ---------------- | ------------------------------------------------------ |
| Android   | 1080×1920 (9:16) | Emulator API 35, `pixel_2`, Mesa-GPU (`-gpu lavapipe`) |
| iOS       | 1320×2868 (6,9") | Simulator, största iPhone (iOS 26)                     |

Bilder (6 per språk): `01-map-filter`, `02-nearby`, `03-detail`, `04-favorites`, `05-offline`, `06-search`.

## Generera om

1. GitHub → _Actions → Store screenshots → Run workflow_ (eller pusha en ändring i
   `store/screenshots/flows/`). Android-jobbet körs alltid, iOS-jobbet vid manuell körning
   eller en commit med `[ios]` i meddelandet (macOS-minuter är dyra i privata repon).
2. Resultatet hamnar på grenarna `store-screenshots-android` / `store-screenshots-ios`
   (`raw/` = skärmdumpar, `final/` = med bildtext, `debug/` = Maestros felsökning vid fel).
3. Hämta och lägg in:
   ```bash
   git fetch origin store-screenshots-android store-screenshots-ios
   git archive origin/store-screenshots-android final | tar -x -C store/screenshots
   git archive origin/store-screenshots-ios final | tar -x -C store/screenshots
   ```

Ändra bildtexter: `CAPTIONS` i `scripts/frame-screenshots.ts`. Rama om lokalt efter att ha
hämtat `raw/` på samma sätt: `node scripts/frame-screenshots.ts android ios`.

## Delar

- `flows/screenshots.yaml` – Maestro-flödet: byter språk via Mer-fliken, sparar två
  favoriter, filtrerar kartan, slår på flygplansläge (Android) för offline-bilden.
- `scripts/screenshots.sh` – kör flödet per språk med rätt UI-texter.
- `scripts/frame-screenshots.ts` – grön ram + bildtext, 24-bitars PNG utan alfakanal (Play-krav).
- `.github/workflows/screenshots.yml` – bygger release-appen och kör allt ovan.

Emulatorn måste köra Mesa (`lavapipe`): med SwiftShader ritar MapLibre varken text eller
ikoner på kartan (se DECISIONS.md §13).
