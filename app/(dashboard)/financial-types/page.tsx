"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import FinancialTypeTable from "@/components/financial-types/FinancialTypeTable";
import FinancialTypeForm from "@/components/financial-types/FinancialTypeForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { FinancialType } from "@/types";

export default function FinancialTypesPage() {
  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    financialType: FinancialType | null;
  }>({ open: false, financialType: null });

  const handleCloseForm = () => {
    setFormDialog({ open: false, financialType: null });
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financial Types</h1>
          <p className="text-gray-600 mt-1">Manage financial value categories</p>
        </div>
        <Button onClick={() => setFormDialog({ open: true, financialType: null })}>
          + New Financial Type
        </Button>
      </div>

      <FinancialTypeTable
        onEditClick={(ft) => setFormDialog({ open: true, financialType: ft })}
      />

      <Dialog open={formDialog.open} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formDialog.financialType ? "Edit Financial Type" : "Create New Financial Type"}
            </DialogTitle>
          </DialogHeader>
          <FinancialTypeForm
            financialType={formDialog.financialType}
            onClose={handleCloseForm}
            onSuccess={() => {}}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
