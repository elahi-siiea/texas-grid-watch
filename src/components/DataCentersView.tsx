"use client";

import Link from "next/link";
import { compoundAnnualGrowth, summarizeYears } from "@/lib/analysis";
import { formatGw, formatPercent, formatTwh } from "@/lib/format";
import type { HistoryPayload } from "@/lib/types";
import { useApi } from "@/lib/use-api";
import { DemandBarChart } from "./charts/TrendCharts";
import { ChartCard } from "./ui/ChartCard";
import { SampleBanner } from "./ui/SampleBanner";
import { Term } from "./ui/Term";

function Todo({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded border border-dashed border-accent px-4 py-3 text-sm">
      <span className="font-semibold text-accent">TODO for the author: </span>
      {children}
    </p>
  );
}

export function DataCentersView() {
  const { state, retry } = useApi<HistoryPayload>("/api/history");
  const data = state.status === "ready" ? state.data : undefined;
  const years = (data ? summarizeYears(data.days) : []).filter((y) => y.complete);
  const first = years[0];
  const last = years[years.length - 1];
  const span = first && last ? last.year - first.year : 0;
  const demandCagr = first && last ? compoundAnnualGrowth(first.demandTwh, last.demandTwh, span) : null;
  const peakCagr = first && last ? compoundAnnualGrowth(first.peakMw, last.peakMw, span) : null;

  const growthSentence =
    first && last && demandCagr !== null && peakCagr !== null
      ? `Annual electricity use on the ERCOT grid went from ${formatTwh(first.demandTwh, 1)} in ${first.year} to ${formatTwh(last.demandTwh, 1)} in ${last.year}, an average of ${formatPercent(demandCagr, 1)} per year. The yearly peak went from ${formatGw(first.peakMw)} to ${formatGw(last.peakMw)}, an average of ${formatPercent(peakCagr, 1)} per year.`
      : null;

  return (
    <>
      <header className="max-w-3xl">
        <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Data centers and the Texas grid
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-soft">
          Electricity demand in Texas is growing, and large new customers such as data centers are a big part of the
          conversation. This page separates what this app&rsquo;s data can show from what it cannot.
        </p>
      </header>

      <div className="mt-8">
        <SampleBanner metas={[data?.meta]} />
      </div>

      <section aria-labelledby="data-heading" className="mt-12">
        <h2 id="data-heading" className="font-serif text-2xl font-semibold">
          What the demand data shows
        </h2>
        <div className="mt-6">
          <ChartCard
            title="Electricity used on the ERCOT grid, by year"
            subtitle="Total hourly demand added up over each complete year, in terawatt-hours (TWh)"
            meta={data?.meta}
            status={state.status}
            errorMessage={state.status === "error" ? state.message : undefined}
            onRetry={retry}
            empty={years.length === 0}
            emptyMessage="No complete years are available."
            summary={growthSentence ?? "Bar chart of annual electricity demand."}
            caption={
              growthSentence ? (
                <>
                  {growthSentence} Demand is measured at the grid level, so it includes every customer type: homes,
                  businesses, factories, oil and gas operations and data centers together.
                </>
              ) : undefined
            }
          >
            <DemandBarChart years={years} />
          </ChartCard>
        </div>

        {years.length > 1 && (
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[22rem] text-left text-sm">
              <caption className="pb-2 text-left text-sm font-medium">Year-over-year change in annual demand</caption>
              <thead>
                <tr className="border-b border-line text-soft">
                  <th scope="col" className="py-2 pr-4 font-medium">Year</th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">Demand</th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">Change</th>
                  <th scope="col" className="py-2 text-right font-medium">Peak hour</th>
                </tr>
              </thead>
              <tbody>
                {years.map((y, i) => {
                  const prev = years[i - 1];
                  return (
                    <tr key={y.year} className="num border-b border-line">
                      <th scope="row" className="py-2 pr-4 font-medium">{y.year}</th>
                      <td className="py-2 pr-4 text-right">{formatTwh(y.demandTwh, 1)}</td>
                      <td className="py-2 pr-4 text-right">
                        {prev ? `${y.demandTwh >= prev.demandTwh ? "+" : ""}${formatPercent(y.demandTwh / prev.demandTwh - 1, 1)}` : "n/a"}
                      </td>
                      <td className="py-2 text-right">{formatGw(y.peakMw)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="why-heading" className="mt-16 max-w-3xl">
        <h2 id="why-heading" className="font-serif text-2xl font-semibold">
          Why large new customers put pressure on a grid
        </h2>
        <div className="mt-4 space-y-4 leading-relaxed">
          <p>
            A grid has to be able to meet its highest hour of demand, the <Term term="peakDemand" />, not just the
            average. When demand rises, the system needs more power plants, batteries and transmission lines, and all
            of these take years to plan and build.
          </p>
          <p>
            Large customers add to that pressure in two ways. First, a single site can ask for a very large amount of
            power in one place, which means a local connection has to be built, not just more generation somewhere.
            Second, facilities such as data centers are generally built to run around the clock, so they add demand in
            every hour, including hours when solar is not producing. Meeting that load in the evening depends on gas,
            wind, nuclear, coal and batteries; see the <Link className="text-accent underline underline-offset-2" href="/daily-patterns">daily patterns</Link> page.
          </p>
          <p>
            Texas lawmakers have responded. According to law-firm summaries, Senate Bill 6 was signed on June 20, 2025.
            It applies to large electricity users in ERCOT, mainly those at 75 MW or more, and covers how they connect,
            who pays for the connection, and how they can be asked to reduce use in grid emergencies.
          </p>
          <p className="text-sm text-soft">
            Sources:{" "}
            <a className="text-accent underline underline-offset-2" href="https://www.mayerbrown.com/en/insights/publications/2025/07/important-texas-regulatory-updates-for-data-centers" rel="noopener noreferrer">
              Mayer Brown, Important Texas Regulatory Updates for Data Centers (July 3, 2025)
            </a>
            {"; "}
            <a className="text-accent underline underline-offset-2" href="https://www.jw.com/news/insights-senate-bill-6-texas-electric-regulations/" rel="noopener noreferrer">
              Jackson Walker, Senate Bill 6 and Upcoming Changes to Texas Electric Regulations
            </a>
            .
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <Todo>
            Add the current total of large-load interconnection requests in ERCOT&rsquo;s queue (in GW), the share that
            is data centers, and the report date, from ERCOT&rsquo;s own Large Load Interconnection Status report. Figures
            found in news and aggregator sites ranged widely and were not verified, so none are shown here.
          </Todo>
          <Todo>
            Add ERCOT&rsquo;s latest long-term peak demand forecast (GW and year), with a link to the ERCOT document.
          </Todo>
          <Todo>
            Check Senate Bill 6 details (effective date, 75 MW threshold) against the enrolled bill text on
            capitol.texas.gov before publishing.
          </Todo>
        </div>
      </section>

      <section aria-labelledby="limits-heading" className="mt-16 max-w-3xl border-t-2 border-ink pt-4">
        <h2 id="limits-heading" className="font-serif text-2xl font-semibold">
          Limitations
        </h2>
        <ul className="mt-4 list-disc space-y-3 pl-5 leading-relaxed">
          <li>
            The EIA data covers the whole grid. It does not say which customers are using the electricity, so it
            cannot show how much of the growth comes from data centers.
          </li>
          <li>
            Demand also moves with weather, population, industry and the economy. A hot year or a cold snap can change
            annual totals and peaks without any new large customers.
          </li>
          <li>
            Peaks here are the highest hourly average in the dataset, which starts in 2019. They are not the same as
            the instantaneous records ERCOT announces.
          </li>
          <li>
            A growth rate between two years describes the past. It is not a forecast, and it says nothing about
            requests that have not been built yet.
          </li>
        </ul>
      </section>
    </>
  );
}
