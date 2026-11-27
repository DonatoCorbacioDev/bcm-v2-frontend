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
import BusinessAreaTable from "@/components/business-areas/BusinessAreaTable";
import BusinessAreaForm from "@/components/business-areas/BusinessAreaForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  keepOpenOnOutsideClick,
} from "@/components/ui/dialog";
import type { BusinessArea } from "@/types";

export default function BusinessAreasPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";

  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    businessArea: BusinessArea | null;
  }>({ open: false, businessArea: null });

  useEffect(() => {
    if (!isAdmin) router.replace("/dashboard");
  }, [isAdmin, router]);

  if (!isAdmin) return null;

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
    <div className="space-y-6">
      <PageHeader
        title="Reparti"
        description={<>I reparti in cui dividi i contratti, per esempio IT, Acquisti o Produzione</>}
        back={{ href: "/settings", label: "Impostazioni" }}
        actions={
          <>
            <Button onClick={handleCreateClick}>+ Nuovo reparto</Button>
          </>
        }
      />

      <BusinessAreaTable onEditClick={handleEditClick} />

      {/* Create/Edit Dialog */}
      <Dialog open={formDialog.open} onOpenChange={(open) => !open && handleCloseForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={keepOpenOnOutsideClick}>
          <DialogHeader>
            <DialogTitle>
              {formDialog.businessArea ? "Modifica reparto" : "Crea nuovo reparto"}
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