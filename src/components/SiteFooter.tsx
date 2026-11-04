import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-soft sm:px-6">
        <p>
          Data: U.S. Energy Information Administration (EIA) Open Data API, Hourly Electric Grid Monitor.
          All times are Central Time (CT).
        </p>
        <p className="mt-2">
          <Link href="/about" className="text-accent underline underline-offset-2">
            Methods and limitations
          </Link>
        </p>
      </div>
    </footer>
  );
}
