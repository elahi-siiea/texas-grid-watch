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

- **Overview**: current demand, today's peak, renewable share right now, and the highest hourly demand on record, plus a 24-hour / 7-day demand chart and a stacked generation-by-fuel chart (megawatts or share).
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

> `[REAL DATA]` These need real numbers. Add an EIA key, open the app, and replace each bracket with what the charts show. Until then they are placeholders, not results. The bundled sample data is synthetic and must not be quoted.

1. Solar generation went from `[X]` TWh in `[first year]` to `[Y]` TWh in `[last complete year]` (Trends, chart 1).
2. Wind plus solar supplied `[X]%` of generation in `[last complete year]`, up from `[Y]%` in `[first year]` (Trends, chart 2).
3. The yearly peak hour of demand rose from `[X]` GW to `[Y]` GW, about `[Z]` GW per year on a straight-line fit (Trends, chart 3).
4. Annual demand grew `[X]%` per year on average between `[first year]` and `[last complete year]` (Data centers page). This data cannot say how much of that comes from data centers.
5. On an average summer day, net load is lowest around `[hour]` and highest around `[hour]` (Daily patterns).

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
- The daily-route names and the `timezone` facet were written from EIA's v2 conventions and should be checked against live metadata once with a real key (see below).

## First run with a real key

Before publishing, confirm the live responses once:

1. `EIA_API_KEY=... npm run dev`, open the Overview page and confirm there is no "Using sample data" banner.
2. If a banner remains, its message names the cause. If it says the EIA API returned no data, check the route names and facets in `src/lib/eia/queries.ts` against `https://api.eia.gov/v2/electricity/rto/?api_key=YOUR_KEY`.
3. Check that fuel codes in the data match `src/lib/fuels.ts`; unknown codes are grouped into "Battery & other".
4. Fill the Key findings above and the TODOs on the Data centers page.
