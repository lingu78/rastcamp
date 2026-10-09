#!/usr/bin/env bash
# Size breakdown of an APK: total, and estimated size for a single CPU architecture (what a
# phone downloads from Google Play, which splits the .aab per ABI). Writes Markdown to stdout.
set -euo pipefail
APK="$1"
total=$(stat -c %s "$APK")
python3 - "$APK" "$total" <<'PY'
import sys, zipfile, collections
apk, total = sys.argv[1], int(sys.argv[2])
z = zipfile.ZipFile(apk)
by_abi = collections.Counter()
other = 0
for info in z.infolist():
    parts = info.filename.split('/')
    if parts[0] == 'lib' and len(parts) > 2:
        by_abi[parts[1]] += info.compress_size
    else:
        other += info.compress_size
mb = lambda b: f"{b / 1e6:.1f} MB"
print(f"| APK (alla ABI) | {mb(total)} |")
print("|---|---|")
for abi, size in sorted(by_abi.items()):
    print(f"| En arkitektur: `{abi}` (≈ Play-nedladdning) | {mb(other + size)} |")
PY
