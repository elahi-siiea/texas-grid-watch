import { FUEL_GROUPS, type FuelMix } from "../types";
import { emptyMix } from "../fuels";

/**
 * Sum of generation counting only positive values. Batteries report negative
 * output while charging, which would otherwise shrink the total.
 */
export function totalGeneration(mix: FuelMix): number {
  let total = 0;
  for (const g of FUEL_GROUPS) total += Math.max(0, mix[g]);
  return total;
}

/** Each fuel's fraction of total generation (0 to 1), or null when there is no generation. */
export function fuelShares(mix: FuelMix): FuelMix | null {
  const total = totalGeneration(mix);
  if (total <= 0) return null;
  const shares = emptyMix();
  for (const g of FUEL_GROUPS) shares[g] = Math.max(0, mix[g]) / total;
  return shares;
}

/** Wind plus solar. Hydro is small in ERCOT and sits in "other", so it is not counted. */
export function renewableShare(mix: FuelMix): number | null {
  const shares = fuelShares(mix);
  return shares ? shares.wind + shares.solar : null;
}
