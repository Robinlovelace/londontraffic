# Fork notes

This dashboard is a fork of the counterflow dashboard. This file records where it differs, so that a diff against upstream stays readable.

## Upstream

- Remote `upstream`: https://github.com/Robinlovelace/counterflow.git
- The dashboard lives under `dashboard/` upstream, so a plain merge does not work.
- Last merged upstream commit: `3c29351` (criticalissues/counterflow, last dashboard commit 28 Sep 2026).

Diff against the last merged upstream state:

```sh
git fetch upstream
git diff --stat 3c29351:dashboard 'HEAD^{tree}' -- src scripts
```

To see what upstream changed since then:

```sh
git diff 3c29351:dashboard upstream/main:dashboard -- src
```

Update the commit above after each merge.

## Deliberate divergences

| Area | Change | Where |
|---|---|---|
| Data contract | Reads csis publish outputs (`manifest.json`, PMTiles) and maps contract fields back to legacy names | `src/lib/contract.ts`, `scripts/deploy.sh` |
| Extra layers | Crossings, region summary, junction arms, daily counts, population built outside the contract. Temporary until csis publishes them | `scripts/build_extra_layers.py`, `scripts/build_drilldown.py` |
| Auth | Basic Auth edge function from criticalissues, with two changes. It fails closed (401 for everyone) when no credentials exist. It also accepts a SHA-256 hash of `user:pass` baked in at deploy time, because the Netlify API refused env vars for this site. Order: `BASIC_AUTH_CREDENTIALS` if set, else the baked hash, else deny. `scripts/deploy.sh` reads `~/.config/csis-dashboard/auth` (one line `user:pass`, chmod 600), writes only the hash to the gitignored `netlify/edge-lib/auth_hash.ts` and aborts if the file is missing | `netlify/edge-functions/basic-auth.ts`, `scripts/deploy.sh`, `.gitignore` |
| Flow range per day | Removed. Added in this fork by 6bac179, taken out in refactor-1 | `RegionDashboard.svelte`, `SensorMap.svelte`, `layers/TrafficLayers.svelte` |
| Mode control | Label renamed from "Mode/Attribute" to "Mode" | `ModeSelector.svelte` |
| Colour by | "Data source" moved out of the Mode list into a counters-only "Colour by" control. `?mode=source` is read as `colour=source`. The map layers still get `mode="source"` through the derived `mapMode` | `RegionDashboard.svelte` |
| Labels | Variant names changed (for example "Casualties (points)") | `SourceSelector.svelte`, `MapLegend.svelte` |
| Checks | Playwright suites and a deploy gate | `scripts/checks/`, `scripts/deploy.sh`, `.github/workflows/ci.yml` |

## Deletions (refactor-1)

- `scripts/download-release-data.sh`, `scripts/build_static_data.py`, `scripts/prebuild-data.sh` and the `prebuild`, `data:*` and `build:with-data` npm scripts. They served counterflow release data.
- `src/lib/components/layout/DashboardHeader.svelte` (imported nowhere).
- `UNSUPPORTED_VARIANTS` (an empty set).
- `@sveltejs/adapter-auto` (unused).

## Not yet removed

- `static/regions/` and `population.json` handling. They need `population` moved into csis first.
- `api.ts` stubs, vintage blocks in `PopupContent.svelte`, `Dockerfile`, `allowedHosts`, the da_log layer code. Medium confidence, to be checked.
