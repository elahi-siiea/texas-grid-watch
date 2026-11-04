import { toHourPeriod } from "../time";
import type { FuelMix } from "../types";
import { fetchAllRows } from "./client";
import { rowsToDailyMix, rowsToHourlyDemand, rowsToHourlyMix } from "./parse";

const ERCOT = "ERCO";

/** Hourly demand for ERCOT: electricity/rto/region-data, type D (demand). */
export async function fetchHourlyDemand(startMs: number, endMs?: number): Promise<Map<number, number>> {
  const rows = await fetchAllRows({
    route: "electricity/rto/region-data",
    frequency: "hourly",
    facets: { respondent: [ERCOT], type: ["D"] },
    start: toHourPeriod(startMs),
    end: endMs === undefined ? undefined : toHourPeriod(endMs),
  });
  return rowsToHourlyDemand(rows);
}

/** Hourly net generation by fuel for ERCOT: electricity/rto/fuel-type-data. */
export async function fetchHourlyMix(
  startMs: number,
  fuelCodes?: readonly string[],
): Promise<Map<number, FuelMix>> {
  const rows = await fetchAllRows({
    route: "electricity/rto/fuel-type-data",
    frequency: "hourly",
    facets: { respondent: [ERCOT], ...(fuelCodes ? { fueltype: fuelCodes } : {}) },
    start: toHourPeriod(startMs),
  });
  return rowsToHourlyMix(rows);
}

/** Daily net generation by fuel for ERCOT, with days cut at Central Time midnight. */
export async function fetchDailyMix(startDate: string): Promise<Map<string, FuelMix>> {
  const rows = await fetchAllRows({
    route: "electricity/rto/daily-fuel-type-data",
    frequency: "daily",
    facets: { respondent: [ERCOT], timezone: ["Central"] },
    start: startDate,
  });
  return rowsToDailyMix(rows);
}
