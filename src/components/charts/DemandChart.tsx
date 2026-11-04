"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMw } from "@/lib/format";
import { centralParts, formatCentral } from "@/lib/time";
import type { HourlyPoint } from "@/lib/types";
import { AXIS_TICK, GRID_STROKE, INK, TooltipBox } from "./shared";

export type Range = "24h" | "7d";

export const RANGE_HOURS: Record<Range, number> = { "24h": 24, "7d": 168 };

export function sliceRange(points: readonly HourlyPoint[], range: Range): HourlyPoint[] {
  return points.slice(-RANGE_HOURS[range]);
}

/** Tick every 4 hours for a day, every Central midnight for a week. */
export function timeTicks(points: readonly HourlyPoint[], range: Range): number[] {
  return points
    .filter((p) => {
      const hour = centralParts(p.t).hour;
      return range === "24h" ? hour % 4 === 0 : hour === 0;
    })
    .map((p) => p.t);
}

export function formatTick(t: number, range: Range): string {
  return range === "24h"
    ? formatCentral(t, { hour: "numeric" })
    : formatCentral(t, { month: "short", day: "numeric" });
}

export function formatTooltipTime(t: number): string {
  return `${formatCentral(t, { weekday: "short", month: "short", day: "numeric", hour: "numeric" })} CT`;
}

export function DemandChart({ points, range }: { points: readonly HourlyPoint[]; range: Range }) {
  const data = points.map((p) => ({ t: p.t, demand: p.demandMw }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 24, left: 0 }}>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis
          dataKey="t"
          type="number"
          scale="time"
          domain={["dataMin", "dataMax"]}
          ticks={timeTicks(points, range)}
          tickFormatter={(t: number) => formatTick(t, range)}
          tick={AXIS_TICK}
          stroke={GRID_STROKE}
          label={{
            value: range === "24h" ? "Hour of day (Central Time)" : "Date (Central Time)",
            position: "insideBottom",
            offset: -16,
            fill: "var(--ink-soft)",
            fontSize: 12,
          }}
        />
        <YAxis
          tickFormatter={(v: number) => (v / 1000).toFixed(0)}
          tick={AXIS_TICK}
          stroke={GRID_STROKE}
          domain={["auto", "auto"]}
          width={44}
          label={{ value: "Demand (GW)", angle: -90, position: "insideLeft", fill: "var(--ink-soft)", fontSize: 12 }}
        />
        <Tooltip
          content={(p) => (
            <TooltipBox
              active={p.active}
              payload={p.payload}
              title={typeof p.label === "number" ? formatTooltipTime(p.label) : undefined}
              format={(e) => (typeof e.value === "number" ? formatMw(e.value) : "No data")}
            />
          )}
        />
        <Area
          type="monotone"
          dataKey="demand"
          name="Demand"
          stroke={INK}
          strokeWidth={2}
          fill={INK}
          fillOpacity={0.08}
          connectNulls={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
