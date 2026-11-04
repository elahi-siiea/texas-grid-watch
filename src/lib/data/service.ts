import { buildHourly, hourOfDayAverages, mergeDaily, sumMixByDay, summarizeDemandByDay, toPatternSamples } from "../analysis";
import { remember } from "../cache";
import { describeFallback } from "../eia/errors";
import { fetchDailyMix, fetchHourlyDemand, fetchHourlyMix } from "../eia/queries";
import {
  SAMPLE_END,
  SAMPLE_START,
  sampleDemandMap,
  sampleHourly,
  sampleMixMap,
} from "../sample/generate";
import type {
  DataMeta,
  HistoryPayload,
  PatternsPayload,
  RecentPayload,
  Season,
  SeasonPattern,
} from "../types";

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

const RECENT_TTL_MS = HOUR_MS;
const HISTORY_TTL_MS = DAY_MS;
const FALLBACK_RETRY_MS = 5 * 60_000;

/** EIA's hourly generation-by-fuel data begins in mid-2018; a full-year start keeps year totals comparable. */
const HISTORY_START_MS = Date.UTC(2019, 0, 1, 6);
const HISTORY_START_DATE = "2019-01-01";
const PATTERN_FUEL_CODES = ["NG", "SUN", "WND"] as const;
const RECENT_HOURS = 7 * 24;

function liveMeta(start: number, end: number): DataMeta {
  return {
    source: "eia",
    updatedAt: new Date().toISOString(),
    coverage: { start: new Date(start).toISOString(), end: new Date(end).toISOString() },
  };
}

function sampleMeta(reason: string, start: number, end: number): DataMeta {
  return {
    source: "sample",
    updatedAt: new Date(SAMPLE_END).toISOString(),
    coverage: { start: new Date(start).toISOString(), end: new Date(end).toISOString() },
    note: reason,
  };
}

async function withFallback<T extends { meta: DataMeta }>(
  key: string,
  liveTtlMs: number,
  live: () => Promise<T>,
  sample: (reason: string) => T,
): Promise<T> {
  return remember(
    key,
    (value) => (value.meta.source === "eia" ? liveTtlMs : FALLBACK_RETRY_MS),
    async () => {
      try {
        return await live();
      } catch (error) {
        return sample(describeFallback(error));
      }
    },
  );
}

function buildSeasons(
  demand: ReadonlyMap<number, number>,
  mix: Parameters<typeof toPatternSamples>[1],
): Record<Season, SeasonPattern> {
  const samples = toPatternSamples(demand, mix);
  return {
    summer: hourOfDayAverages(samples, "summer"),
    winter: hourOfDayAverages(samples, "winter"),
  };
}

export function getRecent(): Promise<RecentPayload> {
  return withFallback(
    "recent",
    RECENT_TTL_MS,
    async () => {
      const start = Date.now() - 8 * DAY_MS;
      const [demand, mix] = await Promise.all([fetchHourlyDemand(start), fetchHourlyMix(start)]);
      const hourly = buildHourly(demand, mix, RECENT_HOURS);
      const first = hourly[0];
      const last = hourly[hourly.length - 1];
      if (!first || !last) throw new Error("empty");
      return { meta: liveMeta(first.t, last.t), hourly };
    },
    (reason) => {
      const all = sampleHourly();
      const hourly = all.slice(-RECENT_HOURS);
      return { meta: sampleMeta(reason, hourly[0]?.t ?? SAMPLE_START, SAMPLE_END), hourly };
    },
  );
}

export function getHistory(): Promise<HistoryPayload> {
  return withFallback(
    "history",
    HISTORY_TTL_MS,
    async () => {
      const [demand, mix] = await Promise.all([fetchHourlyDemand(HISTORY_START_MS), fetchDailyMix(HISTORY_START_DATE)]);
      const days = mergeDaily(summarizeDemandByDay(demand), mix);
      const first = days[0];
      const last = days[days.length - 1];
      if (!first || !last) throw new Error("empty");
      return {
        meta: liveMeta(Date.parse(`${first.date}T12:00:00Z`), Date.parse(`${last.date}T12:00:00Z`)),
        days,
      };
    },
    (reason) => {
      const points = sampleHourly();
      const days = mergeDaily(summarizeDemandByDay(sampleDemandMap(points)), sumMixByDay(sampleMixMap(points)));
      return { meta: sampleMeta(reason, SAMPLE_START, SAMPLE_END), days };
    },
  );
}

export function getPatterns(): Promise<PatternsPayload> {
  return withFallback(
    "patterns",
    HISTORY_TTL_MS,
    async () => {
      const start = Date.now() - 365 * DAY_MS;
      const [demand, mix] = await Promise.all([
        fetchHourlyDemand(start),
        fetchHourlyMix(start, PATTERN_FUEL_CODES),
      ]);
      if (demand.size === 0 || mix.size === 0) throw new Error("empty");
      return { meta: liveMeta(start, Date.now()), seasons: buildSeasons(demand, mix) };
    },
    (reason) => {
      const year = sampleHourly().filter((p) => p.t > SAMPLE_END - 365 * DAY_MS);
      return {
        meta: sampleMeta(reason, SAMPLE_END - 365 * DAY_MS, SAMPLE_END),
        seasons: buildSeasons(sampleDemandMap(year), sampleMixMap(year)),
      };
    },
  );
}
