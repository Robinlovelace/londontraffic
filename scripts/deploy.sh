#!/usr/bin/env bash
# Build and deploy one of the two sites: scripts/deploy.sh london|national
#
# Password protection: credentials come from ~/.config/londontraffic/auth-<scope>
# (one line, user:pass, chmod 600). Only a SHA-256 hash is baked into
# netlify/edge-lib/auth_hash.ts (gitignored). The script also sets the
# BASIC_AUTH_CREDENTIALS env var on the Netlify site, which the edge function
# prefers; the baked hash is the fallback. Nothing is printed.
set -euo pipefail
cd "$(dirname "$0")/.."

SCOPE="${1:-london}"
SITE_ID_london="e9aae024-5803-4555-99e7-cb86f010160f"
SITE_ID_national="991ba7c8-8179-45b8-8d82-4a4a054bf60a"

case "$SCOPE" in
  london) SITE_ID="$SITE_ID_london" ;;
  national) SITE_ID="$SITE_ID_national" ;;
  *) echo "usage: $0 london|national" >&2; exit 1 ;;
esac

AUTH_FILE="${AUTH_FILE:-$HOME/.config/londontraffic/auth-$SCOPE}"
[ -s "$AUTH_FILE" ] || { echo "auth file missing or empty: $AUTH_FILE" >&2; exit 1; }
chmod 600 "$AUTH_FILE" 2>/dev/null || true

CREDENTIALS="$(tr -d '\r\n' < "$AUTH_FILE")"
HASH="$(printf %s "$CREDENTIALS" | sha256sum | cut -d' ' -f1)"
mkdir -p netlify/edge-lib
printf 'export const AUTH_HASH = "%s";\n' "$HASH" > netlify/edge-lib/auth_hash.ts

export PATH="$PATH:$HOME/.bun/bin"

# Env var is the primary credential source; if the API accepts it, the baked
# hash is only a fallback. Hash is set on the site either way.
netlify env:set BASIC_AUTH_CREDENTIALS "$CREDENTIALS" --site "$SITE_ID" >/dev/null 2>&1 \
  || echo "note: env var not set on this site; baked hash will be used" >&2

npm run "build:$SCOPE"

netlify deploy --site "$SITE_ID" --dir build --prod --no-build --timeout 1800
