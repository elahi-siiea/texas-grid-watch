import { formatCentral, formatCentralStamp } from "@/lib/time";
import type { DataMeta } from "@/lib/types";
import { EmptyState, ErrorState } from "./States";
import { LoadingRegion, Skeleton } from "./Skeleton";

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  meta?: DataMeta;
  status: "loading" | "error" | "ready";
  errorMessage?: string;
  onRetry?: () => void;
  empty?: boolean;
  emptyMessage?: string;
  /** Text description of what the chart shows, read by screen readers. */
  summary: string;
  caption?: React.ReactNode;
  controls?: React.ReactNode;
  legend?: React.ReactNode;
  height?: number;
  children: React.ReactNode;
}

export function ChartCard({
  title,
  subtitle,
  meta,
  status,
  errorMessage,
  onRetry,
  empty,
  emptyMessage = "There is no data for this selection.",
  summary,
  caption,
  controls,
  legend,
  height = 320,
  children,
}: ChartCardProps) {
  return (
    <figure className="border-t-2 border-ink pt-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-semibold leading-snug">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-soft">{subtitle}</p>}
        </div>
        {controls}
      </div>

      <div className="mt-4">
        {status === "loading" && (
          <LoadingRegion label={`Loading ${title}`}>
            <Skeleton className="w-full" style={{ height }} />
          </LoadingRegion>
        )}
        {status === "error" && <ErrorState message={errorMessage ?? "Something went wrong."} onRetry={onRetry} />}
        {status === "ready" && empty && <EmptyState message={emptyMessage} />}
        {status === "ready" && !empty && (
          <>
            {legend && <div className="mb-3">{legend}</div>}
            <div role="img" aria-label={summary} style={{ height }} className="w-full">
              {children}
            </div>
            <p className="sr-only">{summary}</p>
          </>
        )}
      </div>

      {caption && status === "ready" && !empty && (
        <figcaption className="mt-4 max-w-prose text-sm leading-relaxed">
          <span className="font-semibold">What this shows. </span>
          {caption}
        </figcaption>
      )}

      <SourceLine meta={meta} />
    </figure>
  );
}

function SourceLine({ meta }: { meta?: DataMeta }) {
  if (!meta) return <p className="mt-3 text-xs text-soft">Data source: loading</p>;
  const through = formatCentral(Date.parse(meta.coverage.end), {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return (
    <p className="mt-3 text-xs text-soft">
      Data source:{" "}
      {meta.source === "eia"
        ? "U.S. Energy Information Administration, Hourly Electric Grid Monitor (ERCOT)"
        : "Sample data (illustrative, not real measurements)"}
      {" · "}Last updated: {formatCentralStamp(Date.parse(meta.updatedAt))}
      {" · "}Data through {through} CT
    </p>
  );
}
