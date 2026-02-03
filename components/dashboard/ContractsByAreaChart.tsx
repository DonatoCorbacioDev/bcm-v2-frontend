'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useContractsByArea } from '@/hooks/useContractsByArea';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function ContractsByAreaChart() {
  const { data, isLoading } = useContractsByArea();

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

  const dataWithColors = data.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contracts by Business Area</CardTitle>
        <CardDescription>Contract distribution by business area</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dataWithColors}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="areaName" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" name="Contracts" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}