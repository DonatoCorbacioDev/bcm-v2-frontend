'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useContractsTimeline } from '@/hooks/useContractsTimeline';

const CHART_COLOR = "#3b82f6";

export function ContractsTimelineChart() {
  const { data, isLoading, isError } = useContractsTimeline();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Andamento contratti</CardTitle>
          <CardDescription>Contratti creati negli ultimi 12 mesi</CardDescription>
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
          <CardTitle>Andamento contratti</CardTitle>
          <CardDescription>Contratti creati negli ultimi 12 mesi</CardDescription>
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
          <CardTitle>Andamento contratti</CardTitle>
          <CardDescription>Contratti creati negli ultimi 12 mesi</CardDescription>
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
        <CardTitle>Andamento contratti</CardTitle>
        <CardDescription>Contratti creati negli ultimi 12 mesi</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="timelineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={CHART_COLOR} stopOpacity={0.25} />
                <stop offset="95%" stopColor={CHART_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={36} />
            <Tooltip formatter={(value) => [value as number, "Contratti"]} />
            <Area
              type="monotone"
              dataKey="count"
              name="Contratti"
              stroke={CHART_COLOR}
              strokeWidth={2}
              fill="url(#timelineGradient)"
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
