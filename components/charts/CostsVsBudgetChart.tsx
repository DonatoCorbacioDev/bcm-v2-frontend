"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useEffect, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  CHART_GRID_OPACITY,
  CHART_GRID_STROKE,
  CHART_TICK_STYLE,
  CHART_TOOLTIP_CONTENT_STYLE,
  CHART_TOOLTIP_ITEM_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
} from "@/lib/chartTheme";

export interface MonthCost {
  /** Short month name, as on the axis ("giu"). */
  readonly label: string;
  /** Euro, VAT excluded. */
  readonly cost: number;
}

interface CostsVsBudgetChartProps {
  readonly data: readonly MonthCost[];
  /** The monthly budget in euro. */
  readonly budget: number;
  readonly ariaLabel: string;
}

// Over budget is a warning (amber), never red: in BCM red means a date to act by.
const OVER = "var(--status-amber-mark)";
const OVER_TEXT = "var(--status-amber-fg)";
const WITHIN = "var(--chart-1)";

/** "4,5k €" from 1000 up, "800 €" below. */
export function compactEuro(v: number): string {
  if (Math.abs(v) >= 1000) return `${(v / 1000).toLocaleString("it-IT", { maximumFractionDigits: 1 })}k €`;
  return `${Math.round(v).toLocaleString("it-IT")} €`;
}

const fullEuro = (v: number) => `${Math.round(v).toLocaleString("it-IT")} €`;

/** Three steps of a round size (1, 2, 2.5 or 5 times a power of ten) that cover the highest value. */
function axisTicks(max: number): number[] {
  if (max <= 0) return [0, 1, 2, 3];
  const raw = max / 3;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= raw) ?? 10 * power;
  return [0, step, 2 * step, 3 * step];
}

/**
 * Monthly supplier costs against the monthly budget: the months within it
 * quiet, the ones over it amber with how much they went over written above
 * the bar, so the number carries the message and the colour only backs it
 * up. One series, so no legend box: the dashed line is labelled on the chart.
 * The bars rise once, when the chart scrolls into view (still under reduced
 * motion). Used on the Home and, with the demo's numbers, on the landing.
 */
export function CostsVsBudgetChart({ data, budget, ariaLabel }: CostsVsBudgetChartProps) {
  const box = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<"waiting" | "still" | "rising">(() =>
    typeof IntersectionObserver === "undefined" ? "still" : "waiting",
  );
  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      setView(globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "still" : "rising");
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const over = data.filter((d) => d.cost > budget).map((d) => d.label);
  const ticks = axisTicks(Math.max(budget, ...data.map((d) => d.cost)) * 1.1);
  const overBy = (v: number) => `+${fullEuro(v - budget)}`;

  return (
    <div>
      <div ref={box} className="h-44 md:h-64" role="img" aria-label={ariaLabel}>
        {view === "waiting" ? (
          <div className="h-full rounded-md bg-muted/50" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...data]} margin={{ top: 22, right: 4, left: -8, bottom: 0 }} barCategoryGap="38%">
              <CartesianGrid horizontal vertical={false} stroke={CHART_GRID_STROKE} strokeOpacity={CHART_GRID_OPACITY} />
              <XAxis dataKey="label" tick={CHART_TICK_STYLE} axisLine={false} tickLine={false} />
              <YAxis
                domain={[0, ticks[3]]}
                ticks={ticks}
                tickFormatter={(v: number) => (v === 0 ? "0" : compactEuro(v))}
                tick={CHART_TICK_STYLE}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                formatter={(value) => {
                  const v = value as number;
                  return [`${fullEuro(v)}${v > budget ? `, ${overBy(v)} sopra il budget` : ""}`, "Costi"];
                }}
                contentStyle={CHART_TOOLTIP_CONTENT_STYLE}
                labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                itemStyle={CHART_TOOLTIP_ITEM_STYLE}
              />
              <ReferenceLine
                y={budget}
                stroke="var(--foreground)"
                strokeOpacity={0.55}
                strokeDasharray="5 4"
                label={{ value: "Budget", position: "insideTopLeft", fill: "var(--muted-foreground)", fontSize: 12, dy: -16 }}
              />
              <Bar dataKey="cost" radius={[4, 4, 0, 0]} isAnimationActive={view === "rising"} animationDuration={700}>
                {data.map((d) => (
                  // The months within budget stay quiet, so the ones over it stand out.
                  <Cell key={d.label} fill={d.cost > budget ? OVER : WITHIN} fillOpacity={d.cost > budget ? 1 : 0.4} />
                ))}
                <LabelList
                  dataKey="cost"
                  // Drawn by hand: the default label wraps at the bar's width ("+600" / "€").
                  content={({ x, y, width, value }) => {
                    const v = Number(value);
                    if (!(v > budget)) return null;
                    return (
                      <text x={Number(x) + Number(width) / 2} y={Number(y) - 6} textAnchor="middle" fill={OVER_TEXT} fontSize={12} fontWeight={600}>
                        {overBy(v)}
                      </text>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-0 w-5 border-t-2 border-dashed border-foreground/60" aria-hidden="true" />
          Budget {compactEuro(budget)} al mese
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: OVER }} aria-hidden="true" />
          {over.length > 0 ? `Sopra il budget: ${over.join(", ")}` : "Nessun mese sopra il budget"}
        </span>
      </p>
    </div>
  );
}
