"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

interface AuditLogDTO {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  username: string;
  orgId: number;
  timestamp: string;
  details: string | null;
}

interface SpringPage<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

function actionBadgeVariant(action: string): "default" | "secondary" | "destructive" | "outline" {
  if (action === "CREATE") return "default";
  if (action === "DELETE") return "destructive";
  return "secondary";
}

function actionBadgeClass(action: string): string {
  if (action === "CREATE") return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
  if (action === "DELETE") return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
}

const PAGE_SIZE = 20;
const SKELETON_ROW_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"];

export default function AuditLogsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [page, setPage] = useState(0);

  if (user?.role !== "ADMIN") {
    router.replace("/dashboard");
    return null;
  }

  return <AuditLogsContent page={page} onPageChange={setPage} />;
}

function AuditLogsContent({
  page,
  onPageChange,
}: {
  readonly page: number;
  readonly onPageChange: (p: number) => void;
}) {
  const { data, isLoading } = useQuery<SpringPage<AuditLogDTO>>({
    queryKey: ["audit-logs", page],
    queryFn: async () => {
      const res = await api.get("/audit-logs", {
        params: { page, size: PAGE_SIZE, sort: "timestamp,desc" },
      });
      return res.data;
    },
  });

  const renderTableContent = () => {
    if (!data || data.content.length === 0) return <EmptyState />;
    return (
      <>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {["Timestamp", "Action", "Entity Type", "Entity ID", "Username", "Details"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data.content.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge
                      variant={actionBadgeVariant(log.action)}
                      className={actionBadgeClass(log.action)}
                    >
                      {log.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                    {log.entityType}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {log.entityId}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                    {log.username}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-[240px]">
                    {log.details ? (
                      <span title={log.details}>
                        {log.details.length > 60
                          ? `${log.details.slice(0, 60)}…`
                          : log.details}
                      </span>
                    ) : (
                      <span className="italic text-gray-400 dark:text-gray-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {data.totalElements} total entries
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {page + 1} of {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= data.totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
          <Shield className="h-6 w-6 text-gray-600 dark:text-gray-300" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Audit Log</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            System operations history
          </p>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {isLoading ? <SkeletonTable /> : renderTableContent()}
      </div>
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="p-4 space-y-3">
      <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      {SKELETON_ROW_KEYS.map((key) => (
        <div key={key} className="h-10 w-full bg-gray-100 dark:bg-gray-750 rounded animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="flex justify-center mb-4">
        <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-700">
          <Shield className="h-8 w-8 text-gray-400 dark:text-gray-500" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        No Audit Logs Yet
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        System operations will be tracked here.
      </p>
    </div>
  );
}
