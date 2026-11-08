# OpenADMET CYP Challenge — Model Report

Post-challenge report on N283T's entries to the
[OpenADMET CYP Blind Challenge](https://huggingface.co/spaces/openadmet/cyp-challenge)
(closed 2026-11-03 23:59 UTC): direct-inhibition **regression** for CYP1A2, 2C9, 2D6 and 3A4,
and time-dependent-inhibition (TDI) **classification** for CYP2D6 and 3A4.

- 📊 **Interactive report:** <https://n283t.github.io/openadmet-cyp-model-report/> — source in [`docs/`](docs/)
- 🔬 **Working repository** (code, configs, research log with run IDs, tracked leaderboard snapshots):
  [N283T/openadmet-cyp-challenge](https://github.com/N283T/openadmet-cyp-challenge)
- 📜 **License for the original report:** [CC BY 4.0](LICENSE) (attribution required; third-party materials excluded).
- ⚖️ **Third-party licences:** the page bundles Apache ECharts and three font families rather than
  loading them from a CDN; each is redistributed under its own licence, reproduced in
  [`docs/assets/vendor/LICENSES/`](docs/assets/vendor/LICENSES/).

## Results

The Final leaderboard scores the full test set (750 compounds). The scored entries are the last
uploads of each track, made on 2026-11-03.

| Track | Metric | Value | Rank | Tier |
|---|---|---:|---:|---|
| Regression | macro-average ST-RAE (lower is better) | 0.4432 | 27 / 103 | Tier 8 |
| Classification | macro-average MCC (higher is better) | 0.4034 | 7 / 62 | Tier 2 |

| Regression endpoint | ST-RAE | Rank | | Classification endpoint | MCC | Rank |
|---|---:|---:|---|---|---:|---:|
| CYP1A2 | 0.4421 | 33 | | CYP2D6 TDI | 0.3046 | 10 |
| CYP2C9 | 0.3587 | 17 | | CYP3A4 TDI | 0.5023 | 7 |
| CYP2D6 | 0.5852 | 26 | | | | |
| CYP3A4 | 0.3868 | 34 | | | | |

Ranks are positions on each board; the boards hold different sets of entries. The report explains
what the entries are, what did and did not transfer from cross-validation to the leaderboard, and one
caveat that matters for reading the regression rank: the output mean and spread of every regression
column were fixed to constants that another participant inferred from leaderboard feedback.

## Reproducing the figures

`docs/assets/data/standings.json` is built from the byte-for-byte leaderboard CSVs tracked in the working
repository (`artifacts/tracked/leaderboard-final-20261108/`):

```sh
./scripts/build_report_data.py --snapshot ../openadmet-cyp-challenge/artifacts/tracked/leaderboard-final-20261108
```

The page is plain HTML, CSS and JavaScript served from `docs/` by GitHub Pages; there is no build step
for the page itself.
