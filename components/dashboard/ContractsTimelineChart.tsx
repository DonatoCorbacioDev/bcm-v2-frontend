'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useContractsTimeline } from '@/hooks/useContractsTimeline';

export function ContractsTimelineChart() {
  const { data, isLoading } = useContractsTimeline();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contracts Timeline</CardTitle>
          <CardDescription>Contracts created in the last 12 months</CardDescription>
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
          <CardTitle>Contracts Timeline</CardTitle>
          <CardDescription>Contracts created in the last 12 months</CardDescription>
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
        <CardTitle>Contracts Timeline</CardTitle>
        <CardDescription>Contracts created in the last 12 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#8884d8"
              strokeWidth={2}
              name="Contracts"
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}