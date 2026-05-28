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
          <CardTitle>Top Managers</CardTitle>
          <CardDescription>Managers with most contracts</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Managers</CardTitle>
          <CardDescription>Managers with most contracts</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-destructive text-sm">Failed to load chart data</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Managers</CardTitle>
          <CardDescription>Managers with most contracts</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Managers</CardTitle>
        <CardDescription>Managers with most contracts</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
            <YAxis dataKey="managerName" type="category" width={140} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => [value as number, "Contracts"]} />
            <Bar dataKey="contractsCount" name="Contracts" fill={CHART_COLOR} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
