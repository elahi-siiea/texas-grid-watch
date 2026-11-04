"use client";

import { useState } from "react";
import { linearTrend, summarizeYears } from "@/lib/analysis";
import { formatGw, formatPercent, formatTwh } from "@/lib/format";
import type { HistoryPayload, YearSummary } from "@/lib/types";
import { useApi } from "@/lib/use-api";
import { PeakChart, SharesChart, SolarWindChart, type PeakDatum } from "./charts/TrendCharts";
import { ChartCard } from "./ui/ChartCard";
import { SampleBanner } from "./ui/SampleBanner";
import { Term } from "./ui/Term";
import { YearRange } from "./ui/YearRange";

function movement(from: number, to: number): string {
  if (to > from) return "rose";
  if (to < from) return "fell";
  return "was unchanged";
}

function solarWindCaption(first: YearSummary, last: YearSummary) {
  if (first.year === last.year) return `In ${first.year}, solar produced ${formatTwh(first.mixTwh.solar, 1)} and wind ${formatTwh(first.mixTwh.wind, 1)}.`;
  return `Between ${first.year} and ${last.year}, solar generation ${movement(first.mixTwh.solar, last.mixTwh.solar)} from ${formatTwh(first.mixTwh.solar, 1)} to ${formatTwh(last.mixTwh.solar, 1)}, and wind generation ${movement(first.mixTwh.wind, last.mixTwh.wind)} from ${formatTwh(first.mixTwh.wind, 1)} to ${formatTwh(last.mixTwh.wind, 1)}.`;
}

function sharesCaption(first: YearSummary, last: YearSummary) {
  if (!first.shares || !last.shares) return "Share data is not available for this range.";
  const ren = (y: YearSummary) => (y.shares ? y.shares.wind + y.shares.solar : 0);
  if (first.year === last.year) {
    return `In ${first.year}, natural gas supplied ${formatPercent(first.shares.gas)} of generation, coal ${formatPercent(first.shares.coal)}, and wind plus solar ${formatPercent(ren(first))}.`;
  }
  return `From ${first.year} to ${last.year}, natural gas went from ${formatPercent(first.shares.gas)} to ${formatPercent(last.shares.gas)} of generation, coal from ${formatPercent(first.shares.coal)} to ${formatPercent(last.shares.coal)}, and wind plus solar from ${formatPercent(ren(first))} to ${formatPercent(ren(last))}.`;
}

export function TrendsView() {
  const { state, retry } = useApi<HistoryPayload>("/api/history");
  const data = state.status === "ready" ? state.data : undefined;

  const allYears = data ? summarizeYears(data.days) : [];
  const completeYears = allYears.filter((y) => y.complete);
  const partialYears = allYears.filter((y) => !y.complete).map((y) => y.year);

  const [range, setRange] = useState<{ from: number; to: number } | null>(null);
  const firstYear = completeYears[0]?.year;
  const lastYear = completeYears[completeYears.length - 1]?.year;
  const from = range?.from ?? firstYear;
  const to = range?.to ?? lastYear;
  const selected = completeYears.filter((y) => from !== undefined && to !== undefined && y.year >= from && y.year <= to);
  const first = selected[0];
  const last = selected[selected.length - 1];

  const line = selected.length >= 3 ? linearTrend(selected.map((y) => ({ x: y.year, y: y.peakMw }))) : null;
  const peakData: PeakDatum[] = selected.map((y) => ({
    year: y.year,
    peakMw: y.peakMw,
    trendMw: line ? line.slope * y.year + line.intercept : null,
  }));
  const slope = line?.slope;

  const common = {
    meta: data?.meta,
    status: state.status,
    errorMessage: state.status === "error" ? state.message : undefined,
    onRetry: retry,
    empty: selected.length === 0,
    emptyMessage: "No complete years are available for this range.",
  } as const;

  return (
    <>
      <header className="max-w-3xl">
        <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          How the grid has changed since 2019
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-soft">
          Annual totals and peaks for the ERCOT grid. Each chart answers one question; the sentence underneath says
          what the numbers show.
        </p>
      </header>

      <div className="mt-8">
        <SampleBanner metas={[data?.meta]} />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-y border-line py-3">
        {completeYears.length > 0 && from !== undefined && to !== undefined ? (
          <YearRange years={completeYears.map((y) => y.year)} from={from} to={to} onChange={(f, t) => setRange({ from: f, to: t })} />
        ) : (
          <p className="text-sm text-soft">Year range</p>
        )}
        {partialYears.length > 0 && (
          <p className="text-sm text-soft">
            {partialYears.join(", ")} left out: the year is not complete, so totals and peaks would be understated.
          </p>
        )}
      </div>

      <div className="mt-12 space-y-16">
        <ChartCard
          {...common}
          title="Solar and wind generation by year"
          subtitle="Total electricity generated each year, in terawatt-hours (TWh)"
          summary={first && last ? solarWindCaption(first, last) : "No data."}
          caption={
            first && last ? (
              <>
                {solarWindCaption(first, last)} A <Term term="twh" /> is a billion kilowatt-hours. These are totals
                of what was generated, which depends on both how much was built and how windy or sunny the year was.
              </>
            ) : undefined
          }
        >
          <SolarWindChart years={selected} />
        </ChartCard>

        <ChartCard
          {...common}
          title="Gas, coal and renewables share of generation"
          subtitle="Percent of each year's electricity by source. Renewables here means wind plus solar."
          summary={first && last ? sharesCaption(first, last) : "No data."}
          caption={
            first && last ? (
              <>
                {sharesCaption(first, last)} Hydro, nuclear and batteries make up the rest and are not drawn.
              </>
            ) : undefined
          }
        >
          <SharesChart years={selected} />
        </ChartCard>

        <ChartCard
          {...common}
          empty={selected.length === 0}
          title="Peak demand by year"
          subtitle="The highest single hour of demand each year, in gigawatts (GW)"
          summary={
            first && last
              ? `Bar chart of yearly peak demand. ${first.year}: ${formatGw(first.peakMw)}. ${last.year}: ${formatGw(last.peakMw)}.`
              : "No data."
          }
          caption={
            first && last ? (
              <>
                The <Term term="peakDemand">peak</Term> is the highest hourly reading in each year, from {formatGw(first.peakMw)} in{" "}
                {first.year} to {formatGw(last.peakMw)} in {last.year}.{" "}
                {slope !== undefined
                  ? `A straight line fitted through these years rises by about ${formatGw(slope)} per year. It describes the past and is not a forecast.`
                  : "Select at least three years to draw a trend line."}
              </>
            ) : undefined
          }
        >
          <PeakChart data={peakData} />
        </ChartCard>
      </div>
    </>
  );
}
