export const GRID_TIME_ZONE = "America/Chicago";

const PARTS_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: GRID_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
});

export interface CentralParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  /** Central Time calendar date, YYYY-MM-DD. */
  dateKey: string;
}

const partsCache = new Map<number, CentralParts>();

export function centralParts(ms: number): CentralParts {
  const cached = partsCache.get(ms);
  if (cached) return cached;
  const raw: Record<string, string> = {};
  for (const p of PARTS_FORMAT.formatToParts(ms)) raw[p.type] = p.value;
  const parts: CentralParts = {
    year: Number(raw.year),
    month: Number(raw.month),
    day: Number(raw.day),
    hour: Number(raw.hour),
    dateKey: `${raw.year}-${raw.month}-${raw.day}`,
  };
  if (partsCache.size > 200_000) partsCache.clear();
  partsCache.set(ms, parts);
  return parts;
}

/** EIA hourly periods look like "2026-11-04T15" and are in UTC. */
export function parseHourPeriod(period: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2})$/.exec(period);
  if (!m) return null;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]));
}

export function toHourPeriod(ms: number): string {
  return new Date(ms).toISOString().slice(0, 13);
}

export function formatCentral(ms: number, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: GRID_TIME_ZONE, ...options }).format(ms);
}

export function formatCentralStamp(ms: number): string {
  return `${formatCentral(ms, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })} CT`;
}

export function formatDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
