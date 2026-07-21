"use client";

import { PieChart, Pie, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CHART_TOOLTIP_CONTENT_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
  CHART_TOOLTIP_ITEM_STYLE,
} from "@/lib/chartTheme";

interface ContractStatsChartProps {
  readonly total: number;
  readonly active: number;
  readonly expiring: number;
  readonly expired: number;
}

/** Largest-remainder rounding so displayed percentages always sum to 100,
 * instead of each segment rounding independently (which can drift with 3+
 * segments — e.g. 33/33/33 rounding to 99). */
function distributePercentages(values: number[], total: number): number[] {
  const raw = values.map((v) => (v / total) * 100);
  const floors = raw.map(Math.floor);
  const remainder = 100 - floors.reduce((sum, f) => sum + f, 0);
  const byFraction = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac);
  const result = [...floors];
  for (let k = 0; k < remainder && k < byFraction.length; k++) {
    result[byFraction[k].i] += 1;
  }
  return result;
}

const SEGMENTS = [
  { key: "active",    name: "Attivi",      fill: "var(--status-green-fg)" },
  { key: "expiring",  name: "In scadenza", fill: "var(--status-amber-fg)" },
  { key: "expired",   name: "Scaduti",     fill: "var(--status-red-fg)" },
  { key: "cancelled", name: "Annullati",   fill: "var(--status-slate-fg)" },
] as const;

export default function ContractStatsChart({ total, active, expiring, expired }: ContractStatsChartProps) {
  // "expiring" is a subset of "active" (an active contract nearing its end date),
  // not a distinct status — subtract it so segments don't double-count and sum to `total`.
  const activeOnly = Math.max(0, active - expiring);
  const cancelled = Math.max(0, total - active - expired);
  const values = { active: activeOnly, expiring, expired, cancelled };
  const data = SEGMENTS
    .map((s) => ({ name: s.name, value: values[s.key], fill: s.fill }))
    .filter((d) => d.value > 0);
  const percentages = distributePercentages(data.map((d) => d.value), total);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuzione contratti</CardTitle>
        <CardDescription>Ripartizione per stato di tutti i contratti</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="h-75 flex items-center justify-center text-muted-foreground">
            Nessun contratto disponibile
          </div>
        ) : (
          <div className="flex items-center gap-6">
            <div className="relative h-[172px] w-[172px] flex-none">
              {/* height as a fixed number (matching the wrapper's fixed
                  h-[172px]) instead of "100%" avoids Recharts having to
                  measure the DOM before it can compute a positive height,
                  which otherwise emits "width(-1) and height(-1)" on the
                  first render before its ResizeObserver corrects it. */}
              <ResponsiveContainer width="100%" height={172}>
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={66}
                    outerRadius={86}
                    paddingAngle={data.length > 1 ? 3 : 0}
                    cornerRadius={6}
                    dataKey="value"
                    stroke="none"
                  />
                  <Tooltip
                    formatter={(value) => [value as number, ""]}
                    contentStyle={CHART_TOOLTIP_CONTENT_STYLE}
                    labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                    itemStyle={CHART_TOOLTIP_ITEM_STYLE}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-[28px] font-bold tracking-tight tabular-nums">{total}</span>
                <span className="text-[11px] text-muted-foreground">contratti</span>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-3 min-w-0">
              {data.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 flex-none rounded-full"
                    style={{ backgroundColor: d.fill }}
                    aria-hidden="true"
                  />
                  <span className="flex-1 truncate text-sm font-medium">{d.name}</span>
                  <span className="font-mono text-sm font-semibold tabular-nums">{d.value}</span>
                  <span className="w-10 flex-none text-right font-mono text-[11.5px] text-muted-foreground tabular-nums">
                    {percentages[i]}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
