'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useContractsTimeline } from '@/hooks/useContractsTimeline';
import {
  CHART_TICK_STYLE,
  CHART_GRID_STROKE,
  CHART_GRID_OPACITY,
  CHART_TOOLTIP_CONTENT_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
  CHART_TOOLTIP_ITEM_STYLE,
  formatMonthLabel,
} from '@/lib/chartTheme';

const CHART_COLOR = "var(--chart-1)";

interface TimelineLastPointDotProps {
  readonly cx?: number;
  readonly cy?: number;
  readonly index?: number;
  readonly lastIndex?: number;
  readonly color?: string;
}

/** Recharts clones this element per data point, injecting cx/cy/index — only the last point renders. */
function TimelineLastPointDot({ cx, cy, index, lastIndex, color }: TimelineLastPointDotProps) {
  if (index !== lastIndex) return <></>;
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill={color} opacity={0.16} />
      <circle cx={cx} cy={cy} r={4.5} fill={color} stroke="var(--card)" strokeWidth={2} />
    </g>
  );
}

export function ContractsTimelineChart() {
  const { data, isLoading, isError } = useContractsTimeline();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Andamento contratti</CardTitle>
          <CardDescription>Contratti avviati negli ultimi 12 mesi</CardDescription>
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
          <CardTitle>Andamento contratti</CardTitle>
          <CardDescription>Contratti avviati negli ultimi 12 mesi</CardDescription>
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
          <CardTitle>Andamento contratti</CardTitle>
          <CardDescription>Contratti avviati negli ultimi 12 mesi</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Nessun dato disponibile</p>
        </CardContent>
      </Card>
    );
  }

  const last = data.at(-1);
  if (!last) return null;
  const prev = data.length > 1 ? data.at(-2) : undefined;
  const delta = prev ? last.count - prev.count : null;
  const isUp = (delta ?? 0) >= 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[14.5px] font-semibold">Andamento contratti</p>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">Contratti avviati negli ultimi 12 mesi</p>
          </div>
          <div className="flex-none text-right">
            <div className="font-mono text-[26px] font-bold leading-none tracking-tight tabular-nums">
              {last.count}
            </div>
            {delta !== null && (
              <span
                className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{
                  color: isUp ? "var(--status-green-fg)" : "var(--status-red-fg)",
                  backgroundColor: isUp ? "var(--status-green-bg)" : "var(--status-red-bg)",
                }}
              >
                {isUp ? "▲" : "▼"} {Math.abs(delta)} vs mese scorso
              </span>
            )}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="timelineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={CHART_COLOR} stopOpacity={0.28} />
                <stop offset="95%" stopColor={CHART_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              horizontal
              vertical={false}
              stroke={CHART_GRID_STROKE}
              strokeOpacity={CHART_GRID_OPACITY}
            />
            <XAxis
              dataKey="month"
              tickFormatter={formatMonthLabel}
              tick={CHART_TICK_STYLE}
              axisLine={false}
              tickLine={false}
            />
            <YAxis allowDecimals={false} tick={CHART_TICK_STYLE} width={32} axisLine={false} tickLine={false} tickCount={4} />
            <Tooltip
              formatter={(value) => [value as number, "Contratti"]}
              labelFormatter={(label) => formatMonthLabel(String(label))}
              contentStyle={CHART_TOOLTIP_CONTENT_STYLE}
              labelStyle={CHART_TOOLTIP_LABEL_STYLE}
              itemStyle={CHART_TOOLTIP_ITEM_STYLE}
            />
            <Area
              type="monotone"
              dataKey="count"
              name="Contratti"
              stroke={CHART_COLOR}
              strokeWidth={2}
              fill="url(#timelineGradient)"
              activeDot={{ r: 5 }}
              dot={<TimelineLastPointDot lastIndex={data.length - 1} color={CHART_COLOR} />}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
