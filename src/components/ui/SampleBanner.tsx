import type { DataMeta } from "@/lib/types";

export function SampleBanner({ metas }: { metas: readonly (DataMeta | undefined)[] }) {
  const sample = metas.find((m) => m?.source === "sample");
  if (!sample) return null;
  return (
    <div role="status" className="mb-8 rounded bg-warn-bg px-4 py-3 text-sm text-warn-ink">
      <p className="font-semibold">Using sample data</p>
      <p className="mt-1">
        These charts show illustrative numbers generated for the demo, not real measurements.{" "}
        {sample.note}{" "}
        <a href="/about#sample-data" className="underline underline-offset-2">
          How to switch to live data
        </a>
        .
      </p>
    </div>
  );
}
