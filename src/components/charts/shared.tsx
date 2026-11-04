import { FUEL_COLORS, FUEL_LABELS } from "@/lib/fuels";
import type { FuelGroup } from "@/lib/types";

export const AXIS_TICK = { fill: "var(--ink-soft)", fontSize: 12 } as const;
export const GRID_STROKE = "var(--line)";
export const INK = "var(--ink)";

interface TooltipEntry {
  name?: string | number;
  value?: number | string | readonly (number | string)[];
  color?: string;
}

export interface TooltipProps {
  active?: boolean;
  payload?: readonly TooltipEntry[];
  title?: string;
  format: (entry: TooltipEntry) => string;
}

export function TooltipBox({ active, payload, title, format }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded border border-line bg-surface px-3 py-2 text-xs shadow-md">
      {title && <p className="mb-1 font-semibold">{title}</p>}
      <ul className="space-y-0.5">
        {payload.map((p) => (
          <li key={String(p.name)} className="flex items-center gap-2">
            <span aria-hidden="true" className="inline-block h-2 w-2 rounded-sm" style={{ background: p.color }} />
            <span className="text-soft">{p.name}</span>
            <span className="num ml-auto pl-3 font-medium">{format(p)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FuelLegend({ groups }: { groups: readonly FuelGroup[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="Legend">
      {groups.map((g) => (
        <li key={g} className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: FUEL_COLORS[g] }} />
          {FUEL_LABELS[g]}
        </li>
      ))}
    </ul>
  );
}

export function SwatchLegend({ items }: { items: readonly { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="Legend">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-0 w-4 border-t-2"
            style={{ borderColor: i.color, borderStyle: i.dashed ? "dashed" : "solid" }}
          />
          {i.label}
        </li>
      ))}
    </ul>
  );
}
