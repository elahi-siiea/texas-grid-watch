import { FUEL_GROUPS, type DailyPoint, type FuelMix, type HourlyPoint, type YearSummary } from "../types";
import { addMix, emptyMix } from "../fuels";
import { centralParts } from "../time";
import { fuelShares } from "./shares";

/** A Central Time day has 23 to 25 hours; require nearly all of them before trusting a daily total. */
export const MIN_HOURS_PER_DAY = 22;

/** Years with fewer observed days than this are treated as partial and left out of year-to-year comparisons. */
export const MIN_DAYS_FOR_COMPLETE_YEAR = 350;

export interface DemandDay {
  date: string;
  demandMwh: number;
  peakMw: number;
  peakAt: number;
  hours: number;
}

/** Group hourly demand (MWh per hour, keyed by UTC hour start) into Central Time days. */
export function summarizeDemandByDay(demand: ReadonlyMap<number, number>): DemandDay[] {
  const days = new Map<string, DemandDay>();
  for (const [t, mwh] of demand) {
    const key = centralParts(t).dateKey;
    const day = days.get(key);
    if (!day) {
      days.set(key, { date: key, demandMwh: mwh, peakMw: mwh, peakAt: t, hours: 1 });
      continue;
    }
    day.demandMwh += mwh;
    day.hours += 1;
    if (mwh > day.peakMw) {
      day.peakMw = mwh;
      day.peakAt = t;
    }
  }
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Sum hourly generation (MW, so MWh per hour) into Central Time days. */
export function sumMixByDay(mix: ReadonlyMap<number, FuelMix>): Map<string, FuelMix> {
  const days = new Map<string, FuelMix>();
  for (const [t, m] of mix) {
    const key = centralParts(t).dateKey;
    days.set(key, addMix(days.get(key) ?? emptyMix(), m));
  }
  return days;
}

/** Keep only days that have both demand and generation, and enough hourly demand readings. */
export function mergeDaily(
  demandDays: readonly DemandDay[],
  mixByDay: ReadonlyMap<string, FuelMix>,
  minHours: number = MIN_HOURS_PER_DAY,
): DailyPoint[] {
  const out: DailyPoint[] = [];
  for (const d of demandDays) {
    const mix = mixByDay.get(d.date);
    if (!mix || d.hours < minHours) continue;
    out.push({ date: d.date, demandMwh: d.demandMwh, peakMw: d.peakMw, peakAt: d.peakAt, mixMwh: mix });
  }
  return out;
}

export function summarizeYears(days: readonly DailyPoint[]): YearSummary[] {
  const byYear = new Map<number, DailyPoint[]>();
  for (const d of days) {
    const year = Number(d.date.slice(0, 4));
    byYear.set(year, [...(byYear.get(year) ?? []), d]);
  }
  return [...byYear.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, list]) => {
      let demandMwh = 0;
      let mixMwh = emptyMix();
      let peakMw = 0;
      let peakAt = 0;
      for (const d of list) {
        demandMwh += d.demandMwh;
        mixMwh = addMix(mixMwh, d.mixMwh);
        if (d.peakMw > peakMw) {
          peakMw = d.peakMw;
          peakAt = d.peakAt;
        }
      }
      const mixTwh = emptyMix();
      for (const g of FUEL_GROUPS) mixTwh[g] = mixMwh[g] / 1_000_000;
      return {
        year,
        dayCount: list.length,
        complete: list.length >= MIN_DAYS_FOR_COMPLETE_YEAR,
        demandTwh: demandMwh / 1_000_000,
        peakMw,
        peakAt,
        mixTwh,
        shares: fuelShares(mixMwh),
      };
    });
}

const HOUR_MS = 3_600_000;

/**
 * Join hourly demand and generation on timestamp and keep the most recent
 * `hours` hours. Hours missing from one series stay as null so charts show gaps
 * instead of invented zeros.
 */
export function buildHourly(
  demand: ReadonlyMap<number, number>,
  mix: ReadonlyMap<number, FuelMix>,
  hours: number,
): HourlyPoint[] {
  const times = new Set<number>([...demand.keys(), ...mix.keys()]);
  if (times.size === 0) return [];
  const latest = Math.max(...times);
  const cutoff = latest - (hours - 1) * HOUR_MS;
  return [...times]
    .filter((t) => t >= cutoff)
    .sort((a, b) => a - b)
    .map((t) => ({ t, demandMw: demand.get(t) ?? null, mix: mix.get(t) ?? null }));
}
