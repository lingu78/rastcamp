#!/usr/bin/env bash
# Starts the app N times on the booted simulator ($UDID) with lldb attached, runs a flow
# each time and keeps lldb's backtraces if the app crashes. MODE=search runs only the
# location search; MODE=full runs the whole store screenshot flow (Swedish) on a fresh
# install, which is where the app died with SIGBUS. MODE=maestro runs the unchanged
# screenshot flow (Maestro reinstalls and starts the app itself, as in the screenshot job)
# and attaches lldb to every new app process.
set -uo pipefail
OUT="${1:?output dir}"
RUNS="${RUNS:-5}"
MODE="${MODE:-maestro}"
DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$DIR/../.." && pwd)"
APP=no.rastcamp.app
APP_PATH="$ROOT/build/Build/Products/Release-iphonesimulator/Rastcamp.app"
mkdir -p "$OUT"

# The screenshot flow without its launchApp step (the app is started here, under lldb).
awk '/^- launchApp:/ {skip=1; next} skip && /^- / {skip=0} !skip' \
  "$ROOT/store/screenshots/flows/screenshots.yaml" > "$OUT/full.yaml"
SV=(-e "TAB_MORE_DEVICE=More" -e LANGUAGE=Svenska -e TAB_MAP=Karta -e TAB_NEARBY=Närmast
  -e TAB_FAVORITES=Favoriter -e "SEARCH=Sök på namn" -e "SAVE_FAVORITE=Spara favorit"
  -e CLOSE=Stäng -e "CLEAR_SEARCH=Rensa sökningen" -e CHIP_CARAVAN=Ställplats
  -e CHIP_DUMP=Tömning -e CHIP_ALL=Alla -e "LOCATE=Centrera på min position"
  -e "SEARCH_PLACE=Sök ort eller plats" -e SEARCH_QUERY=Åre
  -e "PLACES_HEADER=Orter och områden" -e CANCEL=Avbryt)

stats() {
  { echo "== $1 $(date -u +%T)"; df -h / | tail -1; sysctl vm.swapusage; memory_pressure -Q 2>/dev/null | tail -1; } >> "$OUT/host.txt"
}

xcrun simctl privacy "$UDID" grant location "$APP" || true
xcrun simctl location "$UDID" set 59.9139,10.7522 || true
stats start
summary="$OUT/summary.txt"
: > "$summary"
# Attaches lldb to each new app process until $OUT/done-$1 exists.
follow() {
  local i="$1" n=0 last="" pid t=0
  while [ ! -f "$OUT/done-$i" ]; do
    t=$((t + 1))
    [ "$t" = 100 ] && ps -axo pid,command | grep -i '[R]astcamp' >> "$OUT/processes-$i.txt"
    pid=$(pgrep -f 'Rastcamp\.app/Rastcamp( |$)' | tail -1 || true)
    if [ -n "$pid" ] && [ "$pid" != "$last" ]; then
      last="$pid"; n=$((n + 1))
      ps -o pid,command -p "$pid" >> "$OUT/processes-$i.txt" 2>&1
      lldb --batch --attach-pid "$pid" \
        -o "process handle SIGPIPE SIGUSR1 SIGUSR2 SIGTERM -s false -n false -p true" \
        -o continue \
        -k "thread info" -k "bt all" -k "register read" -k "memory region \$pc" \
        > "$OUT/lldb-$i-$n.txt" 2>&1 &
    fi
    sleep 0.3
  done
}

if [ "$MODE" = maestro ]; then
  for i in $(seq 1 "$RUNS"); do
    follow "$i" &
    follower=$!
    status=0
    maestro test --test-output-dir "$OUT/maestro-$i" -e LOCATION_PERMISSION=inuse "${SV[@]}" \
      "$ROOT/store/screenshots/flows/screenshots.yaml" > "$OUT/maestro-$i.txt" 2>&1 || status=$?
    sleep 3
    if cat "$OUT"/lldb-"$i"-*.txt 2>/dev/null | grep -q -E "stop reason = (EXC_|signal SIG(BUS|SEGV|ABRT|ILL|TRAP))"; then crashed=yes; else crashed=no; fi
    echo "run $i: maestro=$status crash=$crashed" | tee -a "$summary"
    touch "$OUT/done-$i"
    xcrun simctl terminate "$UDID" "$APP" 2>/dev/null || true
    wait "$follower" 2>/dev/null || true
    pkill -f 'lldb --batch' 2>/dev/null || true
    stats "after run $i"
  done
fi

[ "$MODE" = maestro ] || for i in $(seq 1 "$RUNS"); do
  xcrun simctl terminate "$UDID" "$APP" 2>/dev/null || true
  if [ "$MODE" = full ]; then # fresh install, like Maestro's clearState
    xcrun simctl uninstall "$UDID" "$APP" || true
    xcrun simctl install "$UDID" "$APP_PATH"
    xcrun simctl privacy "$UDID" grant location "$APP" || true
  fi
  pid=$(xcrun simctl launch "$UDID" "$APP" | awk '{print $NF}')
  echo "run $i: pid $pid"
  lldb --batch --attach-pid "$pid" \
    -o "process handle SIGPIPE SIGUSR1 SIGUSR2 SIGTERM -s false -n false -p true" \
    -o continue \
    -k "thread info" -k "bt all" -k "register read" -k "memory region \$pc" \
    > "$OUT/lldb-$i.txt" 2>&1 &
  lldb_pid=$!
  sleep 8
  status=0
  if [ "$MODE" = full ]; then
    maestro test --test-output-dir "$OUT/maestro-$i" "${SV[@]}" "$OUT/full.yaml" > "$OUT/maestro-$i.txt" 2>&1 || status=$?
  else
    maestro test --test-output-dir "$OUT/maestro-$i" "$DIR/search.yaml" > "$OUT/maestro-$i.txt" 2>&1 || status=$?
  fi
  sleep 2
  # (attaching stops the app with SIGSTOP and terminating it gives SIGKILL – not crashes)
  if grep -q -E "stop reason = (EXC_|signal SIG(BUS|SEGV|ABRT|ILL|TRAP))" "$OUT/lldb-$i.txt"; then crashed=yes; else crashed=no; fi
  echo "run $i: maestro=$status crash=$crashed" | tee -a "$summary"
  xcrun simctl terminate "$UDID" "$APP" 2>/dev/null || true
  sleep 2
  kill "$lldb_pid" 2>/dev/null || true
  wait "$lldb_pid" 2>/dev/null || true
  stats "after run $i"
done
# Crash reports, wherever the runner's ReportCrash puts them.
mkdir -p "$OUT/ips"
sudo find /Users /Library /private/var -name '*.ips' -mmin -120 2>/dev/null \
  | grep -i -E 'rastcamp' | while read -r f; do sudo cp "$f" "$OUT/ips/" ; done
sudo chown -R "$(id -u)" "$OUT/ips" 2>/dev/null || true
find "$OUT" -size +20M -delete
cat "$summary"
