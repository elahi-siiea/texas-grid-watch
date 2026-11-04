import { Skeleton } from "./Skeleton";

export function StatCard({
  label,
  value,
  detail,
  status,
}: {
  label: React.ReactNode;
  value?: string;
  detail?: string;
  status: "loading" | "error" | "ready";
}) {
  return (
    <div className="border-t-2 border-ink pt-3">
      <p className="text-sm font-medium text-soft">{label}</p>
      {status === "loading" ? (
        <div role="status" aria-live="polite" className="mt-2">
          <span className="sr-only">Loading</span>
          <Skeleton className="h-9 w-32" />
          <Skeleton className="mt-2 h-4 w-40" />
        </div>
      ) : status === "error" ? (
        <p className="mt-2 text-sm text-soft">Unavailable right now.</p>
      ) : (
        <>
          <p className="num mt-1 font-serif text-3xl font-semibold leading-tight sm:text-4xl">{value ?? "No data"}</p>
          {detail && <p className="mt-1 text-xs text-soft">{detail}</p>}
        </>
      )}
    </div>
  );
}
