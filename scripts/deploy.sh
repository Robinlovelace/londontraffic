#!/usr/bin/env bash
# Build and deploy one of the two sites: scripts/deploy.sh london|national
#
# Password protection: credentials come from ~/.config/londontraffic/auth-<scope>
# (one line, password-only with a leading colon, e.g. ":secret", chmod 600).
# Only a SHA-256 hash is baked into netlify/edge-lib/auth_hash.ts (gitignored,
# removed again on exit). There is deliberately no Netlify env-var fallback:
# env vars on this account are team-scoped, so one site's credential would
# unlock the other.
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
#
# NOTE: the lockfile itself must NOT be unlinked on exit - that breaks the
# serialisation (a queued waiter holds the old inode while a third run would
# create and lock a fresh one). The file is gitignored and persists.
exec 9>netlify/.deploy.lock
flock 9
trap 'rm -f netlify/edge-lib/auth_hash.ts' EXIT

export PATH="$PATH:$HOME/.bun/bin"

AUTH_FILE="${AUTH_FILE:-$HOME/.config/londontraffic/auth-$SCOPE}"
[ -s "$AUTH_FILE" ] || { echo "auth file missing or empty: $AUTH_FILE" >&2; exit 1; }
chmod 600 "$AUTH_FILE" 2>/dev/null || true

# Validate credentials BEFORE the (minutes-long) build so a bad auth file
# fails fast instead of locking the site out after a full deploy.
CREDENTIALS="$(tr -d '\r\n' < "$AUTH_FILE")"
[[ "$CREDENTIALS" == *:* ]] || { echo "auth file must contain a ':' (password-only convention: ':secret'), got: $AUTH_FILE" >&2; exit 1; }

# Credentials are baked into the deploy via the SHA-256 hash only (see header).

# Per-scope build dir (also parallel-safe on its own).
BUILD_DIR="build-$SCOPE"
rm -rf "$BUILD_DIR"
BUILD_DIR="$BUILD_DIR" npm run "build:$SCOPE"

HASH="$(printf %s "$CREDENTIALS" | sha256sum | cut -d' ' -f1)"
mkdir -p netlify/edge-lib
printf 'export const AUTH_HASH = "%s";\n' "$HASH" > netlify/edge-lib/auth_hash.ts
netlify deploy --site "$SITE_ID" --dir "$BUILD_DIR" --prod --no-build --timeout 1800
