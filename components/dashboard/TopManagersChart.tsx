'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTopManagers } from '@/hooks/useTopManagers';

export function TopManagersChart() {
  const { data, isLoading } = useTopManagers();

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
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="managerName" type="category" width={150} />
            <Tooltip />
            <Legend />
            <Bar dataKey="contractsCount" fill="#82ca9d" name="Contracts" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}