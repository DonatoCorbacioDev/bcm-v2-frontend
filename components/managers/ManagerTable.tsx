"use client";

import { useState, useMemo } from "react";
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

interface ManagerTableProps {
  readonly onEditClick: (manager: Manager) => void;
}

// Search logic for managers
function useManagerFilters(managers: Manager[]) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredManagers = useMemo(() => {
    return managers.filter((manager) => {
      if (searchQuery === "") return true;

      const query = searchQuery.toLowerCase();
      return (
        manager.firstName.toLowerCase().includes(query) ||
        manager.lastName.toLowerCase().includes(query) ||
        manager.email.toLowerCase().includes(query) ||
        manager.phoneNumber.includes(query) ||
        manager.department.toLowerCase().includes(query)
      );
    });
  }, [managers, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    filteredManagers,
  };
}

export default function ManagerTable({ onEditClick }: ManagerTableProps) {
  const { data, isLoading, isError } = useManagers();
  const managers = data ?? [];
  const queryClient = useQueryClient();

  // Search state
  const { searchQuery, setSearchQuery, filteredManagers } = useManagerFilters(managers);

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
    return <TableSkeleton rows={5} columns={5} />;
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
      {/* Search Bar */}
      <div className="mb-4 flex gap-2 md:gap-4 items-center flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search managers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {searchQuery && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="hidden sm:inline-flex"
          >
            Clear
          </Button>
        )}

        <div className="text-xs md:text-sm text-gray-600">
          {filteredManagers.length} / {managers.length} managers
        </div>
      </div>

      {/* Empty state after search */}
      {filteredManagers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No managers match your search
        </div>
      )}

      {/* Table with Responsive Columns */}
      {filteredManagers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden md:table-cell">Department</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredManagers.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium text-sm">
                    {m.firstName} {m.lastName}
                  </TableCell>
                  <TableCell className="text-sm max-w-[120px] truncate">{m.email}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{m.phoneNumber}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{m.department}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditClick(m)}
                        className="text-blue-600 hover:text-blue-700 text-xs px-1 sm:px-2"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(m)}
                        className="text-red-600 hover:text-red-700 text-xs px-1 sm:px-2"
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