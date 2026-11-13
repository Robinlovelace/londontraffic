#!/usr/bin/env python3
"""Populate static/data/ for a build scope, hardlinking from the data store.

The tile store (2 GB, all 9 GOR regions) lives outside the repo at
DATA_STORE (override with LONDONTRAFFIC_DATA). Scopes:
  london   gor_london only, with a 1-region index.json
  national all 9 regions, with the 9-region index.json

Hardlinks keep the sync instant and avoid a second copy on disk. The swap
into static/data is atomic (stage into static/.data.tmp, then rename), so a
failed sync never leaves a half-populated static/data behind. The pruned
index.json carries a "scope" field so builds can assert data matches scope.
"""

import json
import os
import shutil
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
STORE = Path(os.environ.get("LONDONTRAFFIC_DATA", "/home/robin/github-data/londontraffic-data"))
OUT = REPO / "static" / "data"
TMP = REPO / "static" / ".data.tmp"

SCOPES = {
    "london": ["gor_london"],
    "national": [
        "gor_east", "gor_east_midlands", "gor_london", "gor_north_east",
        "gor_north_west", "gor_south_east", "gor_south_west",
        "gor_west_midlands", "gor_yorkshire_humber",
    ],
}

def required_paths(regions: list[str]) -> list[Path]:
    files = [STORE / "index.json"]
    for region in regions:
        files.append(STORE / region / "manifest.json")
        files.append(STORE / region / "tiles" / "links.pmtiles")
    return files

def main() -> None:
    scope = sys.argv[1] if len(sys.argv) > 1 else "london"
    if scope not in SCOPES:
        sys.exit(f"Unknown scope '{scope}'. Use one of: {', '.join(SCOPES)}")
    regions = SCOPES[scope]

    # Validate every source file BEFORE touching static/data.
    missing = [str(p) for p in required_paths(regions) if not p.exists()]
    if missing:
        sys.exit("Missing in the data store:\n  " + "\n  ".join(missing))

    # Stage the full scope into a temp dir, then swap atomically.
    if TMP.exists():
        shutil.rmtree(TMP)
    TMP.mkdir(parents=True)

    for region in regions:
        shutil.copytree(STORE / region, TMP / region, copy_function=os.link)

    # The store's index.json lists every region; scopes smaller than national
    # get a pruned index so the app only offers what its tiles serve. Either
    # way the index records the scope it was built for.
    if len(regions) == len(SCOPES["national"]):
        index = json.loads((STORE / "index.json").read_text())
    else:
        full = json.loads((STORE / "index.json").read_text())
        index = {**full, "regions": [e for e in full["regions"] if e["id"] in regions]}
    index["scope"] = scope
    (TMP / "index.json").write_text(json.dumps(index, indent=1))

    if OUT.exists():
        shutil.rmtree(OUT)
    TMP.rename(OUT)

    n = len(list(OUT.glob("*/manifest.json")))
    print(f"synced scope '{scope}': {n} region(s) -> {OUT}")

if __name__ == "__main__":
    main()
