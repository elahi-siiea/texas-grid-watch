import { centralParts } from "../time";
import type { DailyPoint, HourlyPoint } from "../types";

export interface Peak {
  mw: number;
  at: number;
}

export function findPeak(points: readonly HourlyPoint[]): Peak | null {
  let best: Peak | null = null;
  for (const p of points) {
    if (p.demandMw === null) continue;
    if (best === null || p.demandMw > best.mw) best = { mw: p.demandMw, at: p.t };
  }
  return best;
}

/** Highest hour on one Central Time calendar date. */
export function peakOnDate(points: readonly HourlyPoint[], dateKey: string): Peak | null {
  return findPeak(points.filter((p) => centralParts(p.t).dateKey === dateKey));
}

export function allTimePeak(days: readonly DailyPoint[]): Peak | null {
  let best: Peak | null = null;
  for (const d of days) {
    if (best === null || d.peakMw > best.mw) best = { mw: d.peakMw, at: d.peakAt };
  }
  return best;
}
