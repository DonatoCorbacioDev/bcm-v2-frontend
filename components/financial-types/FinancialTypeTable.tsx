"use client";

import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useFinancialTypes } from "@/hooks/useFinancialTypes";
import { financialTypesService } from "@/services/financialTypes.service";
import { referenceQueryKeys } from "@/hooks/queries/reference.queryKeys";
import type { FinancialType } from "@/types";

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

interface FinancialTypeTableProps {
  readonly onEditClick: (financialType: FinancialType) => void;
}

export default function FinancialTypeTable({ onEditClick }: FinancialTypeTableProps) {
  const { data: financialTypes = [], isLoading, isError } = useFinancialTypes();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    if (!searchQuery) return financialTypes;
    const q = searchQuery.toLowerCase();
    return financialTypes.filter(
      (ft) =>
        ft.name.toLowerCase().includes(q) ||
        ft.description.toLowerCase().includes(q)
    );
  }, [financialTypes, searchQuery]);

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    financialType: FinancialType | null;
  }>({ open: false, financialType: null });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => financialTypesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referenceQueryKeys.financialTypes });
      toast.success("Financial type deleted successfully!");
      setDeleteDialog({ open: false, financialType: null });
    },
    onError: () => {
      toast.error("Failed to delete financial type");
    },
  });

  if (isLoading) return <TableSkeleton rows={5} columns={4} />;

  if (isError) {
    return (
      <div className="text-center py-8 text-red-600">
        Failed to load financial types. Please try again.
      </div>
    );
  }

  if (financialTypes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No financial types found. Create your first one!
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex gap-2 md:gap-4 items-center flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search financial types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
        {searchQuery && (
          <Button variant="outline" size="sm" onClick={() => setSearchQuery("")} className="hidden sm:inline-flex">
            Clear
          </Button>
        )}
        <div className="text-xs md:text-sm text-gray-600">
          {filtered.length} / {financialTypes.length} types
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No financial types match your search
        </div>
      )}

      {filtered.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden lg:table-cell">ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((ft) => (
                <TableRow key={ft.id}>
                  <TableCell className="hidden lg:table-cell font-medium text-sm">{ft.id}</TableCell>
                  <TableCell className="text-sm font-medium">{ft.name}</TableCell>
                  <TableCell className="hidden md:table-cell max-w-md truncate text-sm">{ft.description}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditClick(ft)}
                        className="text-blue-600 hover:text-blue-700 text-xs px-2"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteDialog({ open: true, financialType: ft })}
                        className="text-red-600 hover:text-red-700 text-xs px-2"
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

      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => !deleteMutation.isPending && setDeleteDialog({ open, financialType: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Financial Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deleteDialog.financialType?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, financialType: null })}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialog.financialType && deleteMutation.mutate(deleteDialog.financialType.id)}
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
