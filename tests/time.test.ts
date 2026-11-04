import { describe, expect, it } from "vitest";
import { centralParts, parseHourPeriod, toHourPeriod } from "@/lib/time";

describe("parseHourPeriod", () => {
  it("parses EIA hourly periods as UTC", () => {
    expect(parseHourPeriod("2026-11-04T15")).toBe(Date.UTC(2026, 10, 4, 15));
  });

  it("rejects other formats", () => {
    expect(parseHourPeriod("2026-11-04")).toBeNull();
    expect(parseHourPeriod("nonsense")).toBeNull();
  });

  it("round-trips with toHourPeriod", () => {
    expect(toHourPeriod(Date.UTC(2025, 0, 2, 3))).toBe("2025-01-02T03");
  });
});

describe("centralParts", () => {
  it("uses UTC-6 in winter (CST)", () => {
    const p = centralParts(Date.UTC(2026, 0, 15, 6));
    expect(p).toMatchObject({ year: 2026, month: 1, day: 15, hour: 0, dateKey: "2026-01-15" });
  });

  it("uses UTC-5 in summer (CDT)", () => {
    const p = centralParts(Date.UTC(2026, 6, 15, 5));
    expect(p).toMatchObject({ hour: 0, dateKey: "2026-07-15" });
  });

  it("puts early-UTC hours on the previous Central date", () => {
    expect(centralParts(Date.UTC(2026, 6, 15, 3)).dateKey).toBe("2026-07-14");
  });

  it("handles the spring-forward day without losing or doubling an hour label", () => {
    const hours = [];
    for (let h = 0; h < 24; h++) hours.push(centralParts(Date.UTC(2026, 2, 8, 6 + h)).hour);
    expect(hours.slice(0, 3)).toEqual([0, 1, 3]);
  });
});
