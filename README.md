# Australian Politicians: Expenses, Interests, Salaries (rebuild)

A static site that surfaces published Federal politician spending data in searchable form. This is a clean rebuild of [icacpls/icacpls.github.io](https://github.com/icacpls/icacpls.github.io), brought up to date through 2026 with current data sources.

## Status: working but partial

What's working out of the box:
- **Expense data** from IPEA (Independent Parliamentary Expenses Authority), via data.gov.au CSVs
- Sortable, filterable expense table across all loaded quarters
- Members directory with party/state/chamber filters
- Per-MP detail pages with category and quarter breakdowns
- Aggregate summary stats by party, state, category

What's not yet integrated (these were on the original site):
- **Members' Interests register** (PDFs on aph.gov.au, requires per-MP scraping and PDF parsing)
- **Donations** (AEC transparency portal, annual returns)
- **Salary estimates** (Remuneration Tribunal determinations)
- **Property map** (derived from the interests register)

These are tracked in the roadmap below.

## Quickstart

The repo ships with a small sample of real Q3 2025 expense data so you can see the site work immediately.

```bash
# Clone
git clone https://github.com/yourname/icacpls.github.io.git
cd icacpls.github.io

# Build the JSON files from sample data
python3 scripts/process_csv.py

# Serve locally
python3 -m http.server 8000
# open http://localhost:8000
```

## Loading real data

The `fetch_data.py` script discovers all IPEA quarterly extracts on data.gov.au and downloads them, then processes everything to JSON.

```bash
# All quarters from 2024 onwards (recommended starting point — ~8 files)
python3 scripts/fetch_data.py --since 2024

# Single quarter
python3 scripts/fetch_data.py --quarter 2025q03

# Everything since IPEA started reporting (~36 quarters, ~5GB of CSVs)
python3 scripts/fetch_data.py
```

After fetching, the JSON files in `data/` are regenerated and the site is ready to deploy.

## Deploying to GitHub Pages

1. Fork or rename this repo to `<username>.github.io` (for a user site) or any name (for a project site).
2. Run `python3 scripts/fetch_data.py --since 2024` locally.
3. Commit the generated JSON files in `data/` (they're small once compressed).
4. Push. GitHub Pages serves it from the root.

Optional: schedule a GitHub Action to run `fetch_data.py` quarterly so the site auto-updates after each IPEA release. IPEA typically publishes within ~3 months of quarter end.

## Project structure

```
.
├── index.html              Overview / homepage
├── expenses.html           Filterable line-item table
├── members.html            Members directory
├── member.html?id=XXXX     Individual MP detail
├── summary.html            Aggregates and methodology
├── styles.css              All styling
├── scripts.js              Shared table, sort, chart logic
├── data/
│   ├── sample_q3_2025.csv  Sample data (real, ~110 rows from Jul-Sep 2025)
│   ├── raw/                Downloaded quarterly CSVs (gitignored once large)
│   ├── expenses.json       All line items (generated)
│   ├── members.json        Per-MP totals (generated)
│   ├── summary.json        Aggregate stats (generated)
│   └── quarters.json       Loaded reporting periods (generated)
└── scripts/
    ├── fetch_data.py       Pull from data.gov.au CKAN API
    └── process_csv.py      CSV -> JSON build step
```

## Roadmap

**Interests register** — Each MP and Senator has a PDF on aph.gov.au. Build:
- Scraper that walks the index pages and downloads each PDF
- Parser (PyMuPDF + heuristics) to pull out the eight headed sections (shareholdings, real estate, directorships, gifts, travel, etc.)
- A `data/interests.json` with one entry per MP, multiple revisions over time

**Donations** — AEC publishes annual donor returns as CSVs at the [Transparency Register](https://transparency.aec.gov.au/). Each financial year drops in February. Add a fetcher for AEC files and a `donations.html` that joins by donor and recipient.

**Salaries** — Calculable from base + role allowances using Remuneration Tribunal determinations. Not strictly scrapeable: parse the determination PDFs once per year. A `salary-breakdowns.html` listing base, electorate allowance, and role loadings (Speaker, Minister, Whip, etc.) for each MP.

**Property map** — Once interests data exists, geocode declared real estate and plot on Leaflet. The original site had this; data sourcing is the bottleneck, not the rendering.

## Data sources and licensing

- Expense data: [IPEA](https://www.ipea.gov.au/reporting) via [data.gov.au](https://data.gov.au/data/organization/ipea), CC BY 3.0 AU
- Members' Interests: [aph.gov.au Register](https://www.aph.gov.au/Senators_and_Members/Members/Register), Crown copyright with reproduction permitted
- Senators' Interests: [aph.gov.au Senators Register](https://www.aph.gov.au/Parliamentary_Business/Committees/Senate/Senators_Interests/CurrentRegister)
- Salaries: [Remuneration Tribunal](https://www.remtribunal.gov.au/offices/parliamentary-offices)

This site is not affiliated with the Commonwealth, IPEA, or any parliamentarian.

## Caveats

- Errors may have been introduced in transcription. Verify against original reports where it matters.
- Negative amounts (repayments and adjustments) are included in totals as published.
- The `OfficeCode` field is used as the stable per-MP key. If IPEA reissues codes between parliaments, historic figures could split across two records for the same person.
