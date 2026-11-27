"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import CounterpartyTable from "@/components/counterparties/CounterpartyTable";
import CounterpartyForm from "@/components/counterparties/CounterpartyForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  keepOpenOnOutsideClick,
} from "@/components/ui/dialog";
import type { Counterparty } from "@/types";

function CounterpartiesPageContent() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";
  const router = useRouter();
  // "Aggiungi fornitore" in the Home's first steps links here with ?new=1:
  // the form opens straight away; closing it drops the parameter.
  const searchParams = useSearchParams();
  const openedFromLink = isAdmin && searchParams.get("new") === "1";

  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    counterparty: Counterparty | null;
  }>({ open: false, counterparty: null });

  const handleCreateClick = () => {
    setFormDialog({ open: true, counterparty: null });
  };

  const handleEditClick = (counterparty: Counterparty) => {
    setFormDialog({ open: true, counterparty });
  };

  const handleCloseForm = () => {
    setFormDialog({ open: false, counterparty: null });
    if (openedFromLink) router.replace("/counterparties");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Controparti</h1>
        </div>
        {isAdmin && <Button onClick={handleCreateClick}>+ Nuova controparte</Button>}
      </div>

      <CounterpartyTable onEditClick={handleEditClick} />

      <Dialog open={formDialog.open || openedFromLink} onOpenChange={(open) => !open && handleCloseForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={keepOpenOnOutsideClick}>
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

export default function CounterpartiesPage() {
  return (
    <Suspense>
      <CounterpartiesPageContent />
    </Suspense>
  );
}
