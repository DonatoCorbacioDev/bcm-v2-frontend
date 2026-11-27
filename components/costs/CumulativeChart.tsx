"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  CHART_GRID_OPACITY,
  CHART_GRID_STROKE,
  CHART_TICK_STYLE,
  CHART_TOOLTIP_CONTENT_STYLE,
  CHART_TOOLTIP_ITEM_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
} from "@/lib/chartTheme";
import { compactEuro } from "@/components/charts/CostsVsBudgetChart";
import type { MonthPoint } from "@/lib/costsOverview";

const BLUE = "var(--chart-1)";
const OVER = "var(--status-amber-mark)";
const PACE = "var(--muted-foreground)";

const euro = (v: number) => `${Math.round(v).toLocaleString("it-IT")} €`;

/**
 * The year's spending added up month by month (blue), against where the
 * budget says one should be (grey dashed, from 0 to the yearly budget). A
 * month above that line gets an amber dot: the colour backs up the sentence
 * above the chart, it never carries the message alone. From today on the
 * line continues dashed: what the contracts still foresee.
 */
export function CumulativeChart({ months, hasBudget }: { readonly months: readonly MonthPoint[]; readonly hasBudget: boolean }) {
  return (
    <div>
      <div className="h-56 md:h-72" role="img" aria-label="Spesa accumulata mese per mese rispetto al ritmo del budget">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={[...months]} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid horizontal vertical={false} stroke={CHART_GRID_STROKE} strokeOpacity={CHART_GRID_OPACITY} />
            <XAxis dataKey="label" tick={CHART_TICK_STYLE} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v: number) => (v === 0 ? "0" : compactEuro(v))} tick={CHART_TICK_STYLE} axisLine={false} tickLine={false} width={56} />
            <Tooltip
              formatter={(value, name) => [euro(Number(value)), String(name)]}
              contentStyle={CHART_TOOLTIP_CONTENT_STYLE}
              labelStyle={CHART_TOOLTIP_LABEL_STYLE}
              itemStyle={CHART_TOOLTIP_ITEM_STYLE}
            />
            {hasBudget && (
              <Line name="Ritmo del budget" dataKey="pace" stroke={PACE} strokeOpacity={0.6} strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
            )}
            <Line
              name="Previsione"
              dataKey="forecast"
              stroke={BLUE}
              strokeOpacity={0.5}
              strokeWidth={2}
              strokeDasharray="2 4"
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              name="Fino a oggi"
              dataKey="actual"
              stroke={BLUE}
              strokeWidth={2.5}
              connectNulls={false}
              isAnimationActive={false}
              dot={(props: { cx?: number; cy?: number; payload?: MonthPoint; index?: number }) => {
                const { cx, cy, payload, index } = props;
                if (cx == null || cy == null || !payload || payload.actual == null) return <g key={index} />;
                const over = payload.pace != null && payload.actual > payload.pace;
                return <circle key={index} cx={cx} cy={cy} r={over ? 5 : 3.5} fill={over ? OVER : BLUE} stroke="var(--card)" strokeWidth={2} />;
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-0.5 w-5 rounded" style={{ background: BLUE }} aria-hidden="true" />
          Fino a oggi
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-0 w-5 border-t-2 border-dotted" style={{ borderColor: BLUE, opacity: 0.6 }} aria-hidden="true" />
          Previsione dai contratti
        </span>
        {hasBudget && (
          <>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-0 w-5 border-t-2 border-dashed border-muted-foreground/60" aria-hidden="true" />
              Ritmo del budget
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: OVER }} aria-hidden="true" />
              Mese sopra il ritmo
            </span>
          </>
        )}
      </p>
    </div>
  );
}
