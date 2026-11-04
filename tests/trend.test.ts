import { describe, expect, it } from "vitest";
import { compoundAnnualGrowth, linearTrend } from "@/lib/analysis";

describe("linearTrend", () => {
  it("fits a perfect line", () => {
    const line = linearTrend([
      { x: 2020, y: 10 },
      { x: 2021, y: 12 },
      { x: 2022, y: 14 },
    ]);
    expect(line?.slope).toBeCloseTo(2);
    expect((line?.slope ?? 0) * 2023 + (line?.intercept ?? 0)).toBeCloseTo(16);
  });

  it("needs two distinct x values", () => {
    expect(linearTrend([{ x: 1, y: 1 }])).toBeNull();
    expect(linearTrend([{ x: 1, y: 1 }, { x: 1, y: 2 }])).toBeNull();
  });
});

describe("compoundAnnualGrowth", () => {
  it("computes CAGR", () => {
    expect(compoundAnnualGrowth(100, 121, 2)).toBeCloseTo(0.1);
  });

  it("rejects non-positive inputs", () => {
    expect(compoundAnnualGrowth(0, 10, 2)).toBeNull();
    expect(compoundAnnualGrowth(10, 20, 0)).toBeNull();
  });
});
