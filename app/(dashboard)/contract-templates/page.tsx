"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import type { ContractTemplate } from "@/types";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import ContractTemplateTable from "@/components/contract-templates/ContractTemplateTable";
import ContractTemplateForm from "@/components/contract-templates/ContractTemplateForm";

export default function ContractTemplatesPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    template: ContractTemplate | null;
  }>({ open: false, template: null });

  const handleCreateClick = () => setFormDialog({ open: true, template: null });
  const handleEditClick = (template: ContractTemplate) =>
    setFormDialog({ open: true, template });
  const handleClose = () => setFormDialog({ open: false, template: null });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Template contratti</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crea e gestisci template riutilizzabili per generare nuovi contratti rapidamente.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={handleCreateClick}>
            Nuovo template
          </Button>
        )}
      </div>

      {/* Table */}
      <ContractTemplateTable onEditClick={handleEditClick} />

      {/* Create / Edit Dialog */}
      <Dialog open={formDialog.open} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formDialog.template ? "Modifica template" : "Nuovo template"}
            </DialogTitle>
          </DialogHeader>
          <ContractTemplateForm
            template={formDialog.template}
            onClose={handleClose}
            onSuccess={handleClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
