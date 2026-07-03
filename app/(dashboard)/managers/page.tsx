"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import ManagerTable from "@/components/managers/ManagerTable";
import ManagerForm from "@/components/managers/ManagerForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Manager } from "@/types";

export default function ManagersPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";

  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    manager: Manager | null;
  }>({ open: false, manager: null });

  useEffect(() => {
    if (!isAdmin) router.replace("/dashboard");
  }, [isAdmin, router]);

  if (!isAdmin) return null;

  const handleCreateClick = () => {
    setFormDialog({ open: true, manager: null });
  };

  const handleEditClick = (manager: Manager) => {
    setFormDialog({ open: true, manager });
  };

  const handleCloseForm = () => {
    setFormDialog({ open: false, manager: null });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Manager
          </h1>
          <p className="text-muted-foreground mt-2">Gestisci i manager del team</p>
        </div>
        <Button onClick={handleCreateClick}>+ Nuovo manager</Button>
      </div>

      <ManagerTable onEditClick={handleEditClick} />

      <Dialog open={formDialog.open} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>
              {formDialog.manager ? "Modifica manager" : "Crea nuovo manager"}
            </DialogTitle>
          </DialogHeader>
          <ManagerForm
            manager={formDialog.manager}
            onClose={handleCloseForm}
            onSuccess={() => { }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}