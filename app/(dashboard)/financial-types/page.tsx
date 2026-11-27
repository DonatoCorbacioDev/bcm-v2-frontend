"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { PageHeader } from "@/components/layout/PageHeader";
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
  keepOpenOnOutsideClick,
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
      <PageHeader
        title="Categorie di costo e ricavo"
        description="Per dividere le spese per tipo, per esempio Licenze software, Manutenzione o Consulenze. Si scelgono nel contratto."
        back={{ href: "/settings", label: "Impostazioni" }}
        actions={
          <>
            <Button onClick={() => setFormDialog({ open: true, financialType: null })}>
          + Nuova categoria
        </Button>
          </>
        }
      />

      <FinancialTypeTable
        onEditClick={(ft) => setFormDialog({ open: true, financialType: ft })}
      />

      <Dialog open={formDialog.open} onOpenChange={(open) => !open && handleCloseForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={keepOpenOnOutsideClick}>
          <DialogHeader>
            <DialogTitle>
              {formDialog.financialType ? "Modifica categoria" : "Crea nuova categoria"}
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

