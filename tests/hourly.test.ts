import { describe, expect, it } from "vitest";
import { hourOfDayAverages, netLoadMw, seasonOf, type PatternSample } from "@/lib/analysis";

const sample = (t: number, demandMw: number | null, solarMw: number | null): PatternSample => ({
  t,
  demandMw,
  solarMw,
  windMw: 0,
  gasMw: 0,
});

describe("seasonOf", () => {
  it("maps months to seasons", () => {
    expect(seasonOf(7)).toBe("summer");
    expect(seasonOf(1)).toBe("winter");
    expect(seasonOf(12)).toBe("winter");
    expect(seasonOf(4)).toBeNull();
  });
});

describe("hourOfDayAverages", () => {
  it("averages by Central Time hour within the season", () => {
    const noonCdt1 = Date.UTC(2026, 6, 1, 17);
    const noonCdt2 = Date.UTC(2026, 6, 2, 17);
    const winterNoon = Date.UTC(2026, 0, 10, 18);
    const result = hourOfDayAverages(
      [sample(noonCdt1, 100, 10), sample(noonCdt2, 200, 30), sample(winterNoon, 999, 999)],
      "summer",
    );
    expect(result.days).toBe(2);
    expect(result.hours).toHaveLength(24);
    expect(result.hours[12]?.demandMw).toBe(150);
    expect(result.hours[12]?.solarMw).toBe(20);
  });

  it("skips missing readings instead of treating them as zero", () => {
    const a = Date.UTC(2026, 6, 1, 17);
    const b = Date.UTC(2026, 6, 2, 17);
    const result = hourOfDayAverages([sample(a, 100, null), sample(b, 300, null)], "summer");
    expect(result.hours[12]?.demandMw).toBe(200);
    expect(result.hours[12]?.solarMw).toBe(0);
  });
});

describe("netLoadMw", () => {
  it("subtracts wind and solar from demand", () => {
    expect(netLoadMw({ hour: 12, demandMw: 70, windMw: 10, solarMw: 25, gasMw: 0 })).toBe(35);
  });
});
