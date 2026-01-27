"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import BusinessAreaTable from "@/components/business-areas/BusinessAreaTable";
import BusinessAreaForm from "@/components/business-areas/BusinessAreaForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BusinessArea } from "@/types";

export default function BusinessAreasPage() {
  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    businessArea: BusinessArea | null;
  }>({ open: false, businessArea: null });

  const handleCreateClick = () => {
    setFormDialog({ open: true, businessArea: null });
  };

  const handleEditClick = (businessArea: BusinessArea) => {
    setFormDialog({ open: true, businessArea });
  };

  const handleCloseForm = () => {
    setFormDialog({ open: false, businessArea: null });
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Business Areas</h1>
          <p className="text-gray-600 mt-1">Manage your business areas</p>
        </div>
        <Button onClick={handleCreateClick}>+ New Business Area</Button>
      </div>

      <BusinessAreaTable onEditClick={handleEditClick} />

      {/* Create/Edit Dialog */}
      <Dialog open={formDialog.open} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formDialog.businessArea ? "Edit Business Area" : "Create New Business Area"}
            </DialogTitle>
          </DialogHeader>
          <BusinessAreaForm
            businessArea={formDialog.businessArea}
            onClose={handleCloseForm}
            onSuccess={() => { }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}