"use client";

import { PieChart, Pie, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CHART_TOOLTIP_CONTENT_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
  CHART_TOOLTIP_ITEM_STYLE,
  CHART_LEGEND_STYLE,
} from "@/lib/chartTheme";

interface ContractStatsChartProps {
  readonly total: number;
  readonly active: number;
  readonly expiring: number;
  readonly expired: number;
}

const SEGMENTS = [
  { key: "active",   name: "Attivi",          fill: "#10b981" },
  { key: "expiring", name: "In scadenza",     fill: "#f59e0b" },
  { key: "expired",  name: "Scaduti",         fill: "#ef4444" },
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
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                dataKey="value"
                stroke="none"
              />
              <Tooltip
                formatter={(value) => [value as number, ""]}
                contentStyle={CHART_TOOLTIP_CONTENT_STYLE}
                labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                itemStyle={CHART_TOOLTIP_ITEM_STYLE}
              />
              <Legend iconType="circle" iconSize={10} wrapperStyle={CHART_LEGEND_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
