import type { Metadata } from "next";
import { Term } from "@/components/ui/Term";

export const metadata: Metadata = { title: "About and methods" };

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id ?? title}-heading`} className="mt-12 scroll-mt-8 border-t border-line pt-6">
      <h2 id={`${id ?? title}-heading`} className="font-serif text-2xl font-semibold">
        {title}
      </h2>
      <div className="mt-4 space-y-4 leading-relaxed">{children}</div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
        About and methods
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-soft">
        Texas Grid Watch is an independent student project that turns public electricity data into charts and plain
        explanations. This page says where the numbers come from and how they are calculated.
      </p>

      <Section id="data-source" title="Data source">
        <p>
          All live data comes from the U.S. Energy Information Administration (EIA) Open Data API, in the Hourly
          Electric Grid Monitor dataset, for the <Term term="ercot" /> region. Thank you to the EIA for publishing this
          data for free. This project is not affiliated with or endorsed by the EIA or ERCOT.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <code>electricity/rto/region-data</code>: hourly demand.
          </li>
          <li>
            <code>electricity/rto/fuel-type-data</code>: hourly net generation by fuel.
          </li>
          <li>
            <code>electricity/rto/daily-fuel-type-data</code>: daily net generation by fuel, used for the yearly charts.
          </li>
        </ul>
        <p>
          The EIA key stays on the server. The browser only talks to this site&rsquo;s own <code>/api</code> routes.
        </p>
      </Section>

      <Section id="units" title="Units and time zone">
        <p>
          <Term term="mw" /> measures power at a moment; <Term term="mwh" /> measures energy over time. EIA reports each
          hourly value in MWh. For a one-hour period that number equals the average power in MW, so hourly charts are
          labeled in MW or GW. Yearly totals add up the hourly values and are shown in <Term term="twh" />.
        </p>
        <p>
          ERCOT operates on Central Time. EIA timestamps are in UTC, and this site converts them to Central Time
          (CST or CDT, including daylight saving) before grouping by day, season or hour. Every time shown on the site
          is Central Time, marked CT.
        </p>
      </Section>

      <Section id="calculations" title="How things are calculated">
        <ul className="list-disc space-y-3 pl-5">
          <li>
            <strong>Fuel groups.</strong> Natural gas, wind, solar, nuclear and coal are shown separately. Everything
            else, including hydro, oil and batteries, is grouped as &ldquo;Battery &amp; other.&rdquo;
          </li>
          <li>
            <strong>Shares.</strong> A fuel&rsquo;s share is its generation divided by total generation. Negative
            values, such as batteries charging, are left out of the total so shares always add to 100%.
          </li>
          <li>
            <strong>Renewable share.</strong> Wind plus solar. Hydro is not counted because it sits inside &ldquo;Battery
            &amp; other.&rdquo;
          </li>
          <li>
            <strong>Today&rsquo;s peak and the record.</strong> The highest hourly demand on a Central Time date, and
            the highest hourly demand in the whole dataset, which starts in 2019. These are hourly averages, not the
            instantaneous peaks ERCOT reports.
          </li>
          <li>
            <strong>Daily and yearly totals.</strong> Hourly demand is added up by Central Time day. A day with fewer
            than 22 hourly readings is dropped. A year with fewer than 350 days of data is treated as incomplete and
            left out of year-to-year charts.
          </li>
          <li>
            <strong>Daily patterns.</strong> For each hour of the day, the average over the last 365 days within the
            season: summer is June to August, winter is December to February. Missing readings are skipped, not counted
            as zero.
          </li>
          <li>
            <strong>Net load.</strong> Demand minus wind minus solar.
          </li>
          <li>
            <strong>Trend line.</strong> An ordinary least-squares straight line through the yearly peaks. It
            summarizes the past and is not a forecast.
          </li>
        </ul>
      </Section>

      <Section id="caching" title="Caching">
        <p>
          Recent hourly data is refreshed at most once an hour, and the long history and daily patterns at most once a
          day. This keeps the site fast and within EIA&rsquo;s rate limits. The &ldquo;Last updated&rdquo; line under
          each chart shows when the data was fetched.
        </p>
      </Section>

      <Section id="sample-data" title="Sample data and live data">
        <p>
          Without an EIA API key, or when the EIA API is down or rate-limited, the site shows a built-in sample
          dataset and says &ldquo;Using sample data&rdquo; on the page and under every chart. The sample is
          generated to look plausible. It is not real and should not be quoted.
        </p>
        <p>
          To see live data, get a free key at{" "}
          <a className="text-accent underline underline-offset-2" href="https://www.eia.gov/opendata/register.php" rel="noopener noreferrer">
            eia.gov/opendata
          </a>{" "}
          and set <code>EIA_API_KEY</code> in <code>.env.local</code> or in the hosting environment.
        </p>
      </Section>

      <Section id="limitations" title="Limitations">
        <ul className="list-disc space-y-3 pl-5">
          <li>EIA hourly grid data is reported by the grid operator and can be revised or have gaps.</li>
          <li>
            Generation is net generation by fuel as categorized by EIA. Small systems that do not report to the grid
            operator, such as rooftop solar, may not be counted.
          </li>
          <li>
            Hourly values smooth out short spikes, so peaks here can be lower than ERCOT&rsquo;s instantaneous records.
          </li>
          <li>
            The data shows what happened on the grid as a whole. It cannot say why, or which customers caused a change.
          </li>
        </ul>
      </Section>
    </div>
  );
}
