"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ManagerTable from "@/components/managers/ManagerTable";
import ManagerForm from "@/components/managers/ManagerForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  keepOpenOnOutsideClick,
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
            Responsabili
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Le persone che seguono i contratti: ricevono per email gli avvisi delle loro scadenze. Non serve che entrino in
            BCM; per farle entrare,{" "}
            <Link href="/users?invite=1" className="font-medium text-primary underline-offset-4 hover:underline">invitale come utenti</Link>.
          </p>
        </div>
        <Button onClick={handleCreateClick}>+ Nuovo responsabile</Button>
      </div>

      <ManagerTable onEditClick={handleEditClick} />

      <Dialog open={formDialog.open} onOpenChange={(open) => !open && handleCloseForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={keepOpenOnOutsideClick}>
          <DialogHeader>
            <DialogTitle>
              {formDialog.manager ? "Modifica responsabile" : "Crea nuovo responsabile"}
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