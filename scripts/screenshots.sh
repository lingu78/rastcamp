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
  local permission=allow
  [ "$PLATFORM" = ios ] && permission=inuse
  local args=(-e "TAB_MORE_DEVICE=More" -e "LOCATION_PERMISSION=$permission")
  for kv in "$@"; do args+=(-e "$kv"); done
  # Up to three attempts: on the iOS simulator the app sometimes dies (SIGBUS/SIGSEGV)
  # after Maestro's clearState reinstall – never seen on a phone (PROGRESS, DECISIONS §17).
  local status attempt run
  for attempt in 1 2 3; do
    rm -rf "$out" && mkdir -p "$out"
    run="$(mktemp -d)"
    status=0
    # Maestro only writes screenshots inside the run's output folder (…/takeScreenshot/).
    maestro test --test-output-dir "$run" "${args[@]}" "$FLOW" || status=$?
    find "$run" -name '*.png' -path '*takeScreenshot*' -exec cp {} "$out/" \;
    [ "$status" -eq 0 ] && break
    echo "::warning::$PLATFORM/$lang: attempt $attempt failed (exit $status)"
    # Keep Maestro's failure screenshots/hierarchy for debugging (pushed with the results),
    # without files over 20 MB (simulator logs can exceed GitHub's 100 MB file limit).
    local dbg="$ROOT/store/screenshots/debug/$PLATFORM/$lang/attempt-$attempt"
    mkdir -p "$dbg" && rsync -a --max-size=20m "$run/" "$dbg/" 2>/dev/null || true
  done
  [ "$status" -eq 0 ] || exit "$status"
  ls -1 "$out"
}

run sv LANGUAGE=Svenska TAB_MAP=Karta TAB_NEARBY=Närmast TAB_FAVORITES=Favoriter \
  "SEARCH=Sök på namn" "SAVE_FAVORITE=Spara favorit" CLOSE=Stäng "CLEAR_SEARCH=Rensa sökningen" \
  CHIP_CARAVAN=Ställplats CHIP_DUMP=Tömning CHIP_ALL=Alla \
  "LOCATE=Centrera på min position" "SEARCH_PLACE=Sök ort eller plats" SEARCH_QUERY=Åre \
  "PLACES_HEADER=Orter och områden" CANCEL=Avbryt

run nb "LANGUAGE=Norsk (bokmål)" TAB_MAP=Kart TAB_NEARBY=Nærmest TAB_FAVORITES=Favoritter \
  "SEARCH=Søk på navn" "SAVE_FAVORITE=Lagre favoritt" CLOSE=Lukk "CLEAR_SEARCH=Tøm søket" \
  CHIP_CARAVAN=Bobilplass CHIP_DUMP=Tømming CHIP_ALL=Alle \
  "LOCATE=Sentrer på min posisjon" "SEARCH_PLACE=Søk etter sted" SEARCH_QUERY=Geiranger \
  "PLACES_HEADER=Steder og områder" CANCEL=Avbryt

run en LANGUAGE=English TAB_MAP=Map TAB_NEARBY=Nearby TAB_FAVORITES=Favourites \
  "SEARCH=Search by name" "SAVE_FAVORITE=Save favourite" CLOSE=Close "CLEAR_SEARCH=Clear search" \
  "CHIP_CARAVAN=Motorhome stop" "CHIP_DUMP=Dump station" CHIP_ALL=All \
  "LOCATE=Centre on my location" "SEARCH_PLACE=Search town or place" SEARCH_QUERY=Åre \
  "PLACES_HEADER=Towns and areas" CANCEL=Cancel
