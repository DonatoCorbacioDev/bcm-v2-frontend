"use client";

import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { useContracts } from "@/hooks/useContracts";
import { contractsQueryKeys } from "@/hooks/queries/contracts.queryKeys";
import type { Contract } from "@/types";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { TableSkeleton } from "@/components/ui/table-skeleton";

interface ContractTableProps {
  onEditClick: (contract: Contract) => void;
}

// Search and filter logic
function useContractFilters(contracts: Contract[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        contract.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.contractNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.wbsCode.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === "ALL" || contract.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [contracts, searchQuery, statusFilter]);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredContracts,
  };
}

export default function ContractTable({ onEditClick }: ContractTableProps) {
  const { data, isLoading, isError } = useContracts();
  const contracts = data ?? [];
  const queryClient = useQueryClient();
  const router = useRouter();

  // Search and filter state
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredContracts,
  } = useContractFilters(contracts);

  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    contract: Contract | null;
  }>({ open: false, contract: null });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contracts/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${document.cookie.split("auth_token=")[1]?.split(";")[0]}`,
        },
      });
      if (!response.ok) throw new Error("Failed to delete contract");
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractsQueryKeys.list() });
      toast.success("Contract deleted successfully!");
      setDeleteDialog({ open: false, contract: null });
    },
    onError: () => {
      toast.error("Failed to delete contract");
    },
  });

  const handleDeleteClick = (contract: Contract) => {
    setDeleteDialog({ open: true, contract });
  };

  const handleDeleteConfirm = () => {
    if (deleteDialog.contract?.id) {
      deleteMutation.mutate(deleteDialog.contract.id);
    }
  };

  const getStatusBadge = (status: Contract["status"]) => {
    const variants: Record<
      Contract["status"],
      "default" | "secondary" | "destructive"
    > = {
      ACTIVE: "default",
      EXPIRED: "secondary",
      CANCELLED: "destructive",
    };
    return variants[status] ?? "secondary";
  };

  if (isLoading) {
    return <TableSkeleton rows={5} columns={9} />;
  }

  if (isError) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-red-500">Failed to load contracts</p>
        <p className="text-sm text-gray-400 mt-2">
          Check API / network / auth token
        </p>
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500">No contracts found</p>
        <p className="text-sm text-gray-400 mt-2">
          Create your first contract to get started
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Search and Filters */}
      <div className="mb-4 flex gap-4 items-center flex-wrap">
        <div className="flex-1 min-w-[300px]">
          <Input
            placeholder="Search contracts (name, number, project, WBS)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-600">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {(searchQuery || statusFilter !== "ALL") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        <div className="text-sm text-gray-600">
          {filteredContracts.length} / {contracts.length} contracts
        </div>
      </div>

      {/* Empty state after filtering */}
      {filteredContracts.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500">No contracts match your filters</p>
          <p className="text-sm text-gray-400 mt-2">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}

      {/* Table */}
      {filteredContracts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract Number</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>WBS Code</TableHead>
                <TableHead>Manager ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    {c.contractNumber}
                  </TableCell>
                  <TableCell>{c.customerName}</TableCell>
                  <TableCell>{c.projectName}</TableCell>
                  <TableCell>{c.wbsCode}</TableCell>
                  <TableCell>{c.managerId}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(c.status)}>{c.status}</Badge>
                  </TableCell>
                  <TableCell>{c.startDate}</TableCell>
                  <TableCell>{c.endDate || "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/contracts/${c.id}`)}
                        className="text-green-600 hover:text-green-700"
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditClick(c)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(c)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !deleteMutation.isPending &&
          setDeleteDialog({ open, contract: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contract</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete contract{" "}
              <span className="font-semibold">
                {deleteDialog.contract?.contractNumber}
              </span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, contract: null })}
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
    </>
  );
}