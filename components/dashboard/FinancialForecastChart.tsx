"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WifiOff, Loader2, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { useFinancialValues } from "@/hooks/useFinancialValues";
import type { ForecastResponse, ForecastPoint, FinancialValue } from "@/types";
import {
  CHART_TICK_STYLE,
  CHART_GRID_STROKE,
  CHART_GRID_OPACITY,
  CHART_TOOLTIP_CONTENT_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
  CHART_TOOLTIP_ITEM_STYLE,
  CHART_LEGEND_STYLE,
  formatMonthLabel,
} from "@/lib/chartTheme";

// Historical and forecast share the same institutional blue; the line
// style (solid vs dashed) is what tells them apart, not a second hue.
const CHART_COLOR = "var(--chart-1)";

type Horizon = 3 | 6;

function aggregateHistorical(values: FinancialValue[]): ForecastPoint[] {
  const map = new Map<string, number>();
  for (const v of values) {
    const key = `${v.year}-${String(v.month).padStart(2, "0")}`;
    map.set(key, (map.get(key) ?? 0) + (v.financialAmount ?? 0));
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount: Math.round(amount * 100) / 100 }));
}

interface ChartPoint {
  month: string;
  historical?: number;
  forecast?: number;
  /** Invisible stack base for the confidence band (= lower bound). */
  ciBase?: number;
  /** Visible stack thickness for the confidence band (= upper - ciBase). */
  ciRange?: number;
}

/**
 * Computes the invisible-base + thickness pair Recharts needs to stack a
 * confidence band between `lower` and `upper`. Returns an empty object
 * (no band drawn for that point, leaving a visible gap) when the interval
 * is missing or inverted, instead of silently clamping to a misleading
 * flat band.
 */
function computeConfidenceBand(
  lower: number,
  upper: number,
  month: string,
): Pick<ChartPoint, "ciBase" | "ciRange"> {
  if (!Number.isFinite(lower) || !Number.isFinite(upper)) {
    return {};
  }
  const safeLower = lower < 0 ? 0 : lower;
  if (lower < 0) {
    console.warn(
      `FinancialForecastChart: clamping negative confidence lower bound to 0 for ${month} (was ${lower}).`,
    );
  }
  if (upper < safeLower) {
    console.warn(
      `FinancialForecastChart: skipping confidence band for ${month} — inverted interval (lower=${lower}, upper=${upper}).`,
    );
    return {};
  }
  return { ciBase: safeLower, ciRange: upper - safeLower };
}

function buildChartData(
  historical: ForecastPoint[],
  forecast: ForecastPoint[],
): ChartPoint[] {
  const histPoints: ChartPoint[] = historical.map((p) => ({ month: p.month, historical: p.amount }));
  const forePoints: ChartPoint[] = forecast.map((p) => ({
    month: p.month,
    forecast: p.amount,
    ...(p.lower !== undefined && p.upper !== undefined
      ? computeConfidenceBand(p.lower, p.upper, p.month)
      : {}),
  }));
  // Anchor the forecast line to the last historical point only (not the
  // other way around) so the dashed line takes over from exactly where the
  // solid line ends, instead of both series overlapping across that segment.
  if (histPoints.length > 0 && forePoints.length > 0) {
    const lastIndex = histPoints.length - 1;
    histPoints[lastIndex] = { ...histPoints[lastIndex], forecast: histPoints[lastIndex].historical };
  }
  return [...histPoints, ...forePoints];
}

const EUR_FORMATTER = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const formatEur = (v: number) => EUR_FORMATTER.format(v);

