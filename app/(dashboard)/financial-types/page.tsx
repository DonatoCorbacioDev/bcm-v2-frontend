"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
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
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";

  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    financialType: FinancialType | null;
  }>({ open: false, financialType: null });

  useEffect(() => {
    if (!isAdmin) router.replace("/dashboard");
  }, [isAdmin, router]);

  if (!isAdmin) return null;

  const handleCloseForm = () => {
    setFormDialog({ open: false, financialType: null });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tipi finanziari</h1>
          <p className="text-muted-foreground mt-2">Gestisci le categorie dei valori finanziari</p>
        </div>
        <Button onClick={() => setFormDialog({ open: true, financialType: null })}>
          + Nuovo tipo finanziario
        </Button>
      </div>

      <FinancialTypeTable
        onEditClick={(ft) => setFormDialog({ open: true, financialType: ft })}
      />

      <Dialog open={formDialog.open} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>
              {formDialog.financialType ? "Modifica tipo finanziario" : "Crea nuovo tipo finanziario"}
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

