import { describe, expect, it } from "vitest";
import { fuelShares, renewableShare, totalGeneration } from "@/lib/analysis";
import type { FuelMix } from "@/lib/types";

const mix = (over: Partial<FuelMix>): FuelMix => ({
  gas: 0,
  wind: 0,
  solar: 0,
  nuclear: 0,
  coal: 0,
  other: 0,
  ...over,
});

describe("fuelShares", () => {
  it("returns fractions that sum to one", () => {
    const shares = fuelShares(mix({ gas: 50, wind: 30, solar: 20 }));
    expect(shares?.gas).toBeCloseTo(0.5);
    expect(shares?.wind).toBeCloseTo(0.3);
    expect(shares?.solar).toBeCloseTo(0.2);
  });

  it("returns null when there is no generation", () => {
    expect(fuelShares(mix({}))).toBeNull();
  });

  it("ignores negative output such as battery charging", () => {
    expect(totalGeneration(mix({ gas: 90, other: -10 }))).toBe(90);
    expect(fuelShares(mix({ gas: 90, other: -10 }))?.gas).toBe(1);
  });
});

describe("renewableShare", () => {
  it("counts wind and solar only", () => {
    expect(renewableShare(mix({ gas: 40, wind: 20, solar: 20, nuclear: 10, other: 10 }))).toBeCloseTo(0.4);
  });

  it("is null without generation", () => {
    expect(renewableShare(mix({}))).toBeNull();
  });
});
