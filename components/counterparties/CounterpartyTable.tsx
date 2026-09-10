"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useState, useMemo } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCounterparties } from "@/hooks/useCounterparties";
import { counterpartiesService } from "@/services/counterparties.service";
import { referenceQueryKeys } from "@/hooks/queries/reference.queryKeys";
import { useAuthStore } from "@/store/authStore";
import type { Counterparty } from "@/types";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { TableSkeleton } from "@/components/ui/table-skeleton";

const TYPE_LABELS: Record<Counterparty["type"], string> = {
  CUSTOMER: "Cliente",
  SUPPLIER: "Fornitore",
  BOTH: "Entrambi",
};

interface CounterpartyTableProps {
  readonly onEditClick: (counterparty: Counterparty) => void;
}

function useCounterpartyFilters(counterparties: Counterparty[]) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCounterparties = useMemo(() => {
    return counterparties.filter((cp) => {
      if (searchQuery === "") return true;
      const query = searchQuery.toLowerCase();
      return (
        cp.name.toLowerCase().includes(query) ||
        (cp.vatNumber ?? "").toLowerCase().includes(query)
      );
    });
  }, [counterparties, searchQuery]);

  return { searchQuery, setSearchQuery, filteredCounterparties };
}

export default function CounterpartyTable({ onEditClick }: CounterpartyTableProps) {
  const { data: counterparties = [], isLoading, isError } = useCounterparties();
  const queryClient = useQueryClient();
  const isAdmin = useAuthStore((state) => state.user?.role === "ADMIN");

  const { searchQuery, setSearchQuery, filteredCounterparties } = useCounterpartyFilters(counterparties);

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    counterparty: Counterparty | null;
  }>({ open: false, counterparty: null });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await counterpartiesService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referenceQueryKeys.counterparties });
      toast.success("Controparte eliminata");
      setDeleteDialog({ open: false, counterparty: null });
    },
    onError: () => {
      toast.error("Eliminazione della controparte non riuscita");
    },
  });

  const handleDeleteClick = (counterparty: Counterparty) => {
    setDeleteDialog({ open: true, counterparty });
  };

  const confirmDelete = () => {
    /* istanbul ignore else */
    if (deleteDialog.counterparty) {
      deleteMutation.mutate(deleteDialog.counterparty.id);
    }
  };

  if (isLoading) {
    return <TableSkeleton rows={5} columns={4} />;
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-destructive">
        Impossibile caricare le controparti. Riprova.
      </div>
    );
  }

  if (counterparties.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nessuna controparte trovata
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex gap-2 md:gap-4 items-center flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            aria-label="Cerca controparti"
            placeholder="Cerca controparti..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {searchQuery && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="hidden sm:inline-flex"
          >
            Pulisci
          </Button>
        )}

        <div aria-live="polite" aria-atomic="true" className="text-xs md:text-sm text-muted-foreground">
          {filteredCounterparties.length} / {counterparties.length} controparti
        </div>
      </div>

      {filteredCounterparties.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nessuna controparte corrisponde alla ricerca
        </div>
      )}

      {filteredCounterparties.length > 0 && (
        <div className="bg-card rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden md:table-cell">Partita IVA</TableHead>
                <TableHead className="hidden lg:table-cell">Referente</TableHead>
                {isAdmin && <TableHead>Azioni</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCounterparties.map((cp) => (
                <TableRow key={cp.id}>
                  <TableCell className="text-sm font-medium">
                    <Link href={`/counterparties/${cp.id}`} className="text-primary hover:underline dark:text-[var(--accent-foreground)]">
                      {cp.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{TYPE_LABELS[cp.type]}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{cp.vatNumber || "N/D"}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">{cp.contactName || "N/D"}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditClick(cp)}
                          className="text-primary hover:text-primary text-xs px-2 dark:text-[var(--accent-foreground)] dark:hover:text-[var(--accent-foreground)]"
                        >
                          Modifica
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(cp)}
                          className="text-destructive hover:text-destructive text-xs px-2"
                        >
                          Elimina
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={deleteDialog.open}
        onOpenChange={/* istanbul ignore next */ (open) => !deleteMutation.isPending && setDeleteDialog({ open, counterparty: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Elimina controparte</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare{" "}
              <span className="font-semibold">{deleteDialog.counterparty?.name}</span>? L&apos;operazione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, counterparty: null })}
            >
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {/* istanbul ignore next */deleteMutation.isPending ? "Eliminazione..." : "Elimina"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
