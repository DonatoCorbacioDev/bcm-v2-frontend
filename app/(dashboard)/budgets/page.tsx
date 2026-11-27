"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { PageHeader } from "@/components/layout/PageHeader";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useBusinessAreas } from "@/hooks/useBusinessAreas";
import { Button } from "@/components/ui/button";
import BudgetTable from "@/components/budgets/BudgetTable";
import BudgetForm from "@/components/budgets/BudgetForm";
import { MissingPrerequisiteBanner } from "@/components/shared/MissingPrerequisiteBanner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  keepOpenOnOutsideClick,
} from "@/components/ui/dialog";
import type { Budget } from "@/types";

export default function BudgetsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";
  const businessAreasQuery = useBusinessAreas();
  const hasNoBusinessAreas =
    businessAreasQuery.isSuccess && businessAreasQuery.data.length === 0;

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
      <PageHeader
        title="Budget"
        description="Quanto prevedi di spendere o incassare in un anno, reparto per reparto."
        back={{ href: "/costs", label: "Costi e budget" }}
        actions={
          <>
            <Button
          onClick={() => setFormDialog({ open: true, budget: null })}
          disabled={hasNoBusinessAreas}
        >
          + Nuovo budget
        </Button>
          </>
        }
      />

      {hasNoBusinessAreas && (
        <MissingPrerequisiteBanner
          message="Per creare un budget serve prima almeno un reparto a cui assegnarlo."
          actions={[{ label: "Crea un reparto", href: "/business-areas" }]}
        />
      )}

      <BudgetTable
        onEditClick={(b) => setFormDialog({ open: true, budget: b })}
      />

      <Dialog open={formDialog.open} onOpenChange={(open) => !open && handleCloseForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={keepOpenOnOutsideClick}>
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
