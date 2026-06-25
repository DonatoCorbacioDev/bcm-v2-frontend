"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WifiOff, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useFinancialValues } from "@/hooks/useFinancialValues";
import type { ForecastResponse, ForecastPoint, FinancialValue } from "@/types";

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
  lower?: number;
  upper?: number;
}

function buildChartData(
  historical: ForecastPoint[],
  forecast: ForecastPoint[],
): ChartPoint[] {
  const histPoints: ChartPoint[] = historical.map((p) => ({ month: p.month, historical: p.amount }));
  const forePoints: ChartPoint[] = forecast.map((p) => ({
    month: p.month,
    forecast: p.amount,
    lower: p.lower,
    upper: p.upper,
  }));
  // Join last historical point with first forecast for visual continuity
  if (histPoints.length > 0 && forePoints.length > 0) {
    const last = histPoints.at(-1)!
    forePoints[0] = { ...forePoints[0], historical: last.historical };
  }
  return [...histPoints, ...forePoints];
}

const formatEur = (v: number) =>
  `€${v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

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
    forecastData?.historical ?? aggregateHistorical(financialValues ?? []);
  const forecast = forecastData?.forecast ?? [];
  const chartData = buildChartData(historical, forecast);

  const firstForecastMonth = forecast[0]?.month;

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle>Previsione finanziaria</CardTitle>
            <CardDescription>
              Valori finanziari storici{isForecastOffline ? "" : ` + previsione a ${horizon} mesi`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isForecastOffline && (
              <span className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full">
                <WifiOff className="h-3 w-3" />
                Previsione non disponibile
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

      <CardContent>
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
              <defs>
                <linearGradient id="histGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ciGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={formatEur} tick={{ fontSize: 11 }} width={70} />
              <Tooltip
                formatter={(value, name) => {
                  const labels: Record<string, string> = {
                    historical: "Storico",
                    forecast: "Previsione",
                    upper: "Limite superiore",
                    lower: "Limite inferiore",
                  };
                  return [formatEur(value as number), labels[name as string] ?? name];
                }}
              />
              <Legend />

              {firstForecastMonth && (
                <ReferenceLine
                  x={firstForecastMonth}
                  stroke="#a855f7"
                  strokeDasharray="4 4"
                  label={{ value: "Previsione →", position: "insideTopRight", fontSize: 11, fill: "#a855f7" }}
                />
              )}

              {/* Confidence interval band */}
              {forecast.length > 0 && forecast[0].upper !== undefined && (
                <Area
                  type="monotone"
                  dataKey="upper"
                  stroke="none"
                  fill="url(#ciGradient)"
                  legendType="none"
                  connectNulls
                />
              )}

              {/* Historical area */}
              <Area
                type="monotone"
                dataKey="historical"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#histGradient)"
                connectNulls
                dot={false}
                activeDot={{ r: 4 }}
                name="historical"
              />

              {/* Forecast line */}
              {forecast.length > 0 && (
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#a855f7"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={{ r: 3, fill: "#a855f7" }}
                  activeDot={{ r: 5 }}
                  connectNulls
                  name="forecast"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
