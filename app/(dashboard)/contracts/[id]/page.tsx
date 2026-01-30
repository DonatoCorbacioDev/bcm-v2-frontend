"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useContract } from "@/hooks/useContract";
import { useAuthStore } from "@/store/authStore";
import { contractsService } from "@/services/contracts.service";
import { contractsQueryKeys } from "@/hooks/queries/contracts.queryKeys";
import { Loader2, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ContractForm from "@/components/contracts/ContractForm";
import api from "@/lib/api";
import type { FinancialValue, ContractHistory } from "@/types";

// Helper function for status badge colors
function getStatusBadgeClass(status: string): string {
  if (status === "ACTIVE") {
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  }
  if (status === "EXPIRED") {
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  }
  return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
}

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const contractId = Number(params.id);

  // Get current user to check permissions
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const { data: contract, isLoading, isError } = useContract(contractId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Fetch financial values for this contract
  const {
    data: financialValues,
    isLoading: isLoadingFinancials
  } = useQuery<FinancialValue[]>({
    queryKey: ["financial-values", "by-contract", contractId],
    queryFn: async () => {
      const response = await api.get(`/financial-values/by-contract/${contractId}`);
      return response.data;
    },
    enabled: !!contractId,
  });

  // Fetch contract history
  const {
    data: contractHistory,
    isLoading: isLoadingHistory
  } = useQuery<ContractHistory[]>({
    queryKey: ["contract-history", "by-contract", contractId],
    queryFn: async () => {
      const response = await api.get(`/contract-history/contract/${contractId}`);
      return response.data;
    },
    enabled: !!contractId,
  });

  // Delete mutation
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

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (contractId) {
      deleteMutation.mutate(contractId);
    }
  };

  const handleEditClick = () => {
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);

    queryClient.invalidateQueries({
      queryKey: ["contracts", contractId]
    });
    queryClient.invalidateQueries({
      queryKey: ["contract-history", "by-contract", contractId]
    });
  };

  // Helper function to render Financial Values section content
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
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No financial values found for this contract.
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Business Area
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Month/Year
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {financialValues.map((fv: FinancialValue) => (
              <tr key={fv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {fv.typeName || 'N/A'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {fv.areaName || 'N/A'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                  €{fv.financialAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {fv.month}/{fv.year}
                </td>
              </tr>
            ))}

            {/* Total Row */}
            <tr className="bg-gray-100 dark:bg-gray-900 font-bold">
              <td colSpan={2} className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                Total
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                €{financialValues.reduce((sum: number, fv: FinancialValue) =>
                  sum + (fv.financialAmount || 0), 0
                ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Helper function to render Contract History section
  const renderContractHistory = () => {
    if (isLoadingHistory) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        </div>
      );
    }

    if (!contractHistory || contractHistory.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No history records found for this contract.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {contractHistory.map((history, index) => (
          <div
            key={history.id}
            className="flex gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0"
          >
            {/* Timeline dot */}
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mt-1.5"></div>
              {index < contractHistory.length - 1 && (
                <div className="w-0.5 flex-1 bg-gray-300 dark:bg-gray-600 mt-2"></div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Status Changed: <span className="text-orange-600 dark:text-orange-400">{history.previousStatus}</span> → <span className="text-green-600 dark:text-green-400">{history.newStatus}</span>
                </p>
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {new Date(history.modificationDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (isError || !contract) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/contracts")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Contracts
        </Button>
        <div className="text-center py-12 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">
            Contract not found or error loading data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push("/contracts")}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contracts
          </Button>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Contract Details
          </h2>
          <p className="text-gray-500 mt-1">{contract.customerName}</p>
        </div>
        <div className="flex gap-2">
          {/* Show Edit button only for ADMIN */}
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditClick}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {/* Show Delete button only for ADMIN */}
          {isAdmin && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteClick}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Contract Information Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          General Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Customer Name</p>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {contract.customerName}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Contract Number</p>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {contract.contractNumber}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Project Name</p>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {contract.projectName}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">WBS Code</p>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {contract.wbsCode}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Start Date</p>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {new Date(contract.startDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">End Date</p>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {new Date(contract.endDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                contract.status
              )}`}
            >
              {contract.status}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manager</p>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {contract.manager
                ? `${contract.manager.firstName} ${contract.manager.lastName}`
                : "Not assigned"}
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

      {/* Financial Values Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Financial Values
        </h3>

        {renderFinancialValues()}
      </div>

      {/* Contract History Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Change History
        </h3>

        {renderContractHistory()}
      </div>

      {/* Edit Dialog */}
      {isAdmin && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Contract</DialogTitle>
              <DialogDescription>
                Update the contract information below
              </DialogDescription>
            </DialogHeader>

            {contract && (
              <ContractForm
                contract={contract}
                onClose={() => setEditDialogOpen(false)}
                onSuccess={handleEditSuccess}
              />
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
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
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}