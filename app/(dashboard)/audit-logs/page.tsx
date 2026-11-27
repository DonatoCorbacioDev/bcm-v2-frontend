"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { shortId } from "@/lib/shortId";

interface AuditLogDTO {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  username: string;
  orgId: string;
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
  // Recorded explicitly by the backend (auditLogService.save) for the events
  // that aren't a plain create/update/delete.
  TERMS_ACCEPTED: "Accettazione dei Termini",
  DATA_EXPORTED: "Esportazione dei dati",
  ORGANIZATION_DELETION_SCHEDULED: "Cancellazione richiesta",
  ORGANIZATION_DELETION_CANCELLED: "Cancellazione annullata",
  VERIFIED_IBAN_LEARNED: "IBAN verificato registrato",
  VERIFIED_IBAN_CONFIRMED: "IBAN verificato confermato",
  SEPA_IBAN_MISMATCH_BLOCKED: "Pagamento bloccato: IBAN diverso",
  SEPA_UNVERIFIED_IBAN_REFUSED: "Pagamento bloccato: IBAN non ancora verificato",
  TIER_CHANGED: "Cambio di piano",
  ROLE_CHANGED: "Cambio di ruolo",
  NEW_DEVICE_SIGN_IN: "Accesso da un nuovo dispositivo",
  TOTP_ENABLED: "Verifica in 2 passaggi attivata",
  TOTP_DISABLED: "Verifica in 2 passaggi disattivata",
  PASSWORD_CHANGED: "Password cambiata",
  PASSWORD_RESET: "Password reimpostata con il link via email",
  USER_INVITED: "Utente invitato",
  INVITE_ACCEPTED: "Invito accettato",
  CALENDAR_FEED_REGENERATED: "Link del calendario rigenerato",
  // Security events (SecurityEvents on the backend).
  SECURITY_LOGIN_FAILED: "Accesso fallito: password sbagliata",
  SECURITY_MFA_FAILED: "Accesso fallito: codice della verifica in 2 passaggi sbagliato",
  SECURITY_ACCOUNT_LOCKED: "Account bloccato per troppi tentativi",
  SECURITY_REFRESH_REUSE: "Sessione rubata: sessioni chiuse",
  SECURITY_INVALID_TOKEN: "Token di sessione non valido",
  SECURITY_ACCESS_DENIED: "Accesso negato",
  SECURITY_RATE_LIMITED: "Troppe richieste",
  SECURITY_COST_LIMITED: "Limite di operazioni superato",
  SECURITY_WRITE_LIMITED: "Troppe modifiche al minuto",
  SECURITY_DEMO_BLOCKED: "Azione disattivata nella demo",
  SECURITY_REGISTRATION_CODE_REFUSED: "Codice di registrazione rifiutato",
  SECURITY_DUPLICATE_PAYMENT_REFUSED: "Pagamento duplicato rifiutato",
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  Contract: "Contratto",
  Counterparty: "Controparte",
  Billing: "Abbonamento",
  ContractTemplate: "Modello di contratto",
  ContractDocument: "Documento contratto",
  ContractHistory: "Storico contratto",
  ElectronicInvoice: "Fattura elettronica",
  BusinessArea: "Area di business",
  Budget: "Budget",
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
  RiskFeedback: "Riscontro rischio",
  SepaPayment: "Pagamento SEPA",
};

// What a create, change or delete was about, in words: "un contratto".
const ENTITY_PHRASES: Record<string, string> = {
  Contract: "un contratto",
  Counterparty: "una controparte",
  Billing: "l'abbonamento",
  ContractTemplate: "un modello di contratto",
  ContractDocument: "un documento di un contratto",
  ContractHistory: "lo storico di un contratto",
  ElectronicInvoice: "una fattura elettronica",
  BusinessArea: "un'area di business",
  Budget: "un budget",
  Manager: "un responsabile",
  FinancialType: "un tipo finanziario",
  FinancialValue: "un valore finanziario",
  Organization: "i dati dell'organizzazione",
  User: "un utente",
  Role: "un ruolo",
  Notification: "una notifica",
  LocalStorage: "un file",
  RiskFeedback: "un riscontro sul rischio",
  SepaPayment: "un pagamento SEPA",
};

const VERBS: Record<string, string> = { CREATE: "Ha creato", UPDATE: "Ha modificato", DELETE: "Ha eliminato" };

function actionLabel(action: string): string {
  // A code not translated yet still reads as words: "SOME_EVENT" → "some event".
  return ACTION_LABELS[action] ?? action.toLowerCase().replaceAll("_", " ");
}

function entityTypeLabel(entityType: string): string {
  return ENTITY_TYPE_LABELS[entityType] ?? entityType;
}

/** The kind of event, for the badge: four words to scan the list by. */
function kindOf(action: string): { label: string; className: string } {
  if (action === "CREATE") return { label: "Creazione", className: "bg-[var(--status-green-bg)] text-[var(--status-green-fg)]" };
  if (action === "UPDATE") return { label: "Modifica", className: "bg-primary/10 text-primary" };
  if (action === "DELETE") return { label: "Eliminazione", className: "bg-[var(--status-red-bg)] text-[var(--status-red-fg)]" };
  if (action.startsWith("SECURITY_") || action.startsWith("SEPA_")) {
    return { label: "Sicurezza", className: "bg-[var(--status-amber-bg)] text-[var(--status-amber-fg)]" };
  }
  return { label: "Account", className: "bg-muted text-muted-foreground" };
}

/** The event as a sentence: "Ha creato un budget", "Verifica in 2 passaggi attivata". */
function sentenceOf(log: Pick<AuditLogDTO, "action" | "entityType">): string {
  const verb = VERBS[log.action];
  if (!verb) return actionLabel(log.action);
  return `${verb} ${ENTITY_PHRASES[log.entityType] ?? entityTypeLabel(log.entityType).toLowerCase()}`;
}

/** For support: the record's type and short id, on hover only. */
function technicalHint(log: AuditLogDTO): string {
  const ref = log.entityId == null ? entityTypeLabel(log.entityType) : `${entityTypeLabel(log.entityType)} #${shortId(log.entityId)}`;
  return log.details ? `${ref} · ${log.details}` : ref;
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
                {["Quando", "Chi", "Cosa è successo", "Tipo"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-muted-foreground"
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
                  <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                    {log.username}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    <span title={technicalHint(log)}>{sentenceOf(log)}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge variant="secondary" className={kindOf(log.action).className}>
                      {kindOf(log.action).label}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {data.totalElements === 1
              ? "1 risultato totale"
              : `${data.totalElements} risultati totali`}
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
            Chi ha fatto cosa, e quando: serve a ricostruire una modifica o un accesso sospetto.
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
