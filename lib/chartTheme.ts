/** Shared recharts styling so tooltips/grids follow the app's design tokens (light + dark). */
import type { CSSProperties } from "react";

export const CHART_GRID_STROKE = "var(--border)";

export const CHART_TICK_STYLE = { fontSize: 11, fill: "var(--muted-foreground)" };

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

export const CHART_CURSOR_FILL = { fill: "var(--muted)", opacity: 0.5 };
