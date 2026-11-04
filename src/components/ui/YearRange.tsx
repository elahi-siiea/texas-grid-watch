export function YearRange({
  years,
  from,
  to,
  onChange,
}: {
  years: readonly number[];
  from: number;
  to: number;
  onChange: (from: number, to: number) => void;
}) {
  const select = "rounded border border-line bg-surface px-2 py-2 text-sm text-ink";
  return (
    <fieldset className="flex flex-wrap items-center gap-3">
      <legend className="sr-only">Year range</legend>
      <label className="flex items-center gap-2 text-sm">
        From
        <select className={select} value={from} onChange={(e) => onChange(Number(e.target.value), Math.max(to, Number(e.target.value)))}>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        To
        <select className={select} value={to} onChange={(e) => onChange(Math.min(from, Number(e.target.value)), Number(e.target.value))}>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  );
}
