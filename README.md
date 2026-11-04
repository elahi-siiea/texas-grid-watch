# Texas Grid Watch

A dashboard that shows how the Texas (ERCOT) electricity grid is changing, built on public U.S. Energy Information Administration data.

**Live demo:** `[LIVE DEMO URL: add after deploying to Vercel]`

| Overview | Trends |
| --- | --- |
| `[SCREENSHOT: docs/overview.png]` | `[SCREENSHOT: docs/trends.png]` |

| Daily patterns | Data centers |
| --- | --- |
| `[SCREENSHOT: docs/daily-patterns.png]` | `[SCREENSHOT: docs/data-centers.png]` |

## Features

- **Overview**: current demand, today's peak, latest renewable share, and the highest hourly demand on record, plus a 24-hour / 7-day demand chart and a stacked generation-by-fuel chart (megawatts or share).
- **Trends**: yearly solar and wind generation, gas / coal / renewables share, and peak demand with a straight-line trend. A year-range selector filters every chart.
- **Daily patterns**: average demand, solar, gas and net load by hour of day, with a summer / winter toggle and a plain-English explanation of the duck curve.
- **Data centers and the grid**: demand growth computed from the app's own data, sourced context on Texas SB 6, visible TODOs for figures that still need verifying, and a limitations note.
- **About / methods**: data source, calculations, time zone, units, caching and limitations.
- Light and dark mode, skeleton / empty / error states, keyboard-accessible controls, text summaries for every chart, and "?" tooltips for terms like MW, MWh, baseload and capacity factor.
- Works without an API key by falling back to clearly labeled sample data.

## Tech stack

Next.js (App Router) and TypeScript in strict mode, Tailwind CSS 4, Recharts, Vitest. No database and no login.

## Run locally

```bash
npm install
cp .env.example .env.local   # then add your EIA key
npm run dev
```

Open <http://localhost:3000>. Without a key the site runs on sample data and says so.

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm test` | Run the unit tests |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |

## Environment variables

| Name | Required | Description |
| --- | --- | --- |
| `EIA_API_KEY` | No | Free key from <https://www.eia.gov/opendata/register.php>. Read only on the server. Without it the app shows sample data. |

To deploy on Vercel, import the repository and add `EIA_API_KEY` under Project Settings, Environment Variables.

## How the data flows

```
Browser  ->  /api/recent | /api/history | /api/patterns  ->  EIA API v2
              (server route handlers, key stays here)
```

- `src/lib/eia/`: EIA client (pagination, typed errors), parsers and query definitions.
- `src/lib/analysis/`: all calculations (aggregation, shares, peaks, hour-of-day averages, trend). Pure functions with unit tests in `tests/`.
- `src/lib/data/service.ts`: builds each payload, caches it, and falls back to sample data on any EIA failure (no key, rate limit, outage, empty response) with the reason shown to the user.
- Caching: recent hourly data for one hour, history and daily patterns for one day, in memory plus `Cache-Control` headers for the CDN.

EIA endpoints used (all with `facets[respondent][]=ERCO`):

| Route | Used for |
| --- | --- |
| `electricity/rto/region-data` (type `D`) | Hourly demand |
| `electricity/rto/fuel-type-data` | Hourly generation by fuel |
| `electricity/rto/daily-fuel-type-data` (timezone `Central`) | Daily generation by fuel for yearly charts |

## Key findings

Computed by this app's own pipeline from live EIA data for ERCOT on 4 November 2026 (data through 3 November). Years are complete calendar years, 2019 to 2025. Numbers will drift slightly as EIA revises data, so re-check them before quoting.

1. **Solar grew from a rounding error to a major source.** Solar generation went from 4.0 TWh in 2019 to 67.4 TWh in 2025 (Trends, chart 1).
2. **The mix shifted away from gas and coal.** Wind plus solar supplied 37.5% of generation in 2025, up from 21.1% in 2019. Over the same period natural gas fell from 47.3% to 40.9% and coal from 20.4% to 13.0% (Trends, chart 2).
3. **Peak demand is rising.** The highest hour of demand went from 74.5 GW in 2019 to 83.6 GW in 2025, about 2.2 GW more per year on a straight-line fit. The highest hour in the dataset so far is 91.1 GW, on 22 July 2026, in a year that is not yet complete (Trends, chart 3).
4. **Annual demand grew about 4.0% per year.** Electricity use rose from 383.7 TWh in 2019 to 485.6 TWh in 2025 (Data centers page). This data covers the whole grid and cannot say how much of the growth comes from data centers.
5. **The evening is the hard part of a summer day.** Averaged over 92 summer days, solar peaks around 2 PM at 29.8 GW. Net load (demand minus wind and solar) is lowest around 10 AM at 28.6 GW and reaches 60.0 GW by 9 PM (Daily patterns).

## Data source and credit

Data: [U.S. Energy Information Administration](https://www.eia.gov/opendata/), Hourly Electric Grid Monitor, via the EIA Open Data API v2. This project is not affiliated with or endorsed by the EIA or ERCOT.

## Methods

- Times: EIA reports UTC; everything is converted to Central Time before grouping. Every time in the UI is marked CT.
- Units: hourly EIA values are MWh per hour, numerically equal to average MW. Charts show MW or GW; yearly totals are TWh.
- Fuel groups: natural gas, wind, solar, nuclear, coal, and "Battery & other" (hydro, oil, batteries and anything else).
- Renewable share: wind plus solar divided by total generation. Negative output (batteries charging) is excluded from the total.
- Daily and yearly totals: days with fewer than 22 hourly demand readings are dropped; years with fewer than 350 days are treated as incomplete and excluded from year-to-year charts.
- Hour-of-day averages: the last 365 days, summer = June to August, winter = December to February; missing readings are skipped, not zeroed.
- Trend line: ordinary least squares through the yearly peaks.

## Limitations

- Grid-operator-reported data can be revised and can have gaps.
- Hourly averages smooth out short spikes, so peaks can be lower than ERCOT's instantaneous records.
- The history starts in 2019, so "record" means highest in this dataset.
- The data describes the whole grid and cannot attribute growth to a specific kind of customer.

## Checking a deployment

1. Open the Overview page. If a "Using sample data" banner shows, its message names the cause (missing key, rate limit, outage, or no data).
2. ERCOT currently reports these EIA fuel codes: `NG`, `WND`, `SUN`, `NUC`, `COL`, `BAT`, `OTH`, `WAT`. The mapping to chart groups lives in `src/lib/fuels.ts`; unknown codes fall into "Battery & other".
3. Fill the TODO boxes on the Data centers page (ERCOT queue and forecast figures) before publishing.
