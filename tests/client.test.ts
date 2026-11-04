import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAllRows, type EiaQuery } from "@/lib/eia/client";
import { EiaError } from "@/lib/eia/errors";

const query: EiaQuery = {
  route: "electricity/rto/region-data",
  frequency: "hourly",
  facets: { respondent: ["ERCO"], type: ["D"] },
  start: "2026-01-01T00",
};

function page(total: number, count: number) {
  const data = Array.from({ length: count }, (_, i) => ({ period: "2026-01-01T00", value: String(i) }));
  return new Response(JSON.stringify({ response: { total: String(total), data } }), { status: 200 });
}

beforeEach(() => {
  vi.stubEnv("EIA_API_KEY", "test-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("fetchAllRows", () => {
  it("throws missing-key without calling the network when no key is set", async () => {
    vi.stubEnv("EIA_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchAllRows(query)).rejects.toMatchObject({ kind: "missing-key" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps HTTP 429 to rate-limit and 403 to invalid-key", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 429 })));
    await expect(fetchAllRows(query)).rejects.toMatchObject({ kind: "rate-limit" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 403 })));
    await expect(fetchAllRows(query)).rejects.toMatchObject({ kind: "invalid-key" });
  });

  it("reports network failures and server errors as upstream", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(fetchAllRows(query)).rejects.toBeInstanceOf(EiaError);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 503 })));
    await expect(fetchAllRows(query)).rejects.toMatchObject({ kind: "upstream" });
  });

  it("pages through all rows using offsets", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(page(7000, 5000))
      .mockResolvedValueOnce(page(7000, 2000));
    vi.stubGlobal("fetch", fetchMock);
    const rows = await fetchAllRows(query);
    expect(rows).toHaveLength(7000);
    const urls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(urls[0]).toContain("offset=0");
    expect(urls[1]).toContain("offset=5000");
    expect(urls[0]).toContain("facets%5Brespondent%5D%5B%5D=ERCO");
  });
});
