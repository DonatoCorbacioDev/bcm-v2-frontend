'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useContractsByArea } from '@/hooks/useContractsByArea';
import { CapsuleBarList } from '@/components/dashboard/CapsuleBarList';

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
        <CapsuleBarList
          rows={data.map((d) => ({
            label: d.areaName,
            value: d.count,
            formattedValue: String(d.count),
          }))}
        />
      </CardContent>
    </Card>
  );
}
