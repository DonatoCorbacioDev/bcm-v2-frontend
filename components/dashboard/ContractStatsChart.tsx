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

const SEGMENTS = [
  { key: "active",   name: "Attivi",      fill: "var(--status-green-fg)" },
  { key: "expiring", name: "In scadenza", fill: "var(--status-amber-fg)" },
  { key: "expired",  name: "Scaduti",     fill: "var(--status-red-fg)" },
] as const;

export default function ContractStatsChart({ total, active, expiring, expired }: ContractStatsChartProps) {
  const values = { active, expiring, expired };
  const data = SEGMENTS
    .map((s) => ({ name: s.name, value: values[s.key], fill: s.fill }))
    .filter((d) => d.value > 0);

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
              <ResponsiveContainer width="100%" height="100%">
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
              {data.map((d) => (
                <div key={d.name} className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 flex-none rounded-full"
                    style={{ backgroundColor: d.fill }}
                    aria-hidden="true"
                  />
                  <span className="flex-1 truncate text-sm font-medium">{d.name}</span>
                  <span className="font-mono text-sm font-semibold tabular-nums">{d.value}</span>
                  <span className="w-10 flex-none text-right font-mono text-[11.5px] text-muted-foreground tabular-nums">
                    {Math.round((d.value / total) * 100)}%
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
