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
          <CardTitle>Contracts by Business Area</CardTitle>
          <CardDescription>Contract distribution by business area</CardDescription>
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
          <CardTitle>Contracts by Business Area</CardTitle>
          <CardDescription>Contract distribution by business area</CardDescription>
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
          <CardTitle>Contracts by Business Area</CardTitle>
          <CardDescription>Contract distribution by business area</CardDescription>
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
        <CardTitle>Contracts by Business Area</CardTitle>
        <CardDescription>Contract distribution by business area</CardDescription>
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
            <Tooltip formatter={(value) => [value as number, "Contracts"]} />
            <Bar dataKey="count" name="Contracts" fill={CHART_COLOR} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
