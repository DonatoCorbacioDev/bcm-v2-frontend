interface CapsuleBarRow {
  label: string;
  value: number;
  formattedValue: string;
}

/** Minimal label + pill-track comparison, matching the design mockup's
 * "Valore per area di business" — no charting library, just proportional fills. */
export function CapsuleBarList({ rows }: { readonly rows: CapsuleBarRow[] }) {
  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-3">
          <span
            className="w-[140px] shrink-0 truncate text-sm text-secondary-foreground"
            title={row.label}
          >
            {row.label}
          </span>
          <div className="h-[13px] flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </div>
          <span className="w-16 shrink-0 text-right font-mono text-sm tabular-nums text-foreground">
            {row.formattedValue}
          </span>
        </div>
      ))}
    </div>
  );
}
