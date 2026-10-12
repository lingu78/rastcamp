#!/usr/bin/env bash
# Starts the app N times on the booted simulator ($UDID) with lldb attached, runs the
# search flow each time and keeps lldb's backtraces if the app crashes.
set -uo pipefail
OUT="${1:?output dir}"
RUNS="${RUNS:-5}"
DIR="$(cd "$(dirname "$0")" && pwd)"
APP=no.rastcamp.app
mkdir -p "$OUT"

stats() {
  { echo "== $1 $(date -u +%T)"; df -h / | tail -1; sysctl vm.swapusage; memory_pressure -Q 2>/dev/null | tail -1; } >> "$OUT/host.txt"
}

xcrun simctl privacy "$UDID" grant location "$APP" || true
xcrun simctl location "$UDID" set 59.9139,10.7522 || true
stats start
summary="$OUT/summary.txt"
: > "$summary"
for i in $(seq 1 "$RUNS"); do
  xcrun simctl terminate "$UDID" "$APP" 2>/dev/null || true
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
  maestro test --test-output-dir "$OUT/maestro-$i" "$DIR/search.yaml" > "$OUT/maestro-$i.txt" 2>&1 || status=$?
  sleep 2
  if grep -q "stop reason" "$OUT/lldb-$i.txt"; then crashed=yes; else crashed=no; fi
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
