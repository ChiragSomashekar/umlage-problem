# The Umlage Problem

Germany argues about pensions more than about almost anything else. Behind the
whole argument sits one dataset: how many people of each age are alive in a
given year. I wanted to actually see it, so I drew it. Several times.

Everything here uses the same numbers: UN World Population Prospects 2024,
medium variant, Germany, 1950 to 2100. One dataset, different ways of looking.

**Live:** https://chiragsomashekar.github.io/umlage-problem/

## The pieces

| URL | What it is |
|---|---|
| `/` | The interactive essay. A population pyramid with a year slider, 1950 to 2100. Annotations ride along with their generations as you scrub. |
| `/?ridge` | The poster. A ridgeline: 76 lines, one for every second year, stacked front to back. The rust thread follows the people born in 1964 across their whole lives. |
| `/?reel` | The ridgeline as a short film. It teaches you to read the chart on a single line, then builds the rest while a year counter runs. |
| `/?promo` | The pyramid as a film, made for screen recording. |
| `/?flow` | An experiment. The pay-as-you-go system as a particle stream: contributions flowing from workers to pensioners through an account that stays empty. Rougher than the others, kept because the idea deserves another pass someday. |

## Reading the numbers

The ratio shown in the essay is residents aged 20 to 64 per resident 65 and
older. That is a demographic measure I calculated myself, not the statutory
contributor-to-pensioner ratio the Rentenversicherung publishes. The two tell
the same story at different heights; the source line on the page says so too.

In 1950 the ratio was 6.7. In 2026 it is 2.4. The medium projection puts it
below 1.8 from 2038 on, and it never comes back up.

Two footnotes that trip people up:

- Years after 2024 are projections, marked as such on every chart.
- The last age group is "100 and older" pooled together, which is why the
  lines end with a small rise. Nobody un-dies at 100.

## How it is built

React and Vite. D3 is only allowed to do math (scales, extents, shape
generators); React renders every SVG element itself; Motion animates them.
That separation comes from the react-graph-gallery course by Yan Holtz, which
is where this project started. The rule held up surprisingly well, including
for the films, which are just React components with a timeline.

The data pipeline is offline: the UN bulk CSVs get filtered down to compact
JSONs (see `DATA.md` for sources, license, and the caveats I know about).

```
npm install
npm run dev
```

Deploys to GitHub Pages with `npm run deploy`.

## Data

United Nations, World Population Prospects 2024, medium variant.
Licensed CC BY 3.0 IGO. Full citation and notes in [DATA.md](DATA.md).
