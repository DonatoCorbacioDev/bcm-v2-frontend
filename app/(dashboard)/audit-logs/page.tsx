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

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Creazione",
  UPDATE: "Modifica",
  DELETE: "Eliminazione",
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  Contract: "Contratto",
  ContractTemplate: "Modello di contratto",
  ContractDocument: "Documento contratto",
  ElectronicInvoice: "Fattura elettronica",
  BusinessArea: "Area di business",
  Manager: "Responsabile",
  FinancialType: "Tipo finanziario",
  FinancialValue: "Valore finanziario",
  Organization: "Organizzazione",
  User: "Utente",
  Role: "Ruolo",
  Notification: "Notifica",
  RefreshToken: "Token di accesso",
  PasswordResetToken: "Reimpostazione password",
  VerificationToken: "Verifica account",
  LocalStorage: "File archiviato",
};

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

function entityTypeLabel(entityType: string): string {
  return ENTITY_TYPE_LABELS[entityType] ?? entityType;
}

function actionBadgeVariant(action: string): "default" | "secondary" | "destructive" | "outline" {
  if (action === "CREATE") return "default";
  if (action === "DELETE") return "destructive";
  return "secondary";
}

function actionBadgeClass(action: string): string {
  if (action === "CREATE") return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
  if (action === "DELETE") return "bg-destructive/10 text-destructive";
  return "bg-primary/10 text-primary";
}

function summaryText(log: AuditLogDTO): string {
  const entity = entityTypeLabel(log.entityType);
  const action = actionLabel(log.action).toLowerCase();
  return log.entityId != null ? `${entity} #${log.entityId} — ${action}` : `${entity} — ${action}`;
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
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                {["Data e ora", "Azione", "Tipo entità", "ID entità", "Utente", "Dettagli"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {data.content.map((log) => (
                <tr key={log.id} className="hover:bg-accent">
                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString("it-IT", {
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
                      {actionLabel(log.action)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                    {entityTypeLabel(log.entityType)}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                    {log.entityId}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                    {log.username}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-[240px]">
                    <span title={log.details ?? undefined}>{summaryText(log)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {data.totalElements} risultati totali
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
            >
              Precedente
            </Button>
            <span className="text-sm text-muted-foreground">
              Pagina {page + 1} di {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= data.totalPages - 1}
            >
              Successiva
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
        <div className="p-2 rounded-lg bg-muted">
          <Shield className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Registro attività</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Cronologia delle operazioni di sistema
          </p>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-card rounded-lg border border-border">
        {isLoading ? <SkeletonTable /> : renderTableContent()}
      </div>
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="p-4 space-y-3">
      <div className="h-8 w-full bg-muted rounded animate-pulse" />
      {SKELETON_ROW_KEYS.map((key) => (
        <div key={key} className="h-10 w-full bg-muted rounded animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="flex justify-center mb-4">
        <div className="p-4 rounded-full bg-muted">
          <Shield className="h-8 w-8 text-muted-foreground" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Nessuna attività registrata
      </h3>
      <p className="text-sm text-muted-foreground">
        Le operazioni di sistema verranno registrate qui.
      </p>
    </div>
  );
}
