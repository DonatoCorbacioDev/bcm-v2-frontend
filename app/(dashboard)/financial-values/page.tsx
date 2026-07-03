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
          <h1 className="text-3xl font-bold text-foreground">
            Valori finanziari
          </h1>
          <p className="text-muted-foreground mt-2">Traccia i dati finanziari per contratto</p>
        </div>
        <Button onClick={handleCreateClick}>+ Nuovo valore finanziario</Button>
      </div>

      <FinancialValueTable onEditClick={handleEditClick} />

      <Dialog open={formDialog.open} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>
              {formDialog.financialValue
                ? "Modifica valore finanziario"
                : "Crea nuovo valore finanziario"}
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