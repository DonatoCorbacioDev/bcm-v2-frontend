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

  useEffect(() => {
    if (user && user.role !== "ADMIN") router.replace("/dashboard");
  }, [user, router]);

  if (!user || user.role !== "ADMIN") return null;

  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    financialType: FinancialType | null;
  }>({ open: false, financialType: null });

  const handleCloseForm = () => {
    setFormDialog({ open: false, financialType: null });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Types</h2>
          <p className="text-gray-500 mt-2">Manage financial value categories</p>
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

