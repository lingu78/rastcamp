#!/usr/bin/env bash
# Takes the store screenshots on a running Android emulator or iOS simulator with Maestro,
# for sv, nb and en. Raw screenshots → store/screenshots/raw/<platform>/<lang>/NN-name.png.
# Then run: node scripts/frame-screenshots.ts  (adds captions, store sizes)
#
#   scripts/screenshots.sh android|ios
set -euo pipefail
PLATFORM="${1:?android|ios}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FLOW="$ROOT/store/screenshots/flows/screenshots.yaml"

run() { # $1 = lang code, rest = KEY=VALUE labels
  local lang="$1"; shift
  local out="$ROOT/store/screenshots/raw/$PLATFORM/$lang"
  local run; run="$(mktemp -d)"
  rm -rf "$out" && mkdir -p "$out"
  local args=(-e "TAB_MORE_DEVICE=More")
  for kv in "$@"; do args+=(-e "$kv"); done
  # Maestro only writes screenshots inside the run's output folder (…/takeScreenshot/).
  maestro test --test-output-dir "$run" "${args[@]}" "$FLOW"
  find "$run" -name '*.png' -path '*takeScreenshot*' -exec cp {} "$out/" \;
  ls -1 "$out"
}

run sv LANGUAGE=Svenska TAB_MAP=Karta TAB_NEARBY=Närmast TAB_FAVORITES=Favoriter \
  "SEARCH=Sök på namn" "SAVE_FAVORITE=Spara favorit" CLOSE=Stäng "CLEAR_SEARCH=Rensa sökningen" \
  CHIP_CARAVAN=Ställplats CHIP_DUMP=Tömning CHIP_WATER=Vatten CHIP_ALL=Alla \
  "LOCATE=Centrera på min position"

run nb "LANGUAGE=Norsk (bokmål)" TAB_MAP=Kart TAB_NEARBY=Nærmest TAB_FAVORITES=Favoritter \
  "SEARCH=Søk på navn" "SAVE_FAVORITE=Lagre favoritt" CLOSE=Lukk "CLEAR_SEARCH=Tøm søket" \
  CHIP_CARAVAN=Bobilplass CHIP_DUMP=Tømming CHIP_WATER=Vann CHIP_ALL=Alle \
  "LOCATE=Sentrer på min posisjon"

run en LANGUAGE=English TAB_MAP=Map TAB_NEARBY=Nearby TAB_FAVORITES=Favourites \
  "SEARCH=Search by name" "SAVE_FAVORITE=Save favourite" CLOSE=Close "CLEAR_SEARCH=Clear search" \
  "CHIP_CARAVAN=Motorhome stop" "CHIP_DUMP=Dump station" CHIP_WATER=Water CHIP_ALL=All \
  "LOCATE=Centre on my location"
