/** Shared recharts styling so tooltips follow the app's design tokens (light + dark). */
import type { CSSProperties } from "react";

export const CHART_TICK_STYLE = { fontSize: 11, fill: "var(--muted-foreground)" };

/** Faint horizontal-only reference lines, aligned to the Y-axis ticks —
 * an anchor for reading values without the busy library-default grid box. */
export const CHART_GRID_STROKE = "var(--border)";
export const CHART_GRID_OPACITY = 0.6;

export const CHART_TOOLTIP_CONTENT_STYLE: CSSProperties = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  boxShadow: "var(--shadow-lg)",
  fontSize: 12,
  padding: "8px 12px",
};

export const CHART_TOOLTIP_LABEL_STYLE: CSSProperties = {
  color: "var(--muted-foreground)",
  marginBottom: 4,
  fontWeight: 600,
};

export const CHART_TOOLTIP_ITEM_STYLE: CSSProperties = {
  color: "var(--card-foreground)",
};

export const CHART_LEGEND_STYLE: CSSProperties = {
  color: "var(--muted-foreground)",
  fontSize: 12,
};

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat("it-IT", {
  month: "short",
  year: "2-digit",
});

/** API month keys are raw "YYYY-MM" strings — format them for display
 * (e.g. "2026-07" -> "lug '26") instead of rendering them verbatim. */
export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) return monthKey;
  return MONTH_LABEL_FORMATTER.format(new Date(year, month - 1, 1));
}
