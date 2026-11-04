import { centralParts } from "../time";
import type { FuelMix, HourOfDay, Season, SeasonPattern } from "../types";

export interface PatternSample {
  t: number;
  demandMw: number | null;
  solarMw: number | null;
  windMw: number | null;
  gasMw: number | null;
}

export const SEASON_MONTHS: Record<Season, readonly number[]> = {
  summer: [6, 7, 8],
  winter: [12, 1, 2],
};

export function seasonOf(month: number): Season | null {
  if (SEASON_MONTHS.summer.includes(month)) return "summer";
  if (SEASON_MONTHS.winter.includes(month)) return "winter";
  return null;
}

type Metric = "demandMw" | "solarMw" | "windMw" | "gasMw";
const METRICS: readonly Metric[] = ["demandMw", "solarMw", "windMw", "gasMw"];

/**
 * Average each metric by Central Time hour of day over the samples that fall
 * in the season. Missing readings are skipped rather than counted as zero.
 */
export function hourOfDayAverages(samples: readonly PatternSample[], season: Season): SeasonPattern {
  const sums = Array.from({ length: 24 }, () => ({ demandMw: 0, solarMw: 0, windMw: 0, gasMw: 0 }));
  const counts = Array.from({ length: 24 }, () => ({ demandMw: 0, solarMw: 0, windMw: 0, gasMw: 0 }));
  const dates = new Set<string>();

  for (const s of samples) {
    const parts = centralParts(s.t);
    if (seasonOf(parts.month) !== season) continue;
    dates.add(parts.dateKey);
    const sum = sums[parts.hour];
    const count = counts[parts.hour];
    if (!sum || !count) continue;
    for (const m of METRICS) {
      const v = s[m];
      if (v === null) continue;
      sum[m] += v;
      count[m] += 1;
    }
  }

  const hours: HourOfDay[] = sums.map((sum, hour) => {
    const count = counts[hour];
    const avg = (m: Metric) => (count && count[m] > 0 ? sum[m] / count[m] : 0);
    return {
      hour,
      demandMw: avg("demandMw"),
      solarMw: avg("solarMw"),
      windMw: avg("windMw"),
      gasMw: avg("gasMw"),
    };
  });

  return { days: dates.size, hours };
}

/** Demand left after wind and solar: the load that other plants and batteries must cover. */
export function netLoadMw(h: HourOfDay): number {
  return h.demandMw - h.windMw - h.solarMw;
}

export function toPatternSamples(
  demand: ReadonlyMap<number, number>,
  mix: ReadonlyMap<number, FuelMix>,
): PatternSample[] {
  const times = new Set<number>([...demand.keys(), ...mix.keys()]);
  return [...times].map((t) => {
    const m = mix.get(t);
    return {
      t,
      demandMw: demand.get(t) ?? null,
      solarMw: m ? m.solar : null,
      windMw: m ? m.wind : null,
      gasMw: m ? m.gas : null,
    };
  });
}
