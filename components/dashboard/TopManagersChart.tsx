'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTopManagers } from '@/hooks/useTopManagers';
import {
  CHART_GRID_STROKE,
  CHART_TICK_STYLE,
  CHART_TOOLTIP_CONTENT_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
  CHART_TOOLTIP_ITEM_STYLE,
  CHART_CURSOR_FILL,
} from '@/lib/chartTheme';

const CHART_COLOR = "var(--chart-1)";

export function TopManagersChart() {
  const { data, isLoading, isError } = useTopManagers();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top manager</CardTitle>
          <CardDescription>Manager con più contratti assegnati</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Caricamento...</p>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top manager</CardTitle>
          <CardDescription>Manager con più contratti assegnati</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-destructive text-sm">Impossibile caricare i dati del grafico</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top manager</CardTitle>
          <CardDescription>Manager con più contratti assegnati</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Nessun dato disponibile</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top manager</CardTitle>
        <CardDescription>Manager con più contratti assegnati</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={CHART_TICK_STYLE} />
            <YAxis dataKey="managerName" type="category" width={140} tick={CHART_TICK_STYLE} />
            <Tooltip
              formatter={(value) => [value as number, "Contratti"]}
              contentStyle={CHART_TOOLTIP_CONTENT_STYLE}
              labelStyle={CHART_TOOLTIP_LABEL_STYLE}
              itemStyle={CHART_TOOLTIP_ITEM_STYLE}
              cursor={CHART_CURSOR_FILL}
            />
            <Bar dataKey="contractsCount" name="Contratti" fill={CHART_COLOR} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
