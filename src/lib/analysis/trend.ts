export interface TrendLine {
  slope: number;
  intercept: number;
}

/** Ordinary least-squares line through (x, y) points. Needs at least two distinct x values. */
export function linearTrend(points: readonly { x: number; y: number }[]): TrendLine | null {
  const n = points.length;
  if (n < 2) return null;
  const meanX = points.reduce((s, p) => s + p.x, 0) / n;
  const meanY = points.reduce((s, p) => s + p.y, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of points) {
    num += (p.x - meanX) * (p.y - meanY);
    den += (p.x - meanX) ** 2;
  }
  if (den === 0) return null;
  const slope = num / den;
  return { slope, intercept: meanY - slope * meanX };
}

/** Compound annual growth rate between two values, as a fraction (0.03 is 3%). */
export function compoundAnnualGrowth(first: number, last: number, years: number): number | null {
  if (first <= 0 || last <= 0 || years <= 0) return null;
  return (last / first) ** (1 / years) - 1;
}
