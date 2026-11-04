import { centralParts } from "../time";
import type { FuelMix, HourlyPoint } from "../types";

/** The sample ends here so its dates are stable and clearly not "now". */
export const SAMPLE_END = Date.UTC(2026, 9, 31, 23);
export const SAMPLE_START = Date.UTC(2019, 0, 1, 6);

const HOUR_MS = 3_600_000;
const YEAR_MS = 365.25 * 24 * HOUR_MS;

function noise(n: number): number {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * One synthetic hour. The shapes are plausible (solar at midday, wind at night,
 * gas filling the gap) but the numbers are invented for the demo, not measured.
 */
export function syntheticHour(t: number): { demandMw: number; mix: FuelMix } {
  const { hour, month, day } = centralParts(t);
  const years = (t - SAMPLE_START) / YEAR_MS;
  const dayOfYear = (month - 1) * 30.4 + day;

  const seasonal = 1 + 0.24 * Math.cos((2 * Math.PI * (dayOfYear - 205)) / 365);
  const diurnal = 1 + 0.2 * Math.sin((2 * Math.PI * (hour - 11)) / 24);
  const dayNoise = noise(Math.floor(t / (24 * HOUR_MS)) * 7.1);
  const demandMw = 36_000 * 1.035 ** years * seasonal * diurnal * (0.96 + 0.08 * dayNoise);

  const dayLength = 12 + 2.5 * Math.cos((2 * Math.PI * (dayOfYear - 172)) / 365);
  const x = (hour + 0.5 - (13.2 - dayLength / 2)) / dayLength;
  const sun = x > 0 && x < 1 ? Math.sin(Math.PI * x) ** 1.3 : 0;
  const cloud = 0.7 + 0.3 * noise(Math.floor(t / (24 * HOUR_MS)) * 3.3);
  const solar = (1_800 + 3_400 * years) * sun * cloud;

  const windFactor = clamp(
    0.32 +
      0.12 * Math.cos((2 * Math.PI * (hour - 2)) / 24) +
      0.08 * Math.cos((2 * Math.PI * (dayOfYear - 100)) / 365) +
      0.35 * (noise(Math.floor(t / (24 * HOUR_MS)) * 5.7) - 0.5),
    0.03,
    0.9,
  );
  const wind = (16_000 + 1_900 * years) * windFactor;

  const nuclear = 5_100;
  const coal = Math.max(4_000, 11_000 - 700 * years) * (0.85 + 0.15 * seasonal);
  const other = 800 + 600 * years;
  const gas = Math.max(6_000, demandMw - wind - solar - nuclear - coal - other);

  return { demandMw, mix: { gas, wind, solar, nuclear, coal, other } };
}

let cached: HourlyPoint[] | null = null;

/** Every hour of the sample period. Built once per server instance. */
export function sampleHourly(): HourlyPoint[] {
  if (cached) return cached;
  const points: HourlyPoint[] = [];
  for (let t = SAMPLE_START; t <= SAMPLE_END; t += HOUR_MS) {
    const { demandMw, mix } = syntheticHour(t);
    points.push({ t, demandMw, mix });
  }
  cached = points;
  return points;
}

export function sampleDemandMap(points: readonly HourlyPoint[]): Map<number, number> {
  const out = new Map<number, number>();
  for (const p of points) if (p.demandMw !== null) out.set(p.t, p.demandMw);
  return out;
}

export function sampleMixMap(points: readonly HourlyPoint[]): Map<number, FuelMix> {
  const out = new Map<number, FuelMix>();
  for (const p of points) if (p.mix) out.set(p.t, p.mix);
  return out;
}
