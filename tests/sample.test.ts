import { describe, expect, it } from "vitest";
import { mergeDaily, summarizeDemandByDay, summarizeYears, sumMixByDay } from "@/lib/analysis";
import { sampleDemandMap, sampleHourly, sampleMixMap } from "@/lib/sample/generate";

describe("sample data", () => {
  const points = sampleHourly();
  const days = mergeDaily(summarizeDemandByDay(sampleDemandMap(points)), sumMixByDay(sampleMixMap(points)));

  it("is deterministic", () => {
    expect(sampleHourly()[1000]?.demandMw).toBe(points[1000]?.demandMw);
  });

  it("produces one full year-summary per year with complete years before the last", () => {
    const years = summarizeYears(days);
    expect(years[0]?.year).toBe(2019);
    expect(years.slice(0, -1).every((y) => y.complete)).toBe(true);
  });

  it("never reports negative generation", () => {
    expect(points.every((p) => p.mix && Object.values(p.mix).every((v) => v >= 0))).toBe(true);
  });
});
