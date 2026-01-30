"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { useContractsPaged } from "@/hooks/useContractsPaged";
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
  readonly onEditClick: (contract: Contract) => void;
}

export default function ContractTable({ onEditClick }: ContractTableProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Pagination state
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Search and filter state (server-side now)
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Use paginated hook with params
  const { data, isLoading, isError } = useContractsPaged({
    page,
    size: pageSize,
    query: searchQuery,
    status: statusFilter,
  });

  // Extract data from PageResponse
  const contracts = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

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
      "success" | "secondary" | "destructive"
    > = {
      ACTIVE: "success",
      EXPIRED: "destructive",
      CANCELLED: "secondary",
    };
    return variants[status] ?? "secondary";
  };

  // Handle filter changes (reset to page 0)
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(0);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setPage(0);
  };

  if (isLoading) {
    return <TableSkeleton rows={pageSize} columns={9} />;
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

  if (totalElements === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500">No contracts found</p>
        <p className="text-sm text-gray-400 mt-2">
          {searchQuery || statusFilter !== "ALL"
            ? "Try adjusting your search or filter criteria"
            : "Create your first contract to get started"}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Search and Filters */}
      <div className="mb-4 flex gap-2 md:gap-4 items-center flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search contracts..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-600 hidden sm:inline">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-2 md:px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              onClick={handleClearFilters}
              className="hidden sm:inline-flex"
            >
              Clear
            </Button>
          )}
        </div>

        <div className="text-xs md:text-sm text-gray-600">
          {totalElements} contract{totalElements === 1 ? "" : "s"}
        </div>
      </div>

      {/* Table with Responsive Columns */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden md:table-cell">Project</TableHead>
              <TableHead className="hidden lg:table-cell">WBS Code</TableHead>
              <TableHead className="hidden lg:table-cell">Manager ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Start Date</TableHead>
              <TableHead className="hidden lg:table-cell">End Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium text-sm">
                  {c.contractNumber}
                </TableCell>
                <TableCell className="text-sm">{c.customerName}</TableCell>
                <TableCell className="hidden md:table-cell text-sm">{c.projectName}</TableCell>
                <TableCell className="hidden lg:table-cell text-sm">{c.wbsCode}</TableCell>
                <TableCell className="hidden lg:table-cell text-sm">{c.managerId}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadge(c.status)} className="text-xs">
                    {c.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm">{c.startDate}</TableCell>
                <TableCell className="hidden lg:table-cell text-sm">{c.endDate || "N/A"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/contracts/${c.id}`)}
                      className="text-green-600 hover:text-green-700 text-xs px-2"
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditClick(c)}
                      className="text-blue-600 hover:text-blue-700 text-xs px-2 hidden sm:inline-flex"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(c)}
                      className="text-red-600 hover:text-red-700 text-xs px-2 hidden sm:inline-flex"
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 md:px-6 py-4 border-t border-gray-200 dark:border-gray-700 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm text-gray-600">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(0);
                }}
                className="px-2 py-1 border border-gray-300 rounded text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <span className="text-xs md:text-sm text-gray-600">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(0)}
                  disabled={page === 0}
                  className="text-xs px-2"
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                  className="text-xs px-2"
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages - 1}
                  className="text-xs px-2"
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(totalPages - 1)}
                  disabled={page >= totalPages - 1}
                  className="text-xs px-2"
                >
                  Last
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

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