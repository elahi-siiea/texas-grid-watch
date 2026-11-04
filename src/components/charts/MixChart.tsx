"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FUEL_COLORS, FUEL_LABELS } from "@/lib/fuels";
import { formatMw, formatPercent } from "@/lib/format";
import type { FuelGroup, HourlyPoint } from "@/lib/types";
import { formatTick, formatTooltipTime, timeTicks, type Range } from "./DemandChart";
import { AXIS_TICK, GRID_STROKE, TooltipBox } from "./shared";

export type MixMode = "mw" | "share";

/** Bottom to top: steady plants first, then flexible gas, then weather-driven wind and solar. */
export const STACK_ORDER: readonly FuelGroup[] = ["nuclear", "coal", "gas", "other", "wind", "solar"];

export function MixChart({
  points,
  range,
  mode,
}: {
  points: readonly HourlyPoint[];
  range: Range;
  mode: MixMode;
}) {
  const data = points.map((p) => ({
    t: p.t,
    ...Object.fromEntries(STACK_ORDER.map((g) => [g, p.mix ? Math.max(0, p.mix[g]) : null])),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} stackOffset={mode === "share" ? "expand" : "none"} margin={{ top: 8, right: 12, bottom: 24, left: 0 }}>
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
          tickFormatter={(v: number) => (mode === "share" ? `${Math.round(v * 100)}%` : (v / 1000).toFixed(0))}
          tick={AXIS_TICK}
          stroke={GRID_STROKE}
          width={44}
          label={{
            value: mode === "share" ? "Share of generation" : "Generation (GW)",
            angle: -90,
            position: "insideLeft",
            fill: "var(--ink-soft)",
            fontSize: 12,
          }}
        />
        <Tooltip
          content={(p) => {
            const total = (p.payload ?? []).reduce((s, e) => s + (typeof e.value === "number" ? e.value : 0), 0);
            return (
              <TooltipBox
                active={p.active}
                payload={[...(p.payload ?? [])].reverse()}
                title={typeof p.label === "number" ? formatTooltipTime(p.label) : undefined}
                format={(e) =>
                  typeof e.value === "number"
                    ? `${formatMw(e.value)} (${formatPercent(total > 0 ? e.value / total : 0)})`
                    : "No data"
                }
              />
            );
          }}
        />
        {STACK_ORDER.map((g) => (
          <Area
            key={g}
            type="monotone"
            dataKey={g}
            name={FUEL_LABELS[g]}
            stackId="mix"
            stroke={FUEL_COLORS[g]}
            fill={FUEL_COLORS[g]}
            fillOpacity={0.9}
            strokeWidth={0}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
