"use client";

import { Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { netLoadMw } from "@/lib/analysis";
import { FUEL_COLORS, FUEL_LABELS } from "@/lib/fuels";
import { formatMw } from "@/lib/format";
import type { HourOfDay } from "@/lib/types";
import { AXIS_TICK, GRID_STROKE, INK, TooltipBox } from "./shared";

export function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

function legendText(value: string) {
  return <span style={{ color: "var(--ink)" }}>{value}</span>;
}

export function PatternChart({ hours }: { hours: readonly HourOfDay[] }) {
  const data = hours.map((h) => ({
    hour: h.hour,
    demand: h.demandMw,
    solar: h.solarMw,
    gas: h.gasMw,
    net: netLoadMw(h),
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 24, left: 0 }}>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis
          dataKey="hour"
          type="number"
          domain={[0, 23]}
          ticks={[0, 3, 6, 9, 12, 15, 18, 21]}
          tickFormatter={formatHour}
          tick={AXIS_TICK}
          stroke={GRID_STROKE}
          label={{ value: "Hour of day (Central Time)", position: "insideBottom", offset: -16, fill: "var(--ink-soft)", fontSize: 12 }}
        />
        <YAxis
          tick={AXIS_TICK}
          stroke={GRID_STROKE}
          width={44}
          tickFormatter={(v: number) => (v / 1000).toFixed(0)}
          label={{ value: "Average power (GW)", angle: -90, position: "insideLeft", fill: "var(--ink-soft)", fontSize: 12 }}
        />
        <Tooltip
          content={(p) => (
            <TooltipBox
              active={p.active}
              payload={p.payload}
              title={typeof p.label === "number" ? formatHour(p.label) : undefined}
              format={(e) => (typeof e.value === "number" ? formatMw(e.value) : "No data")}
            />
          )}
        />
        <Legend verticalAlign="top" height={44} formatter={legendText} />
        <Area dataKey="solar" name={FUEL_LABELS.solar} stroke={FUEL_COLORS.solar} fill={FUEL_COLORS.solar} fillOpacity={0.35} strokeWidth={2} isAnimationActive={false} />
        <Line dataKey="demand" name="Demand" stroke={INK} strokeWidth={2.5} dot={false} isAnimationActive={false} />
        <Line dataKey="net" name="Net load (demand minus wind and solar)" stroke="var(--accent)" strokeWidth={2.5} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
        <Line dataKey="gas" name={FUEL_LABELS.gas} stroke={FUEL_COLORS.gas} strokeWidth={2.5} dot={false} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
