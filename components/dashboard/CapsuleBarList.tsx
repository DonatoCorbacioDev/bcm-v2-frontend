interface CapsuleBarRow {
  label: string;
  value: number;
  formattedValue: string;
}

/** Single institutional blue for every bar: these are neutral rankings
 * (one dimension, highest-to-lowest), not distinct categories, so a
 * rotating qualitative palette would imply a meaning that isn't there. */
const BAR_COLOR = "var(--chart-1)";

/** Scale reference ticks at 25/50/75% of the track width. Rendered after
 * the fill (on top) using a translucent neutral tone so they stay visible
 * whether they land on the empty track or on a filled (often near-100%)
 * bar — otherwise they'd vanish under exactly the bars long enough to
 * need a scale reference. Never overlaps the value label, which sits
 * outside the track in its own column. */
const SCALE_TICKS = [25, 50, 75];

/** Minimal label + pill-track comparison, matching the design mockup's
 * "Valore per area di business" — no charting library, just proportional fills. */
export function CapsuleBarList({ rows }: { readonly rows: CapsuleBarRow[] }) {
  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-3">
          <span
            className="w-[140px] shrink-0 truncate text-sm text-secondary-foreground"
            title={row.label}
          >
            {row.label}
          </span>
          <div className="relative h-[13px] flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-[width] duration-500 ease-out"
              style={{ width: `${(row.value / max) * 100}%`, backgroundColor: BAR_COLOR }}
            />
            {SCALE_TICKS.map((pct) => (
              <span
                key={pct}
                aria-hidden="true"
                className="absolute inset-y-0 w-px bg-foreground/15"
                style={{ left: `${pct}%` }}
              />
            ))}
          </div>
          <span className="w-16 shrink-0 text-right font-mono text-sm tabular-nums text-foreground">
            {row.formattedValue}
          </span>
        </div>
      ))}
    </div>
  );
}
