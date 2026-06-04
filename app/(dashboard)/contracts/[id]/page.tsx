"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useContract } from "@/hooks/useContract";
import { useAuthStore } from "@/store/authStore";
import { contractsService } from "@/services/contracts.service";
import { contractsQueryKeys } from "@/hooks/queries/contracts.queryKeys";
import { Loader2, ArrowLeft, Pencil, Trash2, DollarSign, History, FileText } from "lucide-react";
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
import api from "@/lib/api";
import { getContractStatusVariant } from "@/lib/utils";
import type { Contract, FinancialValue, ContractHistory } from "@/types";

type Tab = "documents" | "financials" | "history";

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
      toast.success("Contract deleted successfully!");
      router.push("/contracts");
    },
    onError: () => {
      toast.error("Failed to delete contract");
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
    { id: "documents", label: "Documents", icon: <FileText className="h-4 w-4" /> },
    { id: "financials", label: "Financial Values", icon: <DollarSign className="h-4 w-4" /> },
    { id: "history", label: "Change History", icon: <History className="h-4 w-4" /> },
  ];

  const renderFinancialValues = () => {
    if (isLoadingFinancials) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        </div>
      );
    }
    if (!financialValues || financialValues.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-700">
              <DollarSign className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Financial Values Yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Financial data will appear here once added to this contract.
          </p>
        </div>
      );
    }
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              {["Type", "Business Area", "Amount", "Month/Year"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {financialValues.map((fv: FinancialValue) => (
              <tr key={fv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">{fv.typeName || "N/A"}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">{fv.areaName || "N/A"}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                  €{fv.financialAmount?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {fv.month}/{fv.year}
                </td>
              </tr>
            ))}
            <tr className="bg-gray-100 dark:bg-gray-900 font-bold">
              <td colSpan={2} className="px-4 py-3 text-sm text-gray-900 dark:text-white">Total</td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                €{financialValues.reduce((sum: number, fv: FinancialValue) => sum + (fv.financialAmount || 0), 0)
                  .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        </div>
      );
    }
    if (!contractHistory || contractHistory.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-700">
              <History className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Change History</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Status changes and modifications will be tracked here.</p>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {contractHistory.map((history, index) => (
          <div key={history.id} className="flex gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mt-1.5" />
              {index < contractHistory.length - 1 && (
                <div className="w-0.5 flex-1 bg-gray-300 dark:bg-gray-600 mt-2" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-1">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white flex-wrap">
                  <span>Status Changed:</span>
                  <Badge variant={getContractStatusVariant(history.previousStatus)}>{history.previousStatus}</Badge>
                  <span>→</span>
                  <Badge variant={getContractStatusVariant(history.newStatus)}>{history.newStatus}</Badge>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {new Date(history.modificationDate).toLocaleDateString("en-US", {
                    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Modified by User ID: {history.modifiedById}
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
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (isError || !contract) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/contracts")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Contracts
        </Button>
        <div className="text-center py-12 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">Contract not found or error loading data</p>
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
            Back to Contracts
          </Button>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Contract Details</h2>
          <p className="text-gray-500 mt-1">{contract.customerName}</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => { setPrefilledContract(null); setEditDialogOpen(true); }}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
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
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* General Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">General Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Customer Name", value: contract.customerName },
            { label: "Contract Number", value: contract.contractNumber },
            { label: "Project Name", value: contract.projectName },
            { label: "WBS Code", value: contract.wbsCode },
            { label: "Start Date", value: new Date(contract.startDate).toLocaleDateString() },
            { label: "End Date", value: new Date(contract.endDate).toLocaleDateString() },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
              <p className="text-base font-medium text-gray-900 dark:text-white">{value}</p>
            </div>
          ))}
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
            <Badge variant={getContractStatusVariant(contract.status)}>{contract.status}</Badge>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manager</p>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {contract.manager ? `${contract.manager.firstName} ${contract.manager.lastName}` : "Not assigned"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Business Area</p>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {contract.area?.name || "Not assigned"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Tab bar */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
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
        </div>
      </div>

      {/* Edit Dialog */}
      {isAdmin && (
        <Dialog open={editDialogOpen} onOpenChange={(open) => { if (!open) { setPrefilledContract(null); } setEditDialogOpen(open); }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Edit Contract</DialogTitle>
              <DialogDescription>Update the contract information below</DialogDescription>
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
              <DialogTitle>Delete Contract</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete contract{" "}
                <span className="font-semibold">{contract.contractNumber}</span>{" "}
                ({contract.customerName})? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleteMutation.isPending}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
