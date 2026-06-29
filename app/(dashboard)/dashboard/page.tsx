"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useExpiringContracts } from "@/hooks/useExpiringContracts";
import { useAuthStore } from "@/store/authStore";
import { businessAreasService } from "@/services/businessAreas.service";
import { managersService } from "@/services/managers.service";
import { referenceQueryKeys } from "@/hooks/queries/reference.queryKeys";
import Link from "next/link";
import { AlertTriangle, BarChart3, CheckCircle2, Clock, XCircle } from "lucide-react";
import KPICard from "@/components/dashboard/KPICard";
import KPICardSkeleton from "@/components/dashboard/KPICardSkeleton";
import ContractStatsChart from "@/components/dashboard/ContractStatsChart";
import { ContractsByAreaChart } from "@/components/dashboard/ContractsByAreaChart";
import { ContractsTimelineChart } from "@/components/dashboard/ContractsTimelineChart";
import { TopManagersChart } from "@/components/dashboard/TopManagersChart";
import { FinancialForecastChart } from "@/components/dashboard/FinancialForecastChart";
import { RiskScoreWidget } from "@/components/dashboard/RiskScoreWidget";
import { AnomalyWidget } from "@/components/dashboard/AnomalyWidget";
import { RecommendedActions, CRITICAL_RENEWAL_DAYS } from "@/components/dashboard/RecommendedActions";

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";

  // Setup check: redirect new ADMIN orgs (no areas + no managers) to the onboarding wizard.
  // Queries are disabled for non-admins; enabled queries share cache with the reference hooks.
  const { data: businessAreas = [], isLoading: loadingAreas } = useQuery({
    queryKey: referenceQueryKeys.businessAreas,
    queryFn: businessAreasService.list,
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
  });
  const { data: managers = [], isLoading: loadingManagers } = useQuery({
    queryKey: referenceQueryKeys.managers,
    queryFn: managersService.list,
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!isAdmin || loadingAreas || loadingManagers) return;
    if (localStorage.getItem(`bcm-setup-skip-${user?.id}`)) return;
    if (businessAreas.length === 0 && managers.length === 0) {
      router.push("/onboarding");
    }
  }, [isAdmin, loadingAreas, loadingManagers, businessAreas, managers, router, user?.id]);

  const { data: stats, isLoading, isError } = useDashboardStats();
  const { data: expiringContracts = [], isLoading: isLoadingExpiring, isError: isErrorExpiring } = useExpiringContracts(30);

  // For admin users, keep the skeleton visible until the setup check resolves
  // so there is no flash of dashboard content before a potential redirect.
  const isSetupChecking = isAdmin && (loadingAreas || loadingManagers);

  // Contracts expiring very soon move into the "Azioni consigliate" panel
  // instead of the general 30-day banner below, so the same contract isn't
  // listed twice at two different urgency levels.
  const criticalRenewals = expiringContracts.filter(
    (c) => c.daysUntilExpiry == null || c.daysUntilExpiry <= CRITICAL_RENEWAL_DAYS
  );
  const nonCriticalExpiring = expiringContracts.filter(
    (c) => c.daysUntilExpiry != null && c.daysUntilExpiry > CRITICAL_RENEWAL_DAYS
  );

  // Helper function to format days remaining
  const formatDaysLeft = (days: number | null | undefined): string => {
    if (days === null || days === undefined) {
      return 'In scadenza a breve';
    }
    const dayWord = days === 1 ? 'giorno' : 'giorni';
    return `${days} ${dayWord} rimanenti`;
  };

  if (isLoading || isSetupChecking) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">Panoramica dei tuoi contratti</p>
        </div>

        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <KPICardSkeleton key={i} />
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-80 bg-card rounded-lg border border-border p-6 animate-pulse">
              <div className="h-6 w-32 bg-muted rounded mb-4"></div>
              <div className="flex items-center justify-center h-64">
                <div className="w-48 h-48 rounded-full border-8 border-muted"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">Panoramica dei tuoi contratti</p>
        </div>
        <div className="text-center py-12 bg-destructive/10 rounded-lg border border-destructive/30">
          <p className="text-destructive">
            Impossibile caricare le statistiche della dashboard
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Verifica la connessione all&apos;API
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">Panoramica dei tuoi contratti</p>
      </div>

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
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
              </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                {nonCriticalExpiring.length} contratt{nonCriticalExpiring.length > 1 ? 'i' : 'o'} in scadenza
              </h2>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                I seguenti contratti scadranno nei prossimi 30 giorni. Rinnovali o chiudili.
              </p>
              <div className="space-y-2">
                {nonCriticalExpiring.slice(0, 5).map((contract) => (
                  <Link
                    key={contract.id}
                    href={`/contracts/${contract.id}`}
                    className="block p-3 bg-card rounded border border-yellow-300 dark:border-yellow-700 hover:border-yellow-500 dark:hover:border-yellow-500 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">
                          {contract.contractNumber} - {contract.customerName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Scade il: {new Date(contract.endDate).toLocaleDateString("it-IT")}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                        {formatDaysLeft(contract.daysUntilExpiry)}
                      </div>
                    </div>
                  </Link>
                ))}
                {nonCriticalExpiring.length > 5 && (
                  <Link
                    href="/contracts?status=ACTIVE"
                    className="block text-center p-2 text-sm text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-100 font-medium"
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

        {/* Row 5: Financial anomalies (full width — table benefits from wider layout) */}
        <div className="lg:col-span-2">
          <AnomalyWidget />
        </div>
      </div>
    </div>
  );
}