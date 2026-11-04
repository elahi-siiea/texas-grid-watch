const INT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function formatMw(mw: number): string {
  return `${INT.format(Math.round(mw))} MW`;
}

export function formatGw(mw: number, digits = 1): string {
  return `${(mw / 1000).toFixed(digits)} GW`;
}

export function formatTwh(twh: number, digits = 0): string {
  return `${twh.toFixed(digits)} TWh`;
}

export function formatPercent(fraction: number, digits = 0): string {
  return `${(fraction * 100).toFixed(digits)}%`;
}

export function formatInt(n: number): string {
  return INT.format(Math.round(n));
}
