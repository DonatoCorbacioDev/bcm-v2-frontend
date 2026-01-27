import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BusinessAreaTableProps {
  readonly onEditClick: (businessArea: BusinessArea) => void;
}

export default function BusinessAreaTable({ onEditClick }: BusinessAreaTableProps) {
  const { data: businessAreas = [], isLoading, isError } = useBusinessAreas();
  const queryClient = useQueryClient();

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
    return <div className="text-center py-8">Loading business areas...</div>;
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
            {businessAreas.map((area) => (
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