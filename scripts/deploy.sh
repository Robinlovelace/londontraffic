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

# Serialise the whole pipeline: svelte-kit stages builds through the shared
# .svelte-kit/output dir, and the edge bundle snapshots the shared auth-hash
# file, so two concurrent deploys would corrupt each other. Two flock'd
# invocations queue instead of racing; second one typically reuses unchanged
# hashes, so its upload is fast.
exec 9>netlify/.deploy.lock
flock 9
trap 'rm -f netlify/.deploy.lock' EXIT

AUTH_FILE="${AUTH_FILE:-$HOME/.config/londontraffic/auth-$SCOPE}"
[ -s "$AUTH_FILE" ] || { echo "auth file missing or empty: $AUTH_FILE" >&2; exit 1; }
chmod 600 "$AUTH_FILE" 2>/dev/null || true
export PATH="$PATH:$HOME/.bun/bin"

# Credentials are baked into the deploy via the SHA-256 hash only (see below).
# Netlify env vars are avoided on purpose: env:set here applies the variable to
# BOTH sites (team-scoped), which cannot carry per-site credentials. The edge
# function fails closed when the hash is absent.

# Per-scope build dir (also parallel-safe on its own).
BUILD_DIR="build-$SCOPE"
rm -rf "$BUILD_DIR"
BUILD_DIR="$BUILD_DIR" npm run "build:$SCOPE"

CREDENTIALS="$(tr -d '\r\n' < "$AUTH_FILE")"
HASH="$(printf %s "$CREDENTIALS" | sha256sum | cut -d' ' -f1)"
mkdir -p netlify/edge-lib
printf 'export const AUTH_HASH = "%s";\n' "$HASH" > netlify/edge-lib/auth_hash.ts
netlify deploy --site "$SITE_ID" --dir "$BUILD_DIR" --prod --no-build --timeout 1800
