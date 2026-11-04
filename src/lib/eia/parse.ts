import { addMix, emptyMix, fuelGroupOf } from "../fuels";
import { parseHourPeriod } from "../time";
import type { FuelMix } from "../types";
import type { EiaRow } from "./client";

export function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Hourly demand keyed by UTC hour start. Rows with bad periods or values are dropped. */
export function rowsToHourlyDemand(rows: readonly EiaRow[]): Map<number, number> {
  const out = new Map<number, number>();
  for (const row of rows) {
    const t = parseHourPeriod(row.period);
    const v = toNumber(row.value);
    if (t !== null && v !== null) out.set(t, v);
  }
  return out;
}

function rowsToMixBy<K>(rows: readonly EiaRow[], keyOf: (period: string) => K | null): Map<K, FuelMix> {
  const out = new Map<K, FuelMix>();
  for (const row of rows) {
    const key = keyOf(row.period);
    const v = toNumber(row.value);
    if (key === null || v === null || !row.fueltype) continue;
    const delta = emptyMix();
    delta[fuelGroupOf(row.fueltype)] = v;
    out.set(key, addMix(out.get(key) ?? emptyMix(), delta));
  }
  return out;
}

/** Hourly generation by fuel group (MW) keyed by UTC hour start. */
export function rowsToHourlyMix(rows: readonly EiaRow[]): Map<number, FuelMix> {
  return rowsToMixBy(rows, parseHourPeriod);
}

/** Daily generation by fuel group (MWh) keyed by YYYY-MM-DD. */
export function rowsToDailyMix(rows: readonly EiaRow[]): Map<string, FuelMix> {
  return rowsToMixBy(rows, (p) => (/^\d{4}-\d{2}-\d{2}$/.test(p) ? p : null));
}
