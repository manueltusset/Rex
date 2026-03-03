interface SegmentedControlProps<T extends string | number> {
  options: Array<{ label: string; value: T }>;
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="inline-flex gap-1 p-1 rounded-lg bg-surface/50 border border-border-subtle">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          onClick={() => onChange(opt.value)}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
            value === opt.value
              ? "bg-primary/15 text-primary-light shadow-sm"
              : "text-muted hover:text-foreground hover:bg-foreground/[0.03]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
