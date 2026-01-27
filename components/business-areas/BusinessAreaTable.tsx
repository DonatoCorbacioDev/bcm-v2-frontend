"use client";

import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useBusinessAreas } from "@/hooks/useBusinessAreas";
import { businessAreasService } from "@/services/businessAreas.service";
import { referenceQueryKeys } from "@/hooks/queries/reference.queryKeys";
import type { BusinessArea } from "@/types";

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

interface BusinessAreaTableProps {
  readonly onEditClick: (businessArea: BusinessArea) => void;
}

// Search logic for business areas
function useBusinessAreaFilters(businessAreas: BusinessArea[]) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBusinessAreas = useMemo(() => {
    return businessAreas.filter((area) => {
      if (searchQuery === "") return true;

      const query = searchQuery.toLowerCase();
      return (
        area.name.toLowerCase().includes(query) ||
        area.description.toLowerCase().includes(query)
      );
    });
  }, [businessAreas, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    filteredBusinessAreas,
  };
}

export default function BusinessAreaTable({ onEditClick }: BusinessAreaTableProps) {
  const { data: businessAreas = [], isLoading, isError } = useBusinessAreas();
  const queryClient = useQueryClient();

  // Search state
  const { searchQuery, setSearchQuery, filteredBusinessAreas } = useBusinessAreaFilters(businessAreas);

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    businessArea: BusinessArea | null;
  }>({ open: false, businessArea: null });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await businessAreasService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referenceQueryKeys.businessAreas });
      toast.success("Business area deleted successfully!");
      setDeleteDialog({ open: false, businessArea: null });
    },
    onError: () => {
      toast.error("Failed to delete business area");
    },
  });

  const handleDeleteClick = (businessArea: BusinessArea) => {
    setDeleteDialog({ open: true, businessArea });
  };

  const confirmDelete = () => {
    if (deleteDialog.businessArea) {
      deleteMutation.mutate(deleteDialog.businessArea.id);
    }
  };

  if (isLoading) {
    return <TableSkeleton rows={5} columns={4} />;
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-red-600">
        Failed to load business areas. Please try again.
      </div>
    );
  }

  if (businessAreas.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No business areas found. Create your first one!
      </div>
    );
  }

  return (
    <>
      {/* Search Bar */}
      <div className="mb-4 flex gap-4 items-center">
        <div className="flex-1">
          <Input
            placeholder="Search business areas (name, description)..."
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
          >
            Clear Search
          </Button>
        )}

        <div className="text-sm text-gray-600">
          {filteredBusinessAreas.length} / {businessAreas.length} areas
        </div>
      </div>

      {/* Empty state after search */}
      {filteredBusinessAreas.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No business areas match your search
        </div>
      )}

      {/* Table */}
      {filteredBusinessAreas.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBusinessAreas.map((area) => (
                <TableRow key={area.id}>
                  <TableCell className="font-medium">{area.id}</TableCell>
                  <TableCell>{area.name}</TableCell>
                  <TableCell className="max-w-md truncate">{area.description}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditClick(area)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(area)}
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
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, businessArea: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Business Area</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">{deleteDialog.businessArea?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, businessArea: null })}
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