"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import BudgetTable from "@/components/budgets/BudgetTable";
import BudgetForm from "@/components/budgets/BudgetForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Budget } from "@/types";

export default function BudgetsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";

  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    budget: Budget | null;
  }>({ open: false, budget: null });

  useEffect(() => {
    if (!isAdmin) router.replace("/dashboard");
  }, [isAdmin, router]);

  if (!isAdmin) return null;

  const handleCloseForm = () => {
    setFormDialog({ open: false, budget: null });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Budget</h1>
          <p className="text-muted-foreground mt-2">Obiettivi di ricavo e costo per area di business</p>
        </div>
        <Button onClick={() => setFormDialog({ open: true, budget: null })}>
          + Nuovo budget
        </Button>
      </div>

      <BudgetTable
        onEditClick={(b) => setFormDialog({ open: true, budget: b })}
      />

      <Dialog open={formDialog.open} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>
              {formDialog.budget ? "Modifica budget" : "Crea nuovo budget"}
            </DialogTitle>
          </DialogHeader>
          <BudgetForm
            budget={formDialog.budget}
            onClose={handleCloseForm}
            onSuccess={() => {}}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