export function FinancialForecastChart() {
  const [horizon, setHorizon] = useState<Horizon>(3);

  const { data: financialValues, isLoading: isLoadingHist } = useFinancialValues();

  const {
    data: forecastData,
    isLoading: isLoadingForecast,
    isError: isForecastOffline,
  } = useQuery<ForecastResponse>({
    queryKey: ["forecast", horizon],
    queryFn: async () => {
      const res = await api.get<ForecastResponse>(`/forecast?months=${horizon}`);
      return res.data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = isLoadingHist || isLoadingForecast;

  const historical =
    forecastData?.historical && forecastData.historical.length > 0
      ? forecastData.historical
      : aggregateHistorical(financialValues ?? []);
  const forecast = forecastData?.forecast ?? [];
  const isReliable = forecastData?.reliable ?? true;
  const chartData = buildChartData(historical, forecast);

  const firstForecastMonth = forecast[0]?.month;

  return (
    <Card className="lg:col-span-2 py-5 gap-5">
      <CardHeader className="px-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle>Previsione finanziaria</CardTitle>
            <CardDescription>
              Valori finanziari storici{isForecastOffline ? "" : ` + previsione a ${horizon} mesi`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isForecastOffline && (
              <span className="flex items-center gap-1.5 text-xs text-[var(--status-amber-fg)] bg-[var(--status-amber-bg)] px-2 py-1 rounded-full">
                <WifiOff className="h-3 w-3" />
                Previsione non disponibile
              </span>
            )}
            {!isForecastOffline && !isReliable && forecast.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-[var(--status-amber-fg)] bg-[var(--status-amber-bg)] px-2 py-1 rounded-full">
                <AlertTriangle className="h-3 w-3" />
                Dati insufficienti (&lt;12 mesi)
              </span>
            )}
            {[3, 6].map((m) => (
              <Button
                key={m}
                variant={horizon === m ? "default" : "outline"}
                size="sm"
                onClick={() => setHorizon(m as Horizon)}
                disabled={isForecastOffline}
              >
                {m}M
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5">
        {isLoading && (
          <div className="h-[300px] flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading && chartData.length === 0 && (
          <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
            Nessun dato finanziario disponibile
          </div>
        )}
        {!isLoading && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
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
              <YAxis
                tickFormatter={formatEur}
                tick={CHART_TICK_STYLE}
                width={70}
                axisLine={false}
                tickLine={false}
                tickCount={4}
              />
              <Tooltip
                formatter={(value, name) => [formatEur(value as number), name]}
                labelFormatter={(label) => formatMonthLabel(String(label))}
                contentStyle={CHART_TOOLTIP_CONTENT_STYLE}
                labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                itemStyle={CHART_TOOLTIP_ITEM_STYLE}
              />
              <Legend wrapperStyle={CHART_LEGEND_STYLE} iconType="plainline" iconSize={14} />

              {firstForecastMonth && (
                <ReferenceLine
                  x={firstForecastMonth}
                  stroke={CHART_COLOR}
                  strokeDasharray="4 4"
                  label={{ value: "Previsione →", position: "insideTopRight", fontSize: 11, fill: CHART_COLOR }}
                />
              )}

              {/* Confidence interval band: invisible base (lower) + stacked
                  visible thickness (upper - lower), so the fill occupies
                  exactly the lower→upper range instead of 0→upper. */}
              {chartData.some((d) => d.ciRange !== undefined) && (
                <>
                  <Area
                    type="monotone"
                    dataKey="ciBase"
                    stackId="ci"
                    stroke="none"
                    fill="transparent"
                    legendType="none"
                    tooltipType="none"
                    connectNulls={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="ciRange"
                    stackId="ci"
                    stroke="none"
                    fill={CHART_COLOR}
                    fillOpacity={0.1}
                    legendType="none"
                    tooltipType="none"
                    connectNulls={false}
                  />
                </>
              )}

              {/* Historical area — solid line, flat low-opacity fill (no gradient) */}
              <Area
                type="monotone"
                dataKey="historical"
                stroke={CHART_COLOR}
                strokeWidth={1.5}
                fill={CHART_COLOR}
                fillOpacity={0.15}
                connectNulls
                dot={false}
                activeDot={{ r: 4 }}
                name="Storico"
              />

              {/* Forecast line — same blue, dashed stroke is the only differentiator */}
              {forecast.length > 0 && (
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke={CHART_COLOR}
                  strokeWidth={1.5}
                  strokeDasharray="6 3"
                  dot={false}
                  activeDot={{ r: 5 }}
                  connectNulls
                  name="Previsione"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
