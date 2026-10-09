#!/usr/bin/env bash
# Installs the release APK on a running emulator and exercises the main start-up paths
# (location denied → Scandinavia, location granted → user position, dark mode).
# Saves screenshots + logcat to ci-artifacts/android/ and fails on a crash.
set -euo pipefail

APK="${1:-android/app/build/outputs/apk/release/app-release.apk}"
PKG=no.rastcamp.app
OUT=ci-artifacts/android
mkdir -p "$OUT"

perm() { # $1 = grant|revoke
  for p in ACCESS_FINE_LOCATION ACCESS_COARSE_LOCATION; do adb shell pm "$1" "$PKG" "android.permission.$p" || true; done
}

launch() { # $1 = name, $2 = optional deep link (rastcamp://…)
  adb shell am force-stop "$PKG"
  adb logcat -c
  if [ -n "${2:-}" ]; then
    adb shell am start -W -a android.intent.action.VIEW -d "$2" "$PKG" | tee "$OUT/$1-start.txt"
  else
    adb shell am start -W -n "$PKG/.MainActivity" | tee "$OUT/$1-start.txt"
  fi
  # Keep feeding the emulator GPS while the app runs (a single fix before launch is not
  # delivered to a location request that starts later).
  local waited=0
  while [ "$waited" -lt "${WAIT:-25}" ]; do
    if [ -n "${GEO:-}" ]; then adb emu geo fix $GEO >/dev/null 2>&1 || true; fi
    sleep 2; waited=$((waited + 2))
  done
  if ! adb shell pidof "$PKG" >/dev/null; then
    adb logcat -d > "$OUT/$1-logcat.txt"
    echo "::error::App is not running after launch ($1)"; exit 1
  fi
  adb exec-out screencap -p > "$OUT/$1.png"
  adb logcat -d -s ReactNativeJS:V AndroidRuntime:E MapLibre:W > "$OUT/$1-logcat.txt" || true
  grep -h "\[perf\]" "$OUT/$1-logcat.txt" | sed "s/^/$1: /" >> "$OUT/perf.txt" || true
  if grep -q "FATAL EXCEPTION" "$OUT/$1-logcat.txt"; then
    echo "::error::Crash during $1"; cat "$OUT/$1-logcat.txt"; exit 1
  fi
}

adb install -r "$APK"
adb shell settings put system screen_off_timeout 600000
# Real phones animate; the emulator runner switches animations off. Turn them back on and
# test the "remove animations" accessibility setting separately at the end.
animations() { for k in window_animation_scale transition_animation_scale animator_duration_scale; do adb shell settings put global "$k" "$1"; done; }
animations 1
adb shell cmd uimode night no

# 1) Permission denied: request returns "denied" without a dialog because the flag is user-fixed.
perm revoke
for p in ACCESS_FINE_LOCATION ACCESS_COARSE_LOCATION; do
  adb shell pm set-permission-flags "$PKG" "android.permission.$p" user-set user-fixed || true
done
launch 01-location-denied

# 2) Permission granted, device in Oslo.
for p in ACCESS_FINE_LOCATION ACCESS_COARSE_LOCATION; do
  adb shell pm clear-permission-flags "$PKG" "android.permission.$p" user-set user-fixed || true
done
perm grant
export GEO="10.7522 59.9139"
launch 02-location-oslo

# 3) Dark mode.
adb shell cmd uimode night yes
sleep 2
launch 03-dark-mode
adb shell cmd uimode night no

# 4) Online list and detail via deep links (Oslo).
WAIT=12 launch 04-nearby "rastcamp://nearby"
WAIT=12 launch 05-detail "rastcamp://place/w49139387%2Fcaravan_site"

# 5) Offline (airplane mode, spec F7): map falls back, list/detail still work.
adb shell cmd connectivity airplane-mode enable
sleep 5
launch 06-offline-map
WAIT=12 launch 07-offline-nearby "rastcamp://nearby"
WAIT=12 launch 08-offline-detail "rastcamp://place/w35072156%2Fcaravan_site"
adb shell cmd connectivity airplane-mode disable

# 6) Detail sheet with animations switched off (Android accessibility setting).
animations 0
WAIT=12 launch 09-detail-no-animations "rastcamp://place/w49139387%2Fcaravan_site"
animations 1

echo "Cold start (am start -W):"
grep -h "TotalTime" "$OUT"/*-start.txt || true
echo "JS markers:"
cat "$OUT/perf.txt" 2>/dev/null || true
