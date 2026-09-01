# Data provenance

## Source

**United Nations, Department of Economic and Social Affairs, Population Division (2024).**
*World Population Prospects 2024*, Online Edition.
License: CC BY 3.0 IGO. Accessed: 2026-09-01.

Files used (official bulk CSVs from population.un.org):
- `WPP2024_Population1JanuaryBySingleAgeSex_Medium_1950-2023.csv.gz`
- `WPP2024_Population1JanuaryBySingleAgeSex_Medium_2024-2100.csv.gz`

Filtered to Germany (`ISO3_code = DEU`, LocID 276). Raw filtered rows kept in
`../d3-react-course/playground/pension-data/` as provenance.

## Processing (ours)

- `src/data/pyramid.json` — `{year: [[male, female] × ages 0–100]}`, values in
  thousands, rounded to 0.1. Direct reshape, no modeling.
- `src/data/ratio.json` — workers-per-pensioner by year, **our derivation**:
  workers = population aged 20–64, pensioners = 65+. Label as own calculation,
  not a UN-published indicator.

## Second source: migration comparison scene — BUILT, SHELVED (2026-09)

Editorial decision: the published piece and the LinkedIn film use UN data only.
The migration counterfactual, though factual and sourced, is too easily
stripped of context in a feed and repurposed politically. The component
(`MigrationPyramid.jsx`), data, and this documentation remain in the repo for
a future venue of Chirag's choosing.

**Eurostat, EUROPOP2023 population projections (`proj_23np`)** — population on
1 January by single age, sex, and projection type. Germany, 2022–2100.
Fetched via the no-auth dissemination API; variants used: `BSL` (baseline) and
`NMIGR` (sensitivity test: no migration, net migration = 0 from 2023 onward).
Stored in `src/data/migration-variants.json` as
`{year: [[ [bsl_m,bsl_f], [nm_m,nm_f] ] × ages 0–100]}`, thousands.

Rule: the migration scene compares Eurostat-vs-Eurostat only — never mixed
with WPP bars in one chart (different baselines and assumptions). The two
sources are cited separately.

Checked divergence (2026-09): both sources agree on the present (~85M, <1%
apart in 2025) but diverge over the century — Eurostat baseline holds ~84M to
2100 (assumes sustained net migration at recent levels) while WPP medium
declines to ~71M (lower migration assumptions). 11% apart by 2060, 19% by
2100. Neither is "wrong"; they are different scenario philosophies. This is
why per-chart source separation is mandatory, and why each chart carries its
own visible source label.

## Caveats for publication

1. 1950–2023 are UN **estimates** (harmonized series), not raw Destatis registry
   data. The UN treats Germany as one unified territory for the whole series,
   including pre-1990 — this is why WPP was chosen over Eurostat (`DE` = West
   Germany only before 1991).
2. 2024–2100 is the **Medium variant** — one scenario (fertility + migration
   assumptions), not a forecast. Mark future years as "projection, medium
   scenario".
3. Age 100 bucket = "100+".
