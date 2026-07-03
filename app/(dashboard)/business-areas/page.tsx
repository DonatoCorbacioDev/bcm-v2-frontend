"use client";

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Aree di business</h1>
          <p className="text-muted-foreground mt-2">Gestisci le aree di business</p>
        </div>
        <Button onClick={handleCreateClick}>+ Nuova area di business</Button>
      </div>

      <BusinessAreaTable onEditClick={handleEditClick} />

      {/* Create/Edit Dialog */}
      <Dialog open={formDialog.open} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>
              {formDialog.businessArea ? "Modifica area di business" : "Crea nuova area di business"}
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