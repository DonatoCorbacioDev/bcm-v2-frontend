'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTopManagers } from '@/hooks/useTopManagers';
import { CapsuleBarList } from '@/components/dashboard/CapsuleBarList';

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
        <CapsuleBarList
          rows={data.map((d) => ({
            label: d.managerName,
            value: d.contractsCount,
            formattedValue: String(d.contractsCount),
          }))}
        />
      </CardContent>
    </Card>
  );
}
