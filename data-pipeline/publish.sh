#!/usr/bin/env bash
# Publishes the GitHub Pages site to the `gh-pages` branch (single squashed commit).
#
# Site = existing gh-pages content (kept, e.g. older data versions)
#      + static pages from site/ in this repo (privacy policy etc., when present)
#      + fresh data from data-pipeline/out/ (when present).
#
# Data layout on Pages:
#   data/manifest.json              – what the app polls (spec F9)
#   data/pois.json.gz               – latest POI file
#   data/archive/pois-<version>.json.gz – last 24 versions (ODbL: the derived database that
#                                     any app build may contain stays publicly available)
#
# Requires GITHUB_TOKEN with contents:write and GITHUB_REPOSITORY (set by Actions).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/data-pipeline/out"
SITE="$(mktemp -d)"
REMOTE="${PAGES_REMOTE:-https://x-access-token:${GITHUB_TOKEN:-}@github.com/${GITHUB_REPOSITORY:-}.git}"

if git ls-remote --exit-code --heads "$REMOTE" gh-pages >/dev/null 2>&1; then
  git -C "$SITE" init -q
  git -C "$SITE" fetch -q --depth 1 "$REMOTE" gh-pages
  git -C "$SITE" checkout -q FETCH_HEAD -- .
  rm -rf "$SITE/.git"
fi

if [ -d "$ROOT/site" ]; then
  cp -R "$ROOT/site/." "$SITE/"
  # The privacy policy needs a real contact address (repo variable CONTACT_EMAIL, passed in
  # by data.yml). Whitespace from copy-paste is dropped; anything not shaped like an address
  # fails the run rather than publishing a broken page.
  CONTACT_EMAIL="$(printf '%s' "${CONTACT_EMAIL:-}" | tr -d '[:space:]')"
  if [ -n "$CONTACT_EMAIL" ]; then
    email_re='^[^@<>"]+@[^@<>"]+\.[^@<>"]+$'
    if ! [[ "$CONTACT_EMAIL" =~ $email_re ]]; then
      echo "::error::CONTACT_EMAIL does not look like an e-mail address"
      exit 1
    fi
    escaped="$(printf '%s' "$CONTACT_EMAIL" | sed -e 's/[|&\\]/\\&/g')"
    find "$SITE" -name '*.html' -exec sed -i "s|{{CONTACT_EMAIL}}|${escaped}|g" {} +
  elif grep -rq '{{CONTACT_EMAIL}}' "$SITE"; then
    echo "::warning::CONTACT_EMAIL is not set – privacy policy not published"
    rm -rf "$SITE/privacy"
  fi
fi

MESSAGE="Update site"
if [ -f "$OUT/manifest.json" ]; then
  VERSION="$(node -e "console.log(require('$OUT/manifest.json').version)")"
  mkdir -p "$SITE/data/archive"
  cp "$OUT/pois.json.gz" "$OUT/manifest.json" "$SITE/data/"
  cp "$OUT/pois.json.gz" "$SITE/data/archive/pois-$VERSION.json.gz"
  # Keep the 24 newest archived versions.
  ls -1 "$SITE/data/archive"/pois-*.json.gz | sort -r | tail -n +25 | xargs -r rm -f
  MESSAGE="Data $VERSION"
fi

touch "$SITE/.nojekyll"

cd "$SITE"
git init -q
git checkout -q -b gh-pages
git add -A
git -c user.name="github-actions[bot]" -c user.email="41898282+github-actions[bot]@users.noreply.github.com" \
  commit -q -m "$MESSAGE"
git push -q -f "$REMOTE" gh-pages
echo "Published: $MESSAGE"
