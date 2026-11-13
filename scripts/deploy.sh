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

# Credentials are baked into the deploy via the SHA-256 hash only. Netlify env
# vars are avoided on purpose: env:set here applies the variable to BOTH sites
# (team-scoped), which cannot carry per-site credentials. The edge function
# fails closed when the hash is absent.

npm run "build:$SCOPE"

netlify deploy --site "$SITE_ID" --dir build --prod --no-build --timeout 1800
