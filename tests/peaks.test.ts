import { describe, expect, it } from "vitest";
import { allTimePeak, findPeak, peakOnDate } from "@/lib/analysis";
import type { DailyPoint, HourlyPoint } from "@/lib/types";

const point = (t: number, demandMw: number | null): HourlyPoint => ({ t, demandMw, mix: null });

describe("findPeak", () => {
  it("finds the highest hour and when it happened", () => {
    const peak = findPeak([point(1, 100), point(2, 300), point(3, 200)]);
    expect(peak).toEqual({ mw: 300, at: 2 });
  });

  it("skips missing readings", () => {
    expect(findPeak([point(1, null), point(2, 50)])).toEqual({ mw: 50, at: 2 });
  });

  it("returns null for empty or all-missing input", () => {
    expect(findPeak([])).toBeNull();
    expect(findPeak([point(1, null)])).toBeNull();
  });
});

describe("peakOnDate", () => {
  it("only considers hours on that Central Time date", () => {
    const lateEvening = Date.UTC(2026, 6, 15, 3);
    const nextDayNoon = Date.UTC(2026, 6, 15, 17);
    const points = [point(lateEvening, 900), point(nextDayNoon, 400)];
    expect(peakOnDate(points, "2026-07-15")).toEqual({ mw: 400, at: nextDayNoon });
    expect(peakOnDate(points, "2026-07-14")).toEqual({ mw: 900, at: lateEvening });
  });
});

describe("allTimePeak", () => {
  it("picks the highest daily peak", () => {
    const mixMwh = { gas: 0, wind: 0, solar: 0, nuclear: 0, coal: 0, other: 0 };
    const days: DailyPoint[] = [
      { date: "2025-08-01", demandMwh: 1, peakMw: 80_000, peakAt: 10, mixMwh },
      { date: "2025-08-02", demandMwh: 1, peakMw: 85_000, peakAt: 20, mixMwh },
    ];
    expect(allTimePeak(days)).toEqual({ mw: 85_000, at: 20 });
    expect(allTimePeak([])).toBeNull();
  });
});
