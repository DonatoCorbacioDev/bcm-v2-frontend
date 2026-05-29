"use client";

import { PieChart, Pie, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ContractStatsChartProps {
  readonly total: number;
  readonly active: number;
  readonly expiring: number;
  readonly expired: number;
}

const SEGMENTS = [
  { key: "active",   name: "Active",        fill: "#10b981" },
  { key: "expiring", name: "Expiring Soon", fill: "#f59e0b" },
  { key: "expired",  name: "Expired",       fill: "#ef4444" },
] as const;

export default function ContractStatsChart({ total, active, expiring, expired }: ContractStatsChartProps) {
  const values = { active, expiring, expired };
  const data = SEGMENTS
    .map((s) => ({ name: s.name, value: values[s.key], fill: s.fill }))
    .filter((d) => d.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contract Distribution</CardTitle>
        <CardDescription>Status breakdown of all contracts</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="h-75 flex items-center justify-center text-muted-foreground">
            No contracts available
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
              <Tooltip formatter={(value) => [value as number, ""]} />
              <Legend iconType="circle" iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
