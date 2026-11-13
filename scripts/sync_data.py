#!/usr/bin/env python3
"""Populate static/data/ for a build scope, hardlinking from the data store.

The tile store (2 GB, all 9 GOR regions) lives outside the repo at
DATA_STORE (override with LONDONTRAFFIC_DATA). Scopes:
  london   gor_london only, with a 1-region index.json
  national all 9 regions, with the 9-region index.json

Hardlinks keep the sync instant and avoid a second copy on disk.
"""

import json
import os
import shutil
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
STORE = Path(os.environ.get("LONDONTRAFFIC_DATA", "/home/robin/github-data/londontraffic-data"))
OUT = REPO / "static" / "data"

SCOPES = {
    "london": ["gor_london"],
    "national": [
        "gor_east", "gor_east_midlands", "gor_london", "gor_north_east",
        "gor_north_west", "gor_south_east", "gor_south_west",
        "gor_west_midlands", "gor_yorkshire_humber",
    ],
}

def main() -> None:
    scope = sys.argv[1] if len(sys.argv) > 1 else "london"
    if scope not in SCOPES:
        sys.exit(f"Unknown scope '{scope}'. Use one of: {', '.join(SCOPES)}")
    regions = SCOPES[scope]

    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)

    for region in regions:
        src = STORE / region
        dst = OUT / region
        if not (src / "manifest.json").exists():
            sys.exit(f"Missing {src}/manifest.json in the data store")
        shutil.copytree(src, dst, copy_function=os.link)

    # The store's index.json lists every region; scopes smaller than national
    # get a pruned index so the app only offers what its tiles serve.
    if len(regions) == len(SCOPES["national"]):
        shutil.copy(STORE / "index.json", OUT / "index.json")
    else:
        full = json.loads((STORE / "index.json").read_text())
        pruned = {**full, "regions": [e for e in full["regions"] if e["id"] in regions]}
        (OUT / "index.json").write_text(json.dumps(pruned, indent=1))

    n = len(list(OUT.glob("*/manifest.json")))
    print(f"synced scope '{scope}': {n} region(s) -> {OUT}")

if __name__ == "__main__":
    main()
