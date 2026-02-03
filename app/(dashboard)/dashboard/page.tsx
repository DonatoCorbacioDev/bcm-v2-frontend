"use client";

import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useExpiringContracts } from "@/hooks/useExpiringContracts";
import Link from "next/link";
import KPICard from "@/components/dashboard/KPICard";
import KPICardSkeleton from "@/components/dashboard/KPICardSkeleton";
import ContractStatsChart from "@/components/dashboard/ContractStatsChart";
import { ContractsByAreaChart } from "@/components/dashboard/ContractsByAreaChart";
import { ContractsTimelineChart } from "@/components/dashboard/ContractsTimelineChart";
import { TopManagersChart } from "@/components/dashboard/TopManagersChart";

export default function DashboardPage() {
  const { data: stats, isLoading, isError } = useDashboardStats();
  const { data: expiringContracts = [], isLoading: isLoadingExpiring } = useExpiringContracts(30);

  // Helper function to format days remaining
  const formatDaysLeft = (days: number | null | undefined): string => {
    if (days === null || days === undefined) {
      return 'Expiring soon';
    }
    const dayWord = days === 1 ? 'day' : 'days';
    return `${days} ${dayWord} left`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h2>
          <p className="text-gray-500 mt-2">Overview of your contracts</p>
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
            <div key={i} className="h-80 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="flex items-center justify-center h-64">
                <div className="w-48 h-48 rounded-full border-8 border-gray-200 dark:border-gray-700"></div>
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
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h2>
          <p className="text-gray-500 mt-2">Overview of your contracts</p>
        </div>
        <div className="text-center py-12 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">
            Failed to load dashboard statistics
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Please check your API connection
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h2>
        <p className="text-gray-500 mt-2">Overview of your contracts</p>
      </div>

      {/* Expiring Contracts Alert */}
      {!isLoadingExpiring && expiringContracts.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">⚠️</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                {expiringContracts.length} Contract{expiringContracts.length > 1 ? 's' : ''} Expiring Soon
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                The following contracts will expire within the next 30 days. Take action to renew or close them.
              </p>
              <div className="space-y-2">
                {expiringContracts.slice(0, 5).map((contract) => (
                  <Link
                    key={contract.id}
                    href={`/contracts/${contract.id}`}
                    className="block p-3 bg-white dark:bg-gray-800 rounded border border-yellow-300 dark:border-yellow-700 hover:border-yellow-500 dark:hover:border-yellow-500 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {contract.contractNumber} - {contract.customerName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Expires: {new Date(contract.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                        {formatDaysLeft(contract.daysUntilExpiry)}
                      </div>
                    </div>
                  </Link>
                ))}
                {expiringContracts.length > 5 && (
                  <Link
                    href="/contracts?status=ACTIVE"
                    className="block text-center p-2 text-sm text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-100 font-medium"
                  >
                    + View {expiringContracts.length - 5} more expiring contracts
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
          title="Total Contracts"
          value={stats?.total ?? 0}
          icon="📊"
          variant="default"
        />
        <KPICard
          title="Active Contracts"
          value={stats?.active ?? 0}
          icon="✅"
          variant="success"
        />
        <KPICard
          title="Expiring Soon"
          value={stats?.expiring ?? 0}
          icon="⏰"
          variant="warning"
        />
        <KPICard
          title="Expired Contracts"
          value={stats?.expired ?? 0}
          icon="❌"
          variant="danger"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contract Status Distribution (Pie Chart) */}
        <ContractStatsChart
          total={stats?.total ?? 0}
          active={stats?.active ?? 0}
          expiring={stats?.expiring ?? 0}
          expired={stats?.expired ?? 0}
        />

        {/* Contracts by Business Area (Bar Chart) */}
        <ContractsByAreaChart />

        {/* Contracts Timeline (Line Chart) */}
        <ContractsTimelineChart />

        {/* Top Managers (Horizontal Bar Chart) */}
        <TopManagersChart />
      </div>
    </div>
  );
}