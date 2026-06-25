'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useContractsByArea } from '@/hooks/useContractsByArea';

const CHART_COLOR = "#3b82f6";

function truncate(str: string, max = 14): string {
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

export function ContractsByAreaChart() {
  const { data, isLoading, isError } = useContractsByArea();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contratti per area di business</CardTitle>
          <CardDescription>Distribuzione dei contratti per area di business</CardDescription>
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
          <CardTitle>Contratti per area di business</CardTitle>
          <CardDescription>Distribuzione dei contratti per area di business</CardDescription>
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
          <CardTitle>Contratti per area di business</CardTitle>
          <CardDescription>Distribuzione dei contratti per area di business</CardDescription>
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
        <CardTitle>Contratti per area di business</CardTitle>
        <CardDescription>Distribuzione dei contratti per area di business</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="areaName"
              tick={{ fontSize: 12 }}
              tickFormatter={(v: string) => truncate(v)}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={36} />
            <Tooltip formatter={(value) => [value as number, "Contratti"]} />
            <Bar dataKey="count" name="Contratti" fill={CHART_COLOR} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
