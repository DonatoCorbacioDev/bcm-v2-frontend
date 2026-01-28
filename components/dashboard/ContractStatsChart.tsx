"use client";

import { PieChart, Pie, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface ContractStatsChartProps {
  readonly total: number;
  readonly active: number;
  readonly expiring: number;
  readonly expired: number;
}

export default function ContractStatsChart({
  total,
  active,
  expiring,
  expired,
}: ContractStatsChartProps) {
  // Prepare data for pie chart with fill property
  const data = [
    { name: "Active", value: active, fill: "#10b981" }, // green
    { name: "Expiring Soon", value: expiring, fill: "#f59e0b" }, // orange
    { name: "Expired", value: expired, fill: "#ef4444" }, // red
  ];

  // Filter out zero values
  const chartData = data.filter((item) => item.value > 0);

  if (total === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Contract Distribution
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No contracts available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Contract Distribution
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`
            }
            outerRadius={80}
            dataKey="value"
          />
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}