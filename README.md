# londontraffic

National modelled traffic estimates for England served as a web map:
**average annual daily traffic (AADT) for cars and heavy vehicles only**, on
every motor road link, split by Government Office Region. Live at
[londontrafficdemo.netlify.app](https://londontrafficdemo.netlify.app).

The estimates come from the CSIS pipeline (netweld + osmactive + calibrated
routing assignment) in [Robinlovelace/csis](https://github.com/Robinlovelace/csis),
build `a5b18dd` (9-GOR England-wide, netassign `79b9993`). This app is a
slimmed-down subset of the [csis-dashboard](https://github.com/Robinlovelace/csis-dashboard)
codebase (itself a counterflow fork): the same SvelteKit + MapLibre + PMTiles
stack and data contract (v0.3), with everything except the traffic-prediction
links layer removed - no casualties, critical issues, junctions, counters,
or basic-auth edge function.

## Data

`static/data/` (gitignored) holds one region directory per GOR, built by the
script recorded in `scripts/build_tiles.sh` on the `tr` machine from
`csis/out/pipeline/gor_*/publish/gor_*/links.parquet`:

- `data/index.json` - the 9 GOR regions with bbox
- `data/<region>/manifest.json` - contract 0.3 manifest, links layer only
- `data/<region>/tiles/links.pmtiles` - vector tiles (zooms 8-16) carrying
  only `road_name`, `road_class`, `road_ref`, `length_m`, `aadt_car`,
  `aadt_2way_car`, `aadt_hgv`, `aadt_2way_hgv`, `aadt_heavy`,
  `aadt_2way_heavy`

Tile sources and licences: OpenStreetMap (ODbL-1.0), OS Open Roads
(OGL-UK-3.0), DfT/council counts for calibration. No STATS19 data in this
subset.

## Develop

```bash
npm install
npm run dev            # expects static/data to exist (see Data above)
npm run check          # svelte-check
npm run build          # checks + vite build -> build/
```

## Deploy

Site: `londontrafficdemo` on Netlify (created with the netlify CLI; no auth).

```bash
npm run build
netlify deploy --site londontrafficdemo --dir build           # draft
netlify deploy --site londontrafficdemo --dir build --prod    # production
```

The `.pmtiles` files need HTTP range-request serving, which Netlify does by
default; `netlify.toml` adds a 1-hour cache header for them.
