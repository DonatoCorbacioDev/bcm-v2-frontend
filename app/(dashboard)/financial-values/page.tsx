"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import FinancialValueTable from "@/components/financial-values/FinancialValueTable";
import FinancialValueForm from "@/components/financial-values/FinancialValueForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { FinancialValue } from "@/types";

export default function FinancialValuesPage() {
  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    financialValue: FinancialValue | null;
  }>({ open: false, financialValue: null });

  const handleCreateClick = () => {
    setFormDialog({ open: true, financialValue: null });
  };

  const handleEditClick = (financialValue: FinancialValue) => {
    setFormDialog({ open: true, financialValue });
  };

  const handleCloseForm = () => {
    setFormDialog({ open: false, financialValue: null });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Financial Values
          </h2>
          <p className="text-gray-500 mt-2">Track financial data per contract</p>
        </div>
        <Button onClick={handleCreateClick}>+ New Financial Value</Button>
      </div>

      <FinancialValueTable onEditClick={handleEditClick} />

      <Dialog open={formDialog.open} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formDialog.financialValue
                ? "Edit Financial Value"
                : "Create New Financial Value"}
            </DialogTitle>
          </DialogHeader>
          <FinancialValueForm
            financialValue={formDialog.financialValue}
            onClose={handleCloseForm}
            onSuccess={() => { }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}