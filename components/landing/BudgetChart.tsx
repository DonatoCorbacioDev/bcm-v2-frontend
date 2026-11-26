"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  CHART_GRID_OPACITY,
  CHART_GRID_STROKE,
  CHART_TICK_STYLE,
  CHART_TOOLTIP_CONTENT_STYLE,
  CHART_TOOLTIP_ITEM_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
} from "@/lib/chartTheme";
import { useToday } from "@/components/landing/useToday";

// The demo organization's monthly supplier costs, in thousands of euro, for
// the eight months up to this one, against a budget of 4.5 a month.
const COSTS = [3.9, 4.2, 4.6, 4.1, 5.1, 4.3, 3.7, 4.4];
const BUDGET = 4.5;
const OVER = "var(--status-amber-fg)";
const WITHIN = "var(--chart-1)";

const euro = (k: number) => `${k.toLocaleString("it-IT", { minimumFractionDigits: 1 })}k €`;
/** How much a month went over, in whole euro: "+600 €". */
const overBy = (k: number) => `+${Math.round((k - BUDGET) * 1000).toLocaleString("it-IT")} €`;

/**
 * One series, so no legend box: the heading names it, the dashed line is the
 * budget (labelled on the chart), and the months over it are amber with how
 * much they went over written above the bar, so the number carries the
 * message and the colour only backs it up. Amber, not red: in BCM red means
 * a date to act by; a month over budget is a warning.
 */
export function BudgetChart() {
  const today = useToday();
  const data = today
    ? COSTS.map((cost, i) => {
        const month = new Date(today.getFullYear(), today.getMonth() - (COSTS.length - 1 - i), 1);
        return { month: month.toLocaleDateString("it-IT", { month: "short" }), cost };
      })
    : null;
  const over = data?.filter((d) => d.cost > BUDGET).map((d) => d.month) ?? [];

  return (
    <div>
      <div className="h-44 md:h-64" role="img" aria-label={`Costi mensili dei fornitori rispetto al budget di ${euro(BUDGET)}: due mesi sopra il budget.`}>
        {data ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 22, right: 4, left: -18, bottom: 0 }} barCategoryGap="28%">
              <CartesianGrid horizontal vertical={false} stroke={CHART_GRID_STROKE} strokeOpacity={CHART_GRID_OPACITY} />
              <XAxis dataKey="month" tick={CHART_TICK_STYLE} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 6]} ticks={[0, 2, 4, 6]} tick={CHART_TICK_STYLE} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                formatter={(value) => {
                  const v = value as number;
                  return [`${euro(v)}${v > BUDGET ? `, ${overBy(v)} sopra il budget` : ""}`, "Costi"];
                }}
                contentStyle={CHART_TOOLTIP_CONTENT_STYLE}
                labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                itemStyle={CHART_TOOLTIP_ITEM_STYLE}
              />
              <ReferenceLine
                y={BUDGET}
                stroke="var(--foreground)"
                strokeOpacity={0.55}
                strokeDasharray="5 4"
                label={{ value: "Budget", position: "insideTopLeft", fill: "var(--muted-foreground)", fontSize: 12, dy: -16 }}
              />
              <Bar dataKey="cost" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                {data.map((d) => (
                  <Cell key={d.month} fill={d.cost > BUDGET ? OVER : WITHIN} />
                ))}
                <LabelList
                  dataKey="cost"
                  // Drawn by hand: the default label wraps at the bar's width ("+600" / "€").
                  content={({ x, y, width, value }) => {
                    const v = Number(value);
                    if (!(v > BUDGET)) return null;
                    return (
                      <text x={Number(x) + Number(width) / 2} y={Number(y) - 6} textAnchor="middle" fill={OVER} fontSize={12} fontWeight={600}>
                        {overBy(v)}
                      </text>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full rounded-md bg-muted/50" />
        )}
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-0 w-5 border-t-2 border-dashed border-foreground/60" aria-hidden="true" />
          Budget {euro(BUDGET)} al mese
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: OVER }} aria-hidden="true" />
          Sopra il budget{over.length > 0 ? `: ${over.join(", ")}` : ""}
        </span>
      </p>
    </div>
  );
}
