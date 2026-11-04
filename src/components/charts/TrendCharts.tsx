"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FUEL_COLORS, FUEL_LABELS, RENEWABLES_COLOR } from "@/lib/fuels";
import { formatGw, formatPercent, formatTwh } from "@/lib/format";
import type { YearSummary } from "@/lib/types";
import { AXIS_TICK, GRID_STROKE, TooltipBox } from "./shared";

function legendText(value: string) {
  return <span style={{ color: "var(--ink)" }}>{value}</span>;
}

const MARGIN = { top: 8, right: 12, bottom: 24, left: 0 };

function yearAxis() {
  return (
    <XAxis
      dataKey="year"
      tick={AXIS_TICK}
      stroke={GRID_STROKE}
      label={{ value: "Year", position: "insideBottom", offset: -16, fill: "var(--ink-soft)", fontSize: 12 }}
    />
  );
}

function yAxisLabel(value: string) {
  return { value, angle: -90, position: "insideLeft", fill: "var(--ink-soft)", fontSize: 12 } as const;
}

export function SolarWindChart({ years }: { years: readonly YearSummary[] }) {
  const data = years.map((y) => ({ year: y.year, solar: y.mixTwh.solar, wind: y.mixTwh.wind }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={MARGIN}>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        {yearAxis()}
        <YAxis tick={AXIS_TICK} stroke={GRID_STROKE} width={44} label={yAxisLabel("Generation (TWh)")} />
        <Tooltip
          cursor={{ fill: "var(--accent-soft)" }}
          content={(p) => (
            <TooltipBox
              active={p.active}
              payload={p.payload}
              title={p.label === undefined ? undefined : String(p.label)}
              format={(e) => (typeof e.value === "number" ? formatTwh(e.value, 1) : "No data")}
            />
          )}
        />
        <Legend verticalAlign="top" height={28} formatter={legendText} />
        <Bar dataKey="solar" name={FUEL_LABELS.solar} fill={FUEL_COLORS.solar} isAnimationActive={false} />
        <Bar dataKey="wind" name={FUEL_LABELS.wind} fill={FUEL_COLORS.wind} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SharesChart({ years }: { years: readonly YearSummary[] }) {
  const data = years.map((y) => ({
    year: y.year,
    gas: y.shares ? y.shares.gas * 100 : null,
    coal: y.shares ? y.shares.coal * 100 : null,
    renewables: y.shares ? (y.shares.wind + y.shares.solar) * 100 : null,
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={MARGIN}>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        {yearAxis()}
        <YAxis
          tick={AXIS_TICK}
          stroke={GRID_STROKE}
          width={44}
          domain={[0, 100]}
          tickFormatter={(v: number) => `${v}%`}
          label={yAxisLabel("Share of generation")}
        />
        <Tooltip
          content={(p) => (
            <TooltipBox
              active={p.active}
              payload={p.payload}
              title={p.label === undefined ? undefined : String(p.label)}
              format={(e) => (typeof e.value === "number" ? formatPercent(e.value / 100, 1) : "No data")}
            />
          )}
        />
        <Legend verticalAlign="top" height={28} formatter={legendText} />
        <Line dataKey="gas" name={FUEL_LABELS.gas} stroke={FUEL_COLORS.gas} strokeWidth={2.5} dot isAnimationActive={false} />
        <Line dataKey="coal" name={FUEL_LABELS.coal} stroke={FUEL_COLORS.coal} strokeWidth={2.5} dot isAnimationActive={false} />
        <Line
          dataKey="renewables"
          name="Renewables (wind + solar)"
          stroke={RENEWABLES_COLOR}
          strokeWidth={2.5}
          dot
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export interface PeakDatum {
  year: number;
  peakMw: number;
  trendMw: number | null;
}

export function PeakChart({ data }: { data: readonly PeakDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={[...data]} margin={MARGIN}>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        {yearAxis()}
        <YAxis
          tick={AXIS_TICK}
          stroke={GRID_STROKE}
          width={44}
          tickFormatter={(v: number) => (v / 1000).toFixed(0)}
          label={yAxisLabel("Peak demand (GW)")}
        />
        <Tooltip
          cursor={{ fill: "var(--accent-soft)" }}
          content={(p) => (
            <TooltipBox
              active={p.active}
              payload={p.payload}
              title={p.label === undefined ? undefined : String(p.label)}
              format={(e) => (typeof e.value === "number" ? formatGw(e.value) : "No data")}
            />
          )}
        />
        <Legend verticalAlign="top" height={28} formatter={legendText} />
        <Bar dataKey="peakMw" name="Peak hourly demand" fill="var(--ink-soft)" fillOpacity={0.7} isAnimationActive={false} />
        <Line dataKey="trendMw" name="Straight-line trend" stroke="var(--accent)" strokeWidth={2.5} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
