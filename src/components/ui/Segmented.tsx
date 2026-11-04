export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded border border-line">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-2 text-sm first:rounded-l last:rounded-r ${
            o.value === value ? "bg-ink text-bg" : "text-ink hover:bg-accent-soft"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
