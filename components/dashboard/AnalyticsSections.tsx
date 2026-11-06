"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import Link from "next/link";
import { AlertTriangle, BarChart3, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useExpiringContracts } from "@/hooks/useExpiringContracts";
import KPICard from "@/components/dashboard/KPICard";
import ContractStatsChart from "@/components/dashboard/ContractStatsChart";
import { ContractsByAreaChart } from "@/components/dashboard/ContractsByAreaChart";
import { ContractsTimelineChart } from "@/components/dashboard/ContractsTimelineChart";
import { TopManagersChart } from "@/components/dashboard/TopManagersChart";
import { FinancialForecastChart } from "@/components/dashboard/FinancialForecastChart";
import { RiskScoreWidget } from "@/components/dashboard/RiskScoreWidget";
import { InvoicingSummaryWidget } from "@/components/dashboard/InvoicingSummaryWidget";
import { AnomalyWidget } from "@/components/dashboard/AnomalyWidget";
import { AgentInsightsWidget } from "@/components/dashboard/AgentInsightsWidget";
import { RecommendedActions, CRITICAL_RENEWAL_DAYS } from "@/components/dashboard/RecommendedActions";

/**
 * The former dashboard: charts, AI widgets and the end-date-only expiry
 * banner. Off by default (NEXT_PUBLIC_HOME_ANALYTICS): the home page now
 * leads with what to do, and some of these numbers aren't reliable yet (the
 * invoicing summary mixes revenue and costs, the AI widgets run on a very
 * small model). Kept, not deleted, so each can come back once it is.
 */
export function AnalyticsSections() {
  const { data: stats, isLoading, isError } = useDashboardStats();
  const { data: expiringContracts = [], isLoading: isLoadingExpiring, isError: isErrorExpiring } = useExpiringContracts(30);

  // Contracts expiring very soon move into the "Azioni consigliate" panel
  // instead of the general 30-day banner below, so the same contract isn't
  // listed twice at two different urgency levels.
  const criticalRenewals = expiringContracts.filter(
    (c) => c.daysUntilExpiry == null || c.daysUntilExpiry <= CRITICAL_RENEWAL_DAYS
  );
  const nonCriticalExpiring = expiringContracts.filter(
    (c) => c.daysUntilExpiry != null && c.daysUntilExpiry > CRITICAL_RENEWAL_DAYS
  );

  if (isLoading) return null;
  if (isError) {
    return (
      <p className="text-sm text-destructive">Impossibile caricare le statistiche della dashboard</p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Recommended Actions: the most urgent renewals + highest-risk contracts */}
      <RecommendedActions criticalRenewals={criticalRenewals} />

      {/* Expiring Contracts Alert */}
      {isErrorExpiring && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
          <p className="text-sm text-destructive">
            Impossibile caricare i contratti in scadenza
          </p>
        </div>
      )}

      {!isLoadingExpiring && !isErrorExpiring && nonCriticalExpiring.length > 0 && (
        <div className="bg-[var(--status-amber-bg)] border-2 border-[var(--status-amber-fg)]/40 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-[var(--status-amber-bg)] rounded-lg">
                <AlertTriangle className="h-6 w-6 text-[var(--status-amber-fg)]" aria-hidden="true" />
              </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-[var(--status-amber-fg)] mb-2">
                {nonCriticalExpiring.length} contratt{nonCriticalExpiring.length > 1 ? 'i' : 'o'} in scadenza
              </h2>
              <p className="text-sm text-[var(--status-amber-fg)] mb-4">
                I seguenti contratti scadranno nei prossimi 30 giorni. Rinnovali o chiudili.
              </p>
              <div className="space-y-2">
                {nonCriticalExpiring.slice(0, 5).map((contract) => (
                  <Link
                    key={contract.id}
                    href={`/contracts/${contract.id}`}
                    className="block p-3 bg-card rounded border border-[var(--status-amber-fg)]/30 hover:border-[var(--status-amber-fg)] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">
                          {contract.contractNumber} - {contract.counterparty?.name ?? "N/D"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Scade il: {new Date(contract.endDate).toLocaleDateString("it-IT")}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-[var(--status-amber-fg)]">
                        {/* Only contracts with more than CRITICAL_RENEWAL_DAYS left get here. */}
                        {contract.daysUntilExpiry} giorni rimanenti
                      </div>
                    </div>
                  </Link>
                ))}
                {nonCriticalExpiring.length > 5 && (
                  <Link
                    href="/contracts?status=ACTIVE"
                    className="block text-center p-2 text-sm text-[var(--status-amber-fg)] hover:opacity-80 font-medium"
                  >
                    + Mostra altri {nonCriticalExpiring.length - 5} contratti in scadenza
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Contratti totali"
          value={stats?.total ?? 0}
          icon={<BarChart3 className="h-6 w-6" aria-hidden="true" />}
          variant="default"
        />
        <KPICard
          title="Contratti attivi"
          value={stats?.active ?? 0}
          icon={<CheckCircle2 className="h-6 w-6" aria-hidden="true" />}
          variant="success"
        />
        <KPICard
          title="In scadenza"
          value={stats?.expiring ?? 0}
          icon={<Clock className="h-6 w-6" aria-hidden="true" />}
          variant="warning"
        />
        <KPICard
          title="Contratti scaduti"
          value={stats?.expired ?? 0}
          icon={<XCircle className="h-6 w-6" aria-hidden="true" />}
          variant="danger"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Row 1: Distribution + Top Managers (compact, side by side) */}
        <ContractStatsChart
          total={stats?.total ?? 0}
          active={stats?.active ?? 0}
          expiring={stats?.expiring ?? 0}
          expired={stats?.expired ?? 0}
          draft={stats?.draft ?? 0}
        />
        <TopManagersChart />

        {/* Row 2: Timeline full width (benefits from wider view) */}
        <div className="lg:col-span-2">
          <ContractsTimelineChart />
        </div>

        {/* Row 3: Bar by Area full width (area names don't get truncated) */}
        <div className="lg:col-span-2">
          <ContractsByAreaChart />
        </div>

        {/* Row 4: Financial Forecast + Risk Score Widget */}
        <FinancialForecastChart />
        <RiskScoreWidget />

        {/* Row 4.5: Invoicing summary (full width — three KPI tiles read better wide) */}
        <div className="lg:col-span-2">
          <InvoicingSummaryWidget />
        </div>

        {/* Row 5: Financial anomalies (full width — table benefits from wider layout) */}
        <div className="lg:col-span-2">
          <AnomalyWidget />
        </div>

        {/* Row 6: AI narrative synthesis (full width — prose reads better wide) */}
        <div className="lg:col-span-2">
          <AgentInsightsWidget />
        </div>
      </div>
    </div>
  );
}
