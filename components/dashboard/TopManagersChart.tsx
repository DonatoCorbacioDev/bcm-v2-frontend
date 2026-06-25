'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTopManagers } from '@/hooks/useTopManagers';

const CHART_COLOR = "#3b82f6";

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
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
            <YAxis dataKey="managerName" type="category" width={140} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => [value as number, "Contratti"]} />
            <Bar dataKey="contractsCount" name="Contratti" fill={CHART_COLOR} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
