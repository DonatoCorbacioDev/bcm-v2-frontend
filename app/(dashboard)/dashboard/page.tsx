"use client";

import { useDashboardStats } from "@/hooks/useDashboardStats";
import KPICard from "@/components/dashboard/KPICard";

export default function DashboardPage() {
  const { data: stats, isLoading, isError } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h2>
          <p className="text-gray-500 mt-2">Overview of your contracts</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            />
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
    </div>
  );
}