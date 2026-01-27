"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useManagers } from "@/hooks/useManagers";
import { managersService } from "@/services/managers.service";
import { referenceQueryKeys } from "@/hooks/queries/reference.queryKeys";
import type { Manager } from "@/types";

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

interface ManagerTableProps {
  onEditClick: (manager: Manager) => void;
}

export default function ManagerTable({ onEditClick }: ManagerTableProps) {
  const { data, isLoading, isError } = useManagers();
  const managers = data ?? [];
  const queryClient = useQueryClient();

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    manager: Manager | null;
  }>({ open: false, manager: null });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await managersService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referenceQueryKeys.managers });
      toast.success("Manager deleted successfully!");
      setDeleteDialog({ open: false, manager: null });
    },
    onError: () => {
      toast.error("Failed to delete manager");
    },
  });

  const handleDeleteClick = (manager: Manager) => {
    setDeleteDialog({ open: true, manager });
  };

  const handleDeleteConfirm = () => {
    if (deleteDialog.manager?.id) {
      deleteMutation.mutate(deleteDialog.manager.id);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading managers...</div>;
  }

  if (isError) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-red-500">Failed to load managers</p>
        <p className="text-sm text-gray-400 mt-2">Check API / network</p>
      </div>
    );
  }

  if (managers.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500">No managers found</p>
        <p className="text-sm text-gray-400 mt-2">
          Create your first manager to get started
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {managers.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">
                  {m.firstName} {m.lastName}
                </TableCell>
                <TableCell>{m.email}</TableCell>
                <TableCell>{m.phoneNumber}</TableCell>
                <TableCell>{m.department}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditClick(m)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(m)}
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
          setDeleteDialog({ open, manager: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Manager</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {deleteDialog.manager?.firstName}{" "}
                {deleteDialog.manager?.lastName}
              </span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, manager: null })}
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