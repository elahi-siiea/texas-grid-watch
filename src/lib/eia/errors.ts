export type EiaErrorKind = "missing-key" | "invalid-key" | "rate-limit" | "upstream" | "no-data";

export class EiaError extends Error {
  constructor(
    readonly kind: EiaErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "EiaError";
  }
}

/** Plain-language reason shown next to the "Using sample data" label. */
export function describeFallback(error: unknown): string {
  if (error instanceof EiaError) {
    switch (error.kind) {
      case "missing-key":
        return "No EIA API key is configured.";
      case "invalid-key":
        return "The EIA API rejected the configured key.";
      case "rate-limit":
        return "The EIA API rate limit was reached. Live data will be retried shortly.";
      case "no-data":
        return "The EIA API returned no data for this request.";
      case "upstream":
        return "The EIA API is not responding right now. Live data will be retried shortly.";
    }
  }
  return "Live data could not be loaded.";
}
