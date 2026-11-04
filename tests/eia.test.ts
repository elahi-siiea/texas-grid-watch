import { describe, expect, it } from "vitest";
import { fuelGroupOf } from "@/lib/fuels";
import { rowsToDailyMix, rowsToHourlyDemand, rowsToHourlyMix, toNumber } from "@/lib/eia/parse";
import { describeFallback, EiaError } from "@/lib/eia/errors";

describe("toNumber", () => {
  it("parses numeric strings and rejects junk", () => {
    expect(toNumber("12.5")).toBe(12.5);
    expect(toNumber(null)).toBeNull();
    expect(toNumber("")).toBeNull();
    expect(toNumber("abc")).toBeNull();
  });
});

describe("fuelGroupOf", () => {
  it("maps known EIA codes and sends the rest to other", () => {
    expect(fuelGroupOf("NG")).toBe("gas");
    expect(fuelGroupOf("WND")).toBe("wind");
    expect(fuelGroupOf("SUN")).toBe("solar");
    expect(fuelGroupOf("WAT")).toBe("other");
    expect(fuelGroupOf("BAT")).toBe("other");
  });
});

describe("row parsers", () => {
  it("builds hourly demand and ignores malformed rows", () => {
    const map = rowsToHourlyDemand([
      { period: "2026-11-04T15", value: "50000" },
      { period: "bad", value: "1" },
      { period: "2026-11-04T16", value: null },
    ]);
    expect([...map.entries()]).toEqual([[Date.UTC(2026, 10, 4, 15), 50000]]);
  });

  it("sums fuels that share a group", () => {
    const map = rowsToHourlyMix([
      { period: "2026-11-04T15", fueltype: "WAT", value: "100" },
      { period: "2026-11-04T15", fueltype: "OTH", value: "50" },
      { period: "2026-11-04T15", fueltype: "NG", value: "9000" },
    ]);
    const mix = map.get(Date.UTC(2026, 10, 4, 15));
    expect(mix?.other).toBe(150);
    expect(mix?.gas).toBe(9000);
  });

  it("keys daily rows by date", () => {
    const map = rowsToDailyMix([{ period: "2026-11-03", fueltype: "SUN", value: "1234" }]);
    expect(map.get("2026-11-03")?.solar).toBe(1234);
  });
});

describe("describeFallback", () => {
  it("explains each failure in plain language", () => {
    expect(describeFallback(new EiaError("missing-key", "x"))).toMatch(/No EIA API key/);
    expect(describeFallback(new EiaError("rate-limit", "x"))).toMatch(/rate limit/);
    expect(describeFallback(new Error("boom"))).toMatch(/could not be loaded/);
  });
});
