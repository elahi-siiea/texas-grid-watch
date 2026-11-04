"use client";

import { useState } from "react";
import { netLoadMw } from "@/lib/analysis";
import { formatGw } from "@/lib/format";
import { formatCentral } from "@/lib/time";
import type { HourOfDay, PatternsPayload, Season } from "@/lib/types";
import { useApi } from "@/lib/use-api";
import { PatternChart, formatHour } from "./charts/PatternChart";
import { ChartCard } from "./ui/ChartCard";
import { SampleBanner } from "./ui/SampleBanner";
import { Segmented } from "./ui/Segmented";
import { Term } from "./ui/Term";

const SEASON_OPTIONS = [
  { value: "summer", label: "Summer (Jun to Aug)" },
  { value: "winter", label: "Winter (Dec to Feb)" },
] as const;

function argMax(hours: readonly HourOfDay[], value: (h: HourOfDay) => number): HourOfDay | undefined {
  return hours.reduce<HourOfDay | undefined>((best, h) => (best === undefined || value(h) > value(best) ? h : best), undefined);
}

function argMin(hours: readonly HourOfDay[], value: (h: HourOfDay) => number): HourOfDay | undefined {
  return argMax(hours, (h) => -value(h));
}

function describe(hours: readonly HourOfDay[]): string | null {
  const solarPeak = argMax(hours, (h) => h.solarMw);
  const netLow = argMin(hours, netLoadMw);
  if (!solarPeak || !netLow || solarPeak.solarMw <= 0) return null;
  const evening = argMax(hours.filter((h) => h.hour > netLow.hour), netLoadMw);
  const gasLow = argMin(hours.filter((h) => h.hour >= 6 && h.hour <= 18), (h) => h.gasMw);
  const gasEvening = gasLow ? argMax(hours.filter((h) => h.hour > gasLow.hour), (h) => h.gasMw) : undefined;
  const parts = [`On average, solar output peaks around ${formatHour(solarPeak.hour)} at ${formatGw(solarPeak.solarMw)}.`];
  if (evening) {
    parts.push(
      `Net load, the demand left after wind and solar, is lowest around ${formatHour(netLow.hour)} (${formatGw(netLoadMw(netLow))}) and reaches ${formatGw(netLoadMw(evening))} by ${formatHour(evening.hour)}.`,
    );
  }
  if (gasLow && gasEvening) {
    parts.push(`Natural gas output falls to ${formatGw(gasLow.gasMw)} around ${formatHour(gasLow.hour)} and climbs to ${formatGw(gasEvening.gasMw)} around ${formatHour(gasEvening.hour)}.`);
  }
  return parts.join(" ");
}

export function PatternsView() {
  const { state, retry } = useApi<PatternsPayload>("/api/patterns");
  const [season, setSeason] = useState<Season>("summer");
  const data = state.status === "ready" ? state.data : undefined;
  const pattern = data?.seasons[season];
  const text = pattern ? describe(pattern.hours) : null;
  const covered = data
    ? `${formatCentral(Date.parse(data.meta.coverage.start), { month: "short", year: "numeric" })} to ${formatCentral(Date.parse(data.meta.coverage.end), { month: "short", year: "numeric" })}`
    : "";

  return (
    <>
      <header className="max-w-3xl">
        <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          A typical day on the Texas grid
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-soft">
          Averaging each hour of the day across a whole season shows the daily rhythm: when demand rises, when solar
          produces, and when natural gas picks up the slack.
        </p>
      </header>

      <div className="mt-8">
        <SampleBanner metas={[data?.meta]} />
      </div>

      <div className="mt-12">
        <ChartCard
          title="Average demand and solar output by hour"
          subtitle={pattern ? `Average of ${pattern.days} days, ${covered}` : "Average by hour of day"}
          meta={data?.meta}
          status={state.status}
          errorMessage={state.status === "error" ? state.message : undefined}
          onRetry={retry}
          empty={!pattern || pattern.days === 0}
          emptyMessage="There are no days for this season in the loaded period."
          height={380}
          summary={text ?? "Line chart of average demand, solar, gas and net load by hour of day."}
          controls={<Segmented label="Season" options={SEASON_OPTIONS} value={season} onChange={setSeason} />}
          caption={text ?? undefined}
        >
          {pattern && <PatternChart hours={pattern.hours} />}
        </ChartCard>
      </div>

      <section aria-labelledby="why-heading" className="mt-16 max-w-3xl">
        <h2 id="why-heading" className="font-serif text-2xl font-semibold">
          Why the curve looks like this
        </h2>
        <div className="mt-4 space-y-4 leading-relaxed">
          <p>
            Solar panels only produce while the sun is up, and they produce the most near midday. Wind and solar
            together can cover a large share of demand in the middle of the day, so the load that other power sources
            must meet, the <Term term="netLoad" />, drops.
          </p>
          <p>
            Then the sun sets. Demand is often still high in the early evening, when people are home and air
            conditioners are running, so net load climbs steeply. Plants that can change output quickly, mostly
            natural gas and, increasingly, batteries, cover that climb. Plotted over a day, net load can look like the
            back of a duck, which is why this pattern is called the <Term term="duckCurve" />.
          </p>
          <p>
            The season matters because summer has more hours of sun and a different demand shape than winter. Use the
            season toggle to compare them. These are averages: any single day can look quite different.
          </p>
        </div>
      </section>
    </>
  );
}
