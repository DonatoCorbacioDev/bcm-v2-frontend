"use client";

import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useFinancialValues, financialValuesQueryKeys } from "@/hooks/useFinancialValues";
import { financialValuesService } from "@/services/financialValues.service";
import type { FinancialValue } from "@/types";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface FinancialValueTableProps {
  readonly onEditClick: (financialValue: FinancialValue) => void;
}

// Search and filter logic for financial values
function useFinancialValueFilters(financialValues: FinancialValue[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState<string>("ALL");

  const filteredFinancialValues = useMemo(() => {
    return financialValues.filter((fv) => {
      // Search filter (year or amount)
      const matchesSearch =
        searchQuery === "" ||
        fv.year.toString().includes(searchQuery) ||
        fv.financialAmount.toString().includes(searchQuery);

      // Month filter
      const matchesMonth =
        monthFilter === "ALL" || fv.month.toString() === monthFilter;

      return matchesSearch && matchesMonth;
    });
  }, [financialValues, searchQuery, monthFilter]);

  return {
    searchQuery,
    setSearchQuery,
    monthFilter,
    setMonthFilter,
    filteredFinancialValues,
  };
}

export default function FinancialValueTable({ onEditClick }: FinancialValueTableProps) {
  const { data: financialValues = [], isLoading, isError } = useFinancialValues();
  const queryClient = useQueryClient();

  // Search and filter state
  const {
    searchQuery,
    setSearchQuery,
    monthFilter,
    setMonthFilter,
    filteredFinancialValues,
  } = useFinancialValueFilters(financialValues);

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    financialValue: FinancialValue | null;
  }>({ open: false, financialValue: null });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await financialValuesService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialValuesQueryKeys.all });
      toast.success("Financial value deleted successfully!");
      setDeleteDialog({ open: false, financialValue: null });
    },
    onError: () => {
      toast.error("Failed to delete financial value");
    },
  });

  const handleDeleteClick = (financialValue: FinancialValue) => {
    setDeleteDialog({ open: true, financialValue });
  };

  const confirmDelete = () => {
    if (deleteDialog.financialValue) {
      deleteMutation.mutate(deleteDialog.financialValue.id);
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return months[month - 1] || month;
  };

  if (isLoading) {
    return <TableSkeleton rows={5} columns={6} />;
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-red-600">
        Failed to load financial values. Please try again.
      </div>
    );
  }

  if (financialValues.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No financial values found. Create your first one!
      </div>
    );
  }

  return (
    <>
      {/* Search and Filters */}
      <div className="mb-4 flex gap-4 items-center flex-wrap">
        <div className="flex-1 min-w-[300px]">
          <Input
            placeholder="Search by year or amount..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-600">Month:</span>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All</option>
            <option value="1">January</option>
            <option value="2">February</option>
            <option value="3">March</option>
            <option value="4">April</option>
            <option value="5">May</option>
            <option value="6">June</option>
            <option value="7">July</option>
            <option value="8">August</option>
            <option value="9">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>

          {(searchQuery || monthFilter !== "ALL") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setMonthFilter("ALL");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        <div className="text-sm text-gray-600">
          {filteredFinancialValues.length} / {financialValues.length} values
        </div>
      </div>

      {/* Empty state after filtering */}
      {filteredFinancialValues.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No financial values match your filters
        </div>
      )}

      {/* Table */}
      {filteredFinancialValues.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Contract ID</TableHead>
                <TableHead>Type ID</TableHead>
                <TableHead>Area ID</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFinancialValues.map((fv) => (
                <TableRow key={fv.id}>
                  <TableCell className="font-medium">
                    {getMonthName(fv.month)}/{fv.year}
                  </TableCell>
                  <TableCell>€{fv.financialAmount.toLocaleString()}</TableCell>
                  <TableCell>{fv.contractId}</TableCell>
                  <TableCell>{fv.financialTypeId}</TableCell>
                  <TableCell>{fv.businessAreaId}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditClick(fv)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(fv)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, financialValue: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Financial Value</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this financial value? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, financialValue: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
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