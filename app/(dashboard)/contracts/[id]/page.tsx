"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useContract } from "@/hooks/useContract";
import { useAuthStore } from "@/store/authStore";
import { contractsService } from "@/services/contracts.service";
import { contractsQueryKeys } from "@/hooks/queries/contracts.queryKeys";
import { Loader2, ArrowLeft, Pencil, Trash2, DollarSign, History, FileText, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ContractForm from "@/components/contracts/ContractForm";
import DocumentsTab from "@/components/contracts/DocumentsTab";
import InvoicesTab from "@/components/contracts/InvoicesTab";
import api from "@/lib/api";
import { getContractStatusVariant } from "@/lib/utils";
import type { Contract, FinancialValue, ContractHistory } from "@/types";

type Tab = "documents" | "financials" | "history" | "invoices";

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const contractId = Number(params.id);

  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  const { data: contract, isLoading, isError } = useContract(contractId);
  const [activeTab, setActiveTab] = useState<Tab>("documents");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [prefilledContract, setPrefilledContract] = useState<Contract | null>(null);

  const { data: financialValues, isLoading: isLoadingFinancials } = useQuery<FinancialValue[]>({
    queryKey: ["financial-values", "by-contract", contractId],
    queryFn: async () => {
      const response = await api.get(`/financial-values/by-contract/${contractId}`);
      return response.data;
    },
    enabled: !!contractId,
  });

  const { data: contractHistory, isLoading: isLoadingHistory } = useQuery<ContractHistory[]>({
    queryKey: ["contract-history", "by-contract", contractId],
    queryFn: async () => {
      const response = await api.get(`/contract-history/contract/${contractId}`);
      return response.data;
    },
    enabled: !!contractId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await contractsService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractsQueryKeys.all });
      toast.success("Contratto eliminato con successo!");
      router.push("/contracts");
    },
    onError: () => {
      toast.error("Eliminazione del contratto non riuscita");
      setDeleteDialogOpen(false);
    },
  });

  const handleDeleteConfirm = () => {
    if (contractId) deleteMutation.mutate(contractId);
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setPrefilledContract(null);
    queryClient.invalidateQueries({ queryKey: ["contracts", contractId] });
    queryClient.invalidateQueries({ queryKey: ["contract-history", "by-contract", contractId] });
  };

  const handleApplyAnalysis = (detected: Partial<Contract>) => {
    if (!contract) return;
    setPrefilledContract({ ...contract, ...detected });
    setEditDialogOpen(true);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "documents", label: "Documenti", icon: <FileText className="h-4 w-4" /> },
    { id: "financials", label: "Valori finanziari", icon: <DollarSign className="h-4 w-4" /> },
    { id: "history", label: "Cronologia modifiche", icon: <History className="h-4 w-4" /> },
    { id: "invoices", label: "Fatture", icon: <Receipt className="h-4 w-4" /> },
  ];

  const renderFinancialValues = () => {
    if (isLoadingFinancials) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }
    if (!financialValues || financialValues.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-muted">
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Nessun valore finanziario
          </h2>
          <p className="text-sm text-muted-foreground">
            I dati finanziari appariranno qui una volta aggiunti a questo contratto.
          </p>
        </div>
      );
    }
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              {["Tipo", "Area di business", "Importo", "Mese/Anno"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {financialValues.map((fv: FinancialValue) => (
              <tr key={fv.id} className="hover:bg-accent">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">{fv.typeName || "N/D"}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">{fv.areaName || "N/D"}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-foreground">
                  €{fv.financialAmount?.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                  {fv.month}/{fv.year}
                </td>
              </tr>
            ))}
            <tr className="bg-muted font-bold">
              <td colSpan={2} className="px-4 py-3 text-sm text-foreground">Totale</td>
              <td className="px-4 py-3 text-sm text-foreground">
                €{financialValues.reduce((sum: number, fv: FinancialValue) => sum + (fv.financialAmount || 0), 0)
                  .toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderHistory = () => {
    if (isLoadingHistory) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }
    if (!contractHistory || contractHistory.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-muted">
              <History className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Nessuna modifica registrata</h2>
          <p className="text-sm text-muted-foreground">Le modifiche di stato verranno tracciate qui.</p>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {contractHistory.map((history, index) => (
          <div key={history.id} className="flex gap-4 pb-4 border-b border-border last:border-0">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-primary mt-1.5" />
              {index < contractHistory.length - 1 && (
                <div className="w-0.5 flex-1 bg-border mt-2" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-1">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground flex-wrap">
                  <span>Stato modificato:</span>
                  <Badge variant={getContractStatusVariant(history.previousStatus)}>{history.previousStatus}</Badge>
                  <span>→</span>
                  <Badge variant={getContractStatusVariant(history.newStatus)}>{history.newStatus}</Badge>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(history.modificationDate).toLocaleDateString("it-IT", {
                    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Modificato da utente ID: {history.modifiedById}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !contract) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/contracts")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna ai contratti
        </Button>
        <div className="text-center py-12 bg-destructive/10 rounded-lg border border-destructive/30">
          <p className="text-destructive">Contratto non trovato o errore nel caricamento dei dati</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Button variant="ghost" onClick={() => router.push("/contracts")} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna ai contratti
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Dettagli contratto</h1>
          <p className="text-muted-foreground mt-1">{contract.customerName}</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => { setPrefilledContract(null); setEditDialogOpen(true); }}>
              <Pencil className="h-4 w-4 mr-2" />
              Modifica
            </Button>
          )}
          {isAdmin && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Elimina
            </Button>
          )}
        </div>
      </div>

      {/* General Information */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Informazioni generali</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Nome cliente", value: contract.customerName },
            { label: "Numero contratto", value: contract.contractNumber },
            { label: "Nome progetto", value: contract.projectName },
            { label: "Codice WBS", value: contract.wbsCode },
            { label: "Data inizio", value: new Date(contract.startDate).toLocaleDateString() },
            { label: "Data fine", value: new Date(contract.endDate).toLocaleDateString() },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-base font-medium text-foreground">{value}</p>
            </div>
          ))}
          <div>
            <p className="text-sm text-muted-foreground">Stato</p>
            <Badge variant={getContractStatusVariant(contract.status)}>{contract.status}</Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Manager</p>
            <p className="text-base font-medium text-foreground">
              {contract.manager ? `${contract.manager.firstName} ${contract.manager.lastName}` : "Non assegnato"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Area di business</p>
            <p className="text-base font-medium text-foreground">
              {contract.area?.name || "Non assegnato"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card rounded-lg border border-border">
        {/* Tab bar */}
        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === "documents" && (
            <DocumentsTab
              contractId={contractId}
              isAdmin={isAdmin}
              onApply={handleApplyAnalysis}
            />
          )}
          {activeTab === "financials" && renderFinancialValues()}
          {activeTab === "history" && renderHistory()}
          {activeTab === "invoices" && (
            <InvoicesTab contractId={contractId} isAdmin={isAdmin} />
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      {isAdmin && (
        <Dialog open={editDialogOpen} onOpenChange={(open) => { if (!open) { setPrefilledContract(null); } setEditDialogOpen(open); }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Modifica contratto</DialogTitle>
              <DialogDescription>Aggiorna le informazioni del contratto qui sotto</DialogDescription>
            </DialogHeader>
            <ContractForm
              contract={prefilledContract ?? contract}
              onClose={() => { setPrefilledContract(null); setEditDialogOpen(false); }}
              onSuccess={handleEditSuccess}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Dialog */}
      {isAdmin && (
        <Dialog
          open={deleteDialogOpen}
          onOpenChange={(open) => !deleteMutation.isPending && setDeleteDialogOpen(open)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Elimina contratto</DialogTitle>
              <DialogDescription>
                Sei sicuro di voler eliminare il contratto{" "}
                <span className="font-semibold">{contract.contractNumber}</span>{" "}
                ({contract.customerName})? L&apos;operazione non può essere annullata.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleteMutation.isPending}>
                Annulla
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? "Eliminazione..." : "Elimina"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
