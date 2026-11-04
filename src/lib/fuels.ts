import { FUEL_GROUPS, type FuelGroup, type FuelMix } from "./types";

export const FUEL_LABELS: Record<FuelGroup, string> = {
  gas: "Natural gas",
  wind: "Wind",
  solar: "Solar",
  nuclear: "Nuclear",
  coal: "Coal",
  other: "Battery & other",
};

/** CSS variables defined in globals.css, so charts and legends share one palette. */
export const FUEL_COLORS: Record<FuelGroup, string> = {
  gas: "var(--fuel-gas)",
  wind: "var(--fuel-wind)",
  solar: "var(--fuel-solar)",
  nuclear: "var(--fuel-nuclear)",
  coal: "var(--fuel-coal)",
  other: "var(--fuel-other)",
};

export const RENEWABLES_COLOR = "var(--renewables)";

const EIA_CODE_TO_GROUP: Record<string, FuelGroup> = {
  NG: "gas",
  WND: "wind",
  WNB: "wind",
  SUN: "solar",
  SNB: "solar",
  NUC: "nuclear",
  COL: "coal",
};

/** WNB and SNB are wind and solar with integrated batteries. Hydro, oil, batteries and anything EIA adds later land in "other". */
export function fuelGroupOf(eiaCode: string): FuelGroup {
  return EIA_CODE_TO_GROUP[eiaCode] ?? "other";
}

export function emptyMix(): FuelMix {
  return { gas: 0, wind: 0, solar: 0, nuclear: 0, coal: 0, other: 0 };
}

export function addMix(a: FuelMix, b: FuelMix): FuelMix {
  const out = emptyMix();
  for (const g of FUEL_GROUPS) out[g] = a[g] + b[g];
  return out;
}
