# londontraffic

Modelled traffic estimates (average annual daily traffic, AADT) for **cars and
heavy vehicles only**, on every motor road link, served as a web map. Two
deployments of this one app:

| Site | Scope | URL |
|---|---|---|
| London (the app) | `gor_london` only | [londontrafficdemo.netlify.app](https://londontrafficdemo.netlify.app) |
| National (all outputs) | all 9 Government Office Regions | [nationaltrafficdemo.netlify.app](https://nationaltrafficdemo.netlify.app) |

The estimates come from the CSIS pipeline (netweld + osmactive + calibrated
routing assignment) in [Robinlovelace/csis](https://github.com/Robinlovelace/csis),
9-GOR England-wide build `a5b18dd` (netassign `79b9993`). This app is a
slimmed-down subset of the [csis-dashboard](https://github.com/Robinlovelace/csis-dashboard)
codebase (itself a counterflow fork): the same SvelteKit + MapLibre + PMTiles
stack and data contract (v0.3), with everything except the traffic-prediction
links layer removed - no casualties, critical issues, junctions, counters,
or basic-auth edge function.

## Data

The tile store (2 GB, all 9 regions) lives **outside the repo** at
`/home/robin/github-data/londontraffic-data` (override with
`LONDONTRAFFIC_DATA`). It was built on the `tr` machine by the script recorded
in `scripts/build_tiles.sh` from
`csis/out/pipeline/gor_*/publish/gor_*/links.parquet`. Each region holds:

- `manifest.json` - contract 0.3 manifest, links layer only
- `tiles/links.pmtiles` - vector tiles (zooms 8-16) carrying only
  `road_name`, `road_class`, `road_ref`, `length_m`, `aadt_car`,
  `aadt_2way_car`, `aadt_hgv`, `aadt_2way_hgv`, `aadt_heavy`,
  `aadt_2way_heavy`

Tile sources and licences: OpenStreetMap (ODbL-1.0), OS Open Roads
(OGL-UK-3.0), DfT/council counts for calibration. No STATS19 data in this
subset.

## Develop

```bash
npm install
npm run sync:data london   # hardlink the London tiles into static/data
npm run dev
npm run check              # svelte-check
```

## Build and deploy

One command per site: `scripts/deploy.sh london|national` syncs the data
scope, bakes the SHA-256 of the basic-auth credentials into
`netlify/edge-lib/auth_hash.ts` (gitignored), builds, and deploys. Both sites
are behind basic auth (password only, blank username); credentials live in
`~/.config/londontraffic/auth-<scope>` (one line, `user:pass`, chmod 600).
Netlify env vars are not used: on this account `env:set` applies variables to
all sites, so per-site credentials cannot live there.

`static/data/` (gitignored) is populated per scope by `scripts/sync_data.py`,
which hardlinks region directories out of the tile store and prunes
`index.json` to the scope's regions:

```bash
npm run build:london    # London-only build -> build/
npm run build:national  # all-9-region build -> build/
```

Deploy the matching site (site ids in Netlify; both created with the netlify
CLI, no auth):

```bash
# London site (e9aae024-5803-4555-99e7-cb86f010160f), ~110 MB upload
netlify deploy --site e9aae024-5803-4555-99e7-cb86f010160f --dir build --prod --no-build

# National site (991ba7c8-8179-45b8-8d82-4a4a054bf60a), ~2 GB upload
netlify deploy --site 991ba7c8-8179-45b8-8d82-4a4a054bf60a --dir build --prod --no-build
```

`.pmtiles` files need HTTP range-request serving, which Netlify does by
default; `netlify.toml` adds a 1-hour cache header for them.
