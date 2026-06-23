"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ShieldAlert, WifiOff, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { RiskScore } from "@/types";

const LEVEL_CONFIG = {
  HIGH:   { color: "bg-red-500",    badge: "destructive" as const, label: "High" },
  MEDIUM: { color: "bg-yellow-400", badge: "warning" as const,     label: "Medium" },
  LOW:    { color: "bg-green-500",  badge: "success" as const,     label: "Low" },
};

export function RiskScoreWidget() {
  const {
    data: riskScores,
    isLoading,
    isError,
  } = useQuery<RiskScore[]>({
    queryKey: ["risk-scores"],
    queryFn: async () => {
      const res = await api.get<RiskScore[]>("/risk-scores");
      return res.data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-500" />
          Risk & Anomalies
        </CardTitle>
        <CardDescription>AI-based risk score per contract</CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
            <WifiOff className="h-6 w-6 text-amber-500" />
            <p className="text-sm font-medium text-foreground">
              Risk analysis unavailable
            </p>
            <p className="text-xs text-muted-foreground">
              Make sure the backend and forecasting service are running
            </p>
          </div>
        )}

        {!isLoading && !isError && (!riskScores || riskScores.length === 0) && (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">No risk data available</p>
          </div>
        )}

        {!isLoading && !isError && riskScores && riskScores.length > 0 && (
          <div className="space-y-3">
            {riskScores.map((item) => {
              const cfg = LEVEL_CONFIG[item.level] ?? LEVEL_CONFIG.LOW;
              const pct = Math.round(item.riskScore * 100);

              return (
                <Link
                  key={item.contractId}
                  href={`/contracts/${item.contractId}`}
                  className="block rounded-lg border border-border p-3 hover:border-muted-foreground transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground truncate max-w-[60%]">
                      {item.customerName}
                    </span>
                    <Badge variant={cfg.badge}>{cfg.label} · {pct}%</Badge>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${cfg.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Anomalies */}
                  {item.anomalies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.anomalies.map((a) => (
                        <span
                          key={a}
                          className="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5"
                        >
                          {a.replaceAll("_", " ")}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
