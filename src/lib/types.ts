export const FUEL_GROUPS = ["gas", "wind", "solar", "nuclear", "coal", "other"] as const;

export type FuelGroup = (typeof FUEL_GROUPS)[number];

/** Generation by fuel group. Hourly values are MW, daily values are MWh. */
export type FuelMix = Record<FuelGroup, number>;

export type Season = "summer" | "winter";

export type DataSource = "eia" | "sample";

export interface DataMeta {
  source: DataSource;
  /** ISO timestamp of when this payload was built. */
  updatedAt: string;
  /** First and last observation, as ISO timestamps. */
  coverage: { start: string; end: string };
  /** Why sample data is in use, when it is. */
  note?: string;
}

export interface HourlyPoint {
  /** Start of the hour, milliseconds since epoch (UTC). */
  t: number;
  /** Demand in MW (EIA reports MWh for a one-hour period, numerically the same). */
  demandMw: number | null;
  mix: FuelMix | null;
}

export interface DailyPoint {
  /** Central Time calendar date, YYYY-MM-DD. */
  date: string;
  demandMwh: number;
  peakMw: number;
  peakAt: number;
  mixMwh: FuelMix;
}

export interface HourOfDay {
  hour: number;
  demandMw: number;
  solarMw: number;
  windMw: number;
  gasMw: number;
}

export interface SeasonPattern {
  /** Number of Central Time dates that contributed. */
  days: number;
  hours: HourOfDay[];
}

export interface RecentPayload {
  meta: DataMeta;
  hourly: HourlyPoint[];
}

export interface HistoryPayload {
  meta: DataMeta;
  days: DailyPoint[];
}

export interface PatternsPayload {
  meta: DataMeta;
  seasons: Record<Season, SeasonPattern>;
}

export interface YearSummary {
  year: number;
  dayCount: number;
  /** False for years with too many missing days to compare fairly. */
  complete: boolean;
  demandTwh: number;
  peakMw: number;
  peakAt: number;
  mixTwh: FuelMix;
  shares: FuelMix | null;
}
