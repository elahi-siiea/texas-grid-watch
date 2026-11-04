"use client";

import { useState } from "react";
import { allTimePeak, findPeak, peakOnDate, renewableShare } from "@/lib/analysis";
import { formatMw, formatPercent } from "@/lib/format";
import { centralParts, formatCentral, formatDateKey } from "@/lib/time";
import type { HistoryPayload, RecentPayload } from "@/lib/types";
import { useApi } from "@/lib/use-api";
import { DemandChart, formatTooltipTime, sliceRange, type Range } from "./charts/DemandChart";
import { MixChart, type MixMode } from "./charts/MixChart";
import { FuelLegend } from "./charts/shared";
import { ChartCard } from "./ui/ChartCard";
import { SampleBanner } from "./ui/SampleBanner";
import { Segmented } from "./ui/Segmented";
import { StatCard } from "./ui/StatCard";
import { Term } from "./ui/Term";

const RANGE_OPTIONS = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
] as const;

const MODE_OPTIONS = [
  { value: "mw", label: "Megawatts" },
  { value: "share", label: "Share" },
] as const;

export function OverviewView() {
  const recent = useApi<RecentPayload>("/api/recent");
  const history = useApi<HistoryPayload>("/api/history");
  const [demandRange, setDemandRange] = useState<Range>("24h");
  const [mixRange, setMixRange] = useState<Range>("24h");
  const [mixMode, setMixMode] = useState<MixMode>("mw");

  const recentData = recent.state.status === "ready" ? recent.state.data : undefined;
  const historyData = history.state.status === "ready" ? history.state.data : undefined;
  const hourly = recentData?.hourly ?? [];

  const latestDemand = [...hourly].reverse().find((p) => p.demandMw !== null);
  const latestMix = [...hourly].reverse().find((p) => p.mix !== null);
  const latestDay = latestDemand ? centralParts(latestDemand.t).dateKey : undefined;
  const todaysPeak = latestDay ? peakOnDate(hourly, latestDay) : null;
  const share = latestMix?.mix ? renewableShare(latestMix.mix) : null;
  const record = historyData ? allTimePeak(historyData.days) : null;
  const hourLabel = (t: number) => formatCentral(t, { hour: "numeric" });

  const demandPoints = sliceRange(hourly, demandRange);
  const mixPoints = sliceRange(hourly, mixRange);
  const demandPeak = findPeak(demandPoints);

  return (
    <>
      <header className="max-w-3xl">
        <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          How much power Texas is using, and where it comes from
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-soft">
          Hourly electricity demand and generation for the <Term term="ercot" /> grid, which serves most of Texas.
          All times are Central Time (CT).
        </p>
      </header>

      <div className="mt-8">
        <SampleBanner metas={[recentData?.meta, historyData?.meta]} />
      </div>

      <section aria-labelledby="stats-heading" className="mt-8">
        <h2 id="stats-heading" className="sr-only">
          Headline numbers
        </h2>
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={<Term term="mw">Current demand</Term>}
            status={recent.state.status}
            value={latestDemand?.demandMw != null ? formatMw(latestDemand.demandMw) : undefined}
            detail={latestDemand ? `Hour starting ${hourLabel(latestDemand.t)} CT` : undefined}
          />
          <StatCard
            label={<Term term="peakDemand">Today&rsquo;s peak so far</Term>}
            status={recent.state.status}
            value={todaysPeak ? formatMw(todaysPeak.mw) : undefined}
            detail={todaysPeak ? `At ${hourLabel(todaysPeak.at)} CT, ${latestDay ? formatDateKey(latestDay) : ""}` : undefined}
          />
          <StatCard
            label="Renewable share now"
            status={recent.state.status}
            value={share !== null ? formatPercent(share) : undefined}
            detail={latestMix ? `Wind + solar, hour starting ${hourLabel(latestMix.t)} CT` : undefined}
          />
          <StatCard
            label="Highest hourly demand on record"
            status={history.state.status}
            value={record ? formatMw(record.mw) : undefined}
            detail={record ? `${formatTooltipTime(record.at)}. Dataset starts in 2019.` : undefined}
          />
        </div>
      </section>

      <section aria-labelledby="demand-heading" className="mt-14">
        <h2 id="demand-heading" className="sr-only">
          Demand
        </h2>
        <ChartCard
          title="Electricity demand"
          subtitle="Hourly demand across the ERCOT grid, in gigawatts (GW)"
          meta={recentData?.meta}
          status={recent.state.status}
          errorMessage={recent.state.status === "error" ? recent.state.message : undefined}
          onRetry={recent.retry}
          empty={demandPoints.every((p) => p.demandMw === null)}
          summary={
            demandPeak
              ? `Line chart of hourly demand over the ${demandRange === "24h" ? "last 24 hours" : "last 7 days"}. The highest value is ${formatMw(demandPeak.mw)} at ${formatTooltipTime(demandPeak.at)}.`
              : "Line chart of hourly demand with no data."
          }
          controls={<Segmented label="Time range for demand" options={RANGE_OPTIONS} value={demandRange} onChange={setDemandRange} />}
          caption={
            <>
              Demand is how much electricity customers are drawing from the grid each hour. It usually climbs in the
              afternoon and evening and falls overnight. Values are in <Term term="mw" /> (shown as GW on the axis).
            </>
          }
        >
          <DemandChart points={demandPoints} range={demandRange} />
        </ChartCard>
      </section>

      <section aria-labelledby="mix-heading" className="mt-14">
        <h2 id="mix-heading" className="sr-only">
          Generation mix
        </h2>
        <ChartCard
          title="Where the electricity comes from"
          subtitle="Hourly generation by fuel, stacked. Same colors on every chart."
          meta={recentData?.meta}
          status={recent.state.status}
          errorMessage={recent.state.status === "error" ? recent.state.message : undefined}
          onRetry={recent.retry}
          empty={mixPoints.every((p) => p.mix === null)}
          summary={`Stacked area chart of hourly generation by fuel over the ${mixRange === "24h" ? "last 24 hours" : "last 7 days"}. ${
            latestMix?.mix && share !== null ? `In the latest hour, wind and solar supplied ${formatPercent(share)} of generation.` : ""
          }`}
          legend={<FuelLegend groups={["gas", "wind", "solar", "nuclear", "coal", "other"]} />}
          controls={
            <div className="flex flex-wrap gap-2">
              <Segmented label="Time range for generation" options={RANGE_OPTIONS} value={mixRange} onChange={setMixRange} />
              <Segmented label="Chart units" options={MODE_OPTIONS} value={mixMode} onChange={setMixMode} />
            </div>
          }
          caption={
            <>
              Each band is one fuel. Solar appears only in daylight, wind varies with the weather, and natural gas
              plants adjust to fill the gap. &ldquo;Battery &amp; other&rdquo; combines batteries, hydro, oil and
              anything not listed separately. Steadier plants sit at the bottom of the stack and weather-driven wind and solar at the top.
            </>
          }
        >
          <MixChart points={mixPoints} range={mixRange} mode={mixMode} />
        </ChartCard>
      </section>
    </>
  );
}
