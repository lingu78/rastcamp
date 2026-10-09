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

launch() { # $1 = name
  adb shell am force-stop "$PKG"
  adb logcat -c
  adb shell am start -W -n "$PKG/.MainActivity" | tee "$OUT/$1-start.txt"
  sleep 25
  if ! adb shell pidof "$PKG" >/dev/null; then
    adb logcat -d > "$OUT/$1-logcat.txt"
    echo "::error::App is not running after launch ($1)"; exit 1
  fi
  adb exec-out screencap -p > "$OUT/$1.png"
  adb logcat -d -s ReactNativeJS:V AndroidRuntime:E MapLibre:W > "$OUT/$1-logcat.txt" || true
  if grep -q "FATAL EXCEPTION" "$OUT/$1-logcat.txt"; then
    echo "::error::Crash during $1"; cat "$OUT/$1-logcat.txt"; exit 1
  fi
}

adb install -r "$APK"
adb shell settings put system screen_off_timeout 600000
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
adb emu geo fix 10.7522 59.9139
sleep 2
launch 02-location-oslo

# 3) Dark mode.
adb shell cmd uimode night yes
sleep 2
launch 03-dark-mode
adb shell cmd uimode night no

echo "Cold start (am start -W):"
grep -h "TotalTime" "$OUT"/*-start.txt || true
