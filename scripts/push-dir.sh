#!/usr/bin/env bash
# Force-pushes the contents of a directory as a single commit to a branch (CI helper).
#   scripts/push-dir.sh <dir> <branch>
set -euo pipefail
DIR="$1"; BRANCH="$2"
TMP="$(mktemp -d)"
cp -R "$DIR/." "$TMP/"
cd "$TMP"
git init -q && git checkout -q -b "$BRANCH"
git add -A
git -c user.name="github-actions[bot]" -c user.email="41898282+github-actions[bot]@users.noreply.github.com" \
  commit -q -m "$BRANCH from ${GITHUB_SHA::7}"
git push -q -f "https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git" "$BRANCH"
echo "Pushed $DIR to $BRANCH"
