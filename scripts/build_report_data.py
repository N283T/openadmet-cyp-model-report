#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["polars>=1.0"]
# ///
"""Build the chart JSON under ``docs/assets/data/`` from tracked leaderboard CSVs.

The CSVs are the byte-for-byte copies in the working repository,
``artifacts/tracked/leaderboard-final-20261108/csv/<board>/<track>/<endpoint>.csv``
(https://github.com/N283T/openadmet-cyp-challenge). Point ``--snapshot`` at that
directory.

Usage:
    ./scripts/build_report_data.py --snapshot ../openadmet-cyp-challenge/artifacts/tracked/leaderboard-final-20261108
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import polars as pl

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "docs" / "assets" / "data"
USER = "N283T"

TARGETS = [
    ("regression", "MA", "MA-ST-RAE", "Regression · macro average", "lower"),
    ("regression", "CYP1A2_pIC50_direct_inhibition", "ST-RAE", "CYP1A2 pIC50", "lower"),
    ("regression", "CYP2C9_pIC50_direct_inhibition", "ST-RAE", "CYP2C9 pIC50", "lower"),
    ("regression", "CYP2D6_pIC50_direct_inhibition", "ST-RAE", "CYP2D6 pIC50", "lower"),
    ("regression", "CYP3A4_pIC50_direct_inhibition", "ST-RAE", "CYP3A4 pIC50", "lower"),
    ("classification", "MA", "MA-MCC", "Classification · macro average", "higher"),
    ("classification", "CYP2D6_is_TDI", "MCC", "CYP2D6 TDI", "higher"),
    ("classification", "CYP3A4_is_TDI", "MCC", "CYP3A4 TDI", "higher"),
]


def board(snapshot: Path, name: str, track: str, endpoint: str) -> pl.DataFrame:
    return pl.read_csv(snapshot / "csv" / name / track / f"{endpoint}.csv", infer_schema_length=0)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--snapshot", type=Path, required=True)
    args = parser.parse_args()

    targets = []
    for track, endpoint, metric, label, better in TARGETS:
        rows = {}
        for name in ("final", "live", "interim"):
            df = board(args.snapshot, name, track, endpoint)
            me = df.filter(pl.col("Username") == USER)
            rows[name] = {
                "value": float(me[metric][0]),
                "std": float(me[f"{metric} std"][0]),
                "rank": int(me["Rank"][0]),
                "n": df.height,
                "submitted": me["Submitted"][0],
            }
            if name == "final":
                final = df
        scores = final[metric].cast(pl.Float64).to_list()
        tier = None
        if "Significance (tiers)" in final.columns:
            tier = final.filter(pl.col("Username") == USER)["Significance (tiers)"][0]
        targets.append(
            {
                "track": track,
                "endpoint": endpoint,
                "label": label,
                "metric": metric,
                "better": better,
                "best": scores[0],
                "scores": scores,
                "tier": tier,
                "boards": rows,
            }
        )
    OUT.mkdir(parents=True, exist_ok=True)
    payload = {"user": USER, "source": "leaderboard-final-20261108", "targets": targets}
    (OUT / "standings.json").write_text(json.dumps(payload, indent=1) + "\n")
    print(OUT / "standings.json")


if __name__ == "__main__":
    main()
