import { describe, expect, it } from "vitest";
import {
  buildHourly,
  mergeDaily,
  summarizeDemandByDay,
  summarizeYears,
  sumMixByDay,
} from "@/lib/analysis";
import type { DailyPoint, FuelMix } from "@/lib/types";

const H = 3_600_000;
const mix = (over: Partial<FuelMix>): FuelMix => ({
  gas: 0,
  wind: 0,
  solar: 0,
  nuclear: 0,
  coal: 0,
  other: 0,
  ...over,
});

describe("summarizeDemandByDay", () => {
  it("sums MWh and tracks the peak hour per Central Time day", () => {
    const start = Date.UTC(2026, 0, 15, 6);
    const demand = new Map<number, number>([
      [start, 100],
      [start + H, 300],
      [start + 2 * H, 200],
      [start + 24 * H, 50],
    ]);
    const days = summarizeDemandByDay(demand);
    expect(days).toHaveLength(2);
    expect(days[0]).toMatchObject({ date: "2026-01-15", demandMwh: 600, peakMw: 300, peakAt: start + H, hours: 3 });
    expect(days[1]).toMatchObject({ date: "2026-01-16", hours: 1 });
  });
});

describe("sumMixByDay + mergeDaily", () => {
  it("drops days with too few demand hours or no generation data", () => {
    const start = Date.UTC(2026, 0, 15, 6);
    const demand = new Map<number, number>();
    const gen = new Map<number, FuelMix>();
    for (let h = 0; h < 24; h++) {
      demand.set(start + h * H, 1000);
      gen.set(start + h * H, mix({ gas: 600, wind: 400 }));
    }
    demand.set(start + 24 * H, 1000);
    gen.set(start + 24 * H, mix({ gas: 1 }));

    const merged = mergeDaily(summarizeDemandByDay(demand), sumMixByDay(gen));
    expect(merged).toHaveLength(1);
    expect(merged[0]?.demandMwh).toBe(24_000);
    expect(merged[0]?.mixMwh.wind).toBe(9_600);
  });
});

describe("summarizeYears", () => {
  const day = (date: string, peakMw: number): DailyPoint => ({
    date,
    demandMwh: 1_000_000,
    peakMw,
    peakAt: Date.parse(`${date}T18:00:00Z`),
    mixMwh: mix({ gas: 600_000, solar: 400_000 }),
  });

  it("converts to TWh, finds the yearly peak and computes shares", () => {
    const [summary] = summarizeYears([day("2024-07-01", 80_000), day("2024-07-02", 90_000)]);
    expect(summary?.year).toBe(2024);
    expect(summary?.demandTwh).toBeCloseTo(2);
    expect(summary?.peakMw).toBe(90_000);
    expect(summary?.mixTwh.solar).toBeCloseTo(0.8);
    expect(summary?.shares?.solar).toBeCloseTo(0.4);
  });

  it("flags years with too few days as incomplete", () => {
    const [summary] = summarizeYears([day("2024-07-01", 80_000)]);
    expect(summary?.complete).toBe(false);
  });

  it("marks a nearly full year complete", () => {
    const days: DailyPoint[] = [];
    for (let i = 0; i < 360; i++) days.push(day(`2023-${String(1 + Math.floor(i / 30)).padStart(2, "0")}-${String(1 + (i % 30)).padStart(2, "0")}`, 70_000));
    expect(summarizeYears(days)[0]?.complete).toBe(true);
  });
});

describe("buildHourly", () => {
  it("keeps the most recent window and leaves gaps as null", () => {
    const demand = new Map([[0, 10], [H, 11], [2 * H, 12], [3 * H, 13]]);
    const gen = new Map([[3 * H, mix({ gas: 5 })]]);
    const out = buildHourly(demand, gen, 2);
    expect(out.map((p) => p.t)).toEqual([2 * H, 3 * H]);
    expect(out[0]?.mix).toBeNull();
    expect(out[1]?.mix?.gas).toBe(5);
  });

  it("returns nothing when both series are empty", () => {
    expect(buildHourly(new Map(), new Map(), 24)).toEqual([]);
  });
});
