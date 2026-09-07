"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import CounterpartyTable from "@/components/counterparties/CounterpartyTable";
import CounterpartyForm from "@/components/counterparties/CounterpartyForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Counterparty } from "@/types";

export default function CounterpartiesPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";

  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    counterparty: Counterparty | null;
  }>({ open: false, counterparty: null });

  useEffect(() => {
    if (!isAdmin) router.replace("/dashboard");
  }, [isAdmin, router]);

  if (!isAdmin) return null;

  const handleCreateClick = () => {
    setFormDialog({ open: true, counterparty: null });
  };

  const handleEditClick = (counterparty: Counterparty) => {
    setFormDialog({ open: true, counterparty });
  };

  const handleCloseForm = () => {
    setFormDialog({ open: false, counterparty: null });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Controparti</h1>
          <p className="text-muted-foreground mt-2">Gestisci clienti e fornitori</p>
        </div>
        <Button onClick={handleCreateClick}>+ Nuova controparte</Button>
      </div>

      <CounterpartyTable onEditClick={handleEditClick} />

      <Dialog open={formDialog.open} onOpenChange={(open) => !open && handleCloseForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>
              {formDialog.counterparty ? "Modifica controparte" : "Crea nuova controparte"}
            </DialogTitle>
          </DialogHeader>
          <CounterpartyForm
            counterparty={formDialog.counterparty}
            onClose={handleCloseForm}
            onSuccess={() => { }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
