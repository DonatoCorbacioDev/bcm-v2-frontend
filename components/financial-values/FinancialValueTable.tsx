"use client";

import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FinancialValueTableProps {
  onEditClick: (financialValue: FinancialValue) => void;
}

export default function FinancialValueTable({ onEditClick }: FinancialValueTableProps) {
  const { data, isLoading, isError } = useFinancialValues();
  const financialValues = data ?? [];
  const queryClient = useQueryClient();

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

  const handleDeleteConfirm = () => {
    if (deleteDialog.financialValue?.id) {
      deleteMutation.mutate(deleteDialog.financialValue.id);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading financial values...</div>;
  }

  if (isError) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-red-500">Failed to load financial values</p>
        <p className="text-sm text-gray-400 mt-2">Check API / network</p>
      </div>
    );
  }

  if (financialValues.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500">No financial values found</p>
        <p className="text-sm text-gray-400 mt-2">
          Create your first financial value to get started
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Contract ID</TableHead>
              <TableHead>Type ID</TableHead>
              <TableHead>Area ID</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {financialValues.map((fv) => (
              <TableRow key={fv.id}>
                <TableCell className="font-medium">
                  {fv.month}/{fv.year}
                </TableCell>
                <TableCell>€{fv.financialAmount.toLocaleString()}</TableCell>
                <TableCell>{fv.contractId}</TableCell>
                <TableCell>{fv.financialTypeId}</TableCell>
                <TableCell>{fv.businessAreaId}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
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
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !deleteMutation.isPending &&
          setDeleteDialog({ open, financialValue: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Financial Value</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this financial value for{" "}
              <span className="font-semibold">
                {deleteDialog.financialValue?.month}/{deleteDialog.financialValue?.year}
              </span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, financialValue: null })}
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