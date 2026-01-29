"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

  // Log user data
  console.log("🔍 Debug Contract Detail Page:");
  console.log("User from store:", user);
  console.log("Is Admin?", isAdmin);
  console.log("User role:", user?.role);

  const { data: contract, isLoading, isError } = useContract(contractId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
            <Button variant="outline" size="sm">
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

      {/* Financial Values Section (Placeholder) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Financial Values
        </h3>
        <p className="text-sm text-gray-500">
          Financial values associated with this contract will be displayed here.
        </p>
      </div>

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