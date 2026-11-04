import { EiaError } from "./errors";

const BASE_URL = "https://api.eia.gov/v2";
const PAGE_SIZE = 5000;
const CONCURRENCY = 4;
const TIMEOUT_MS = 25_000;

export interface EiaRow {
  period: string;
  value: string | number | null;
  fueltype?: string;
  [key: string]: unknown;
}

export interface EiaQuery {
  route: string;
  frequency: "hourly" | "daily";
  facets: Record<string, readonly string[]>;
  start: string;
  end?: string;
}

interface EiaResponse {
  response?: { total?: string | number; data?: EiaRow[] };
}

function buildUrl(query: EiaQuery, offset: number, apiKey: string): string {
  const params = new URLSearchParams();
  params.set("frequency", query.frequency);
  params.append("data[0]", "value");
  for (const [name, values] of Object.entries(query.facets)) {
    for (const v of values) params.append(`facets[${name}][]`, v);
  }
  params.set("start", query.start);
  if (query.end) params.set("end", query.end);
  params.set("sort[0][column]", "period");
  params.set("sort[0][direction]", "asc");
  params.set("offset", String(offset));
  params.set("length", String(PAGE_SIZE));
  params.set("api_key", apiKey);
  return `${BASE_URL}/${query.route}/data/?${params.toString()}`;
}

async function fetchPage(query: EiaQuery, offset: number, apiKey: string) {
  let res: Response;
  try {
    res = await fetch(buildUrl(query, offset, apiKey), {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new EiaError("upstream", "The EIA API did not respond.");
  }
  if (res.status === 429) throw new EiaError("rate-limit", "EIA rate limit reached.");
  if (res.status === 403 || res.status === 401) throw new EiaError("invalid-key", "EIA rejected the API key.");
  if (!res.ok) throw new EiaError("upstream", `EIA responded with HTTP ${res.status}.`);
  let body: EiaResponse;
  try {
    body = (await res.json()) as EiaResponse;
  } catch {
    throw new EiaError("upstream", "EIA returned a response that is not valid JSON.");
  }
  return {
    total: Number(body.response?.total ?? 0),
    rows: body.response?.data ?? [],
  };
}

/** Fetch every page of a query. The first page reports the total so the rest can run in parallel. */
export async function fetchAllRows(query: EiaQuery): Promise<EiaRow[]> {
  const apiKey = process.env.EIA_API_KEY?.trim();
  if (!apiKey) throw new EiaError("missing-key", "EIA_API_KEY is not set.");

  const first = await fetchPage(query, 0, apiKey);
  const rows = [...first.rows];
  const offsets: number[] = [];
  for (let offset = PAGE_SIZE; offset < first.total; offset += PAGE_SIZE) offsets.push(offset);

  for (let i = 0; i < offsets.length; i += CONCURRENCY) {
    const batch = offsets.slice(i, i + CONCURRENCY);
    const pages = await Promise.all(batch.map((o) => fetchPage(query, o, apiKey)));
    for (const page of pages) rows.push(...page.rows);
  }
  return rows;
}
