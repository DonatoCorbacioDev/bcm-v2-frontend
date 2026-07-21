'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTopManagers } from '@/hooks/useTopManagers';
import { CapsuleBarList } from '@/components/dashboard/CapsuleBarList';

export function TopManagersChart() {
  const { data, isLoading, isError } = useTopManagers();

  if (isLoading) {
    return (
      <Card className="self-start py-5 gap-5">
        <CardHeader className="px-5">
          <CardTitle>Top manager</CardTitle>
          <CardDescription>Manager con più contratti assegnati</CardDescription>
        </CardHeader>
        <CardContent className="px-5 h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Caricamento...</p>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="self-start py-5 gap-5">
        <CardHeader className="px-5">
          <CardTitle>Top manager</CardTitle>
          <CardDescription>Manager con più contratti assegnati</CardDescription>
        </CardHeader>
        <CardContent className="px-5 h-[300px] flex items-center justify-center">
          <p className="text-destructive text-sm">Impossibile caricare i dati del grafico</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="self-start py-5 gap-5">
        <CardHeader className="px-5">
          <CardTitle>Top manager</CardTitle>
          <CardDescription>Manager con più contratti assegnati</CardDescription>
        </CardHeader>
        <CardContent className="px-5 h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Nessun dato disponibile</p>
        </CardContent>
      </Card>
    );
  }

  // A single manager isn't a ranking — show a compact summary instead of a
  // one-row bar list stretched to match the taller donut card next to it.
  if (data.length === 1) {
    const only = data[0];
    return (
      <Card className="self-start py-5 gap-5">
        <CardHeader className="px-5">
          <CardTitle>Top manager</CardTitle>
          <CardDescription>Manager con più contratti assegnati</CardDescription>
        </CardHeader>
        <CardContent className="px-5 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-foreground truncate">{only.managerName}</span>
            <span className="font-mono text-sm tabular-nums text-foreground">{only.contractsCount}</span>
          </div>
          <div className="h-[13px] w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-full rounded-full" style={{ backgroundColor: "var(--chart-1)" }} />
          </div>
          <p className="text-xs text-muted-foreground">Unico responsabile assegnato</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="self-start py-5 gap-5">
      <CardHeader className="px-5">
        <CardTitle>Top manager</CardTitle>
        <CardDescription>Manager con più contratti assegnati</CardDescription>
      </CardHeader>
      <CardContent className="px-5">
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
