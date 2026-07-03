"use client";

import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useFinancialTypes } from "@/hooks/useFinancialTypes";
import { financialTypesService } from "@/services/financialTypes.service";
import { referenceQueryKeys } from "@/hooks/queries/reference.queryKeys";
import type { FinancialType } from "@/types";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface FinancialTypeTableProps {
  readonly onEditClick: (financialType: FinancialType) => void;
}

export default function FinancialTypeTable({ onEditClick }: FinancialTypeTableProps) {
  const { data: financialTypes = [], isLoading, isError } = useFinancialTypes();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    if (!searchQuery) return financialTypes;
    const q = searchQuery.toLowerCase();
    return financialTypes.filter(
      (ft) =>
        ft.name.toLowerCase().includes(q) ||
        ft.description.toLowerCase().includes(q)
    );
  }, [financialTypes, searchQuery]);

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    financialType: FinancialType | null;
  }>({ open: false, financialType: null });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => financialTypesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referenceQueryKeys.financialTypes });
      toast.success("Tipo finanziario eliminato con successo!");
      setDeleteDialog({ open: false, financialType: null });
    },
    onError: () => {
      toast.error("Eliminazione del tipo finanziario non riuscita");
    },
  });

  if (isLoading) return <TableSkeleton rows={5} columns={4} />;

  if (isError) {
    return (
      <div className="text-center py-8 text-destructive">
        Impossibile caricare i tipi finanziari. Riprova.
      </div>
    );
  }

  if (financialTypes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nessun tipo finanziario trovato. Creane uno!
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex gap-2 md:gap-4 items-center flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Cerca tipi finanziari..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
        {searchQuery && (
          <Button variant="outline" size="sm" onClick={() => setSearchQuery("")} className="hidden sm:inline-flex">
            Pulisci
          </Button>
        )}
        <div className="text-xs md:text-sm text-muted-foreground">
          {filtered.length} / {financialTypes.length} tipi
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nessun tipo finanziario corrisponde alla ricerca
        </div>
      )}

      {filtered.length > 0 && (
        <div className="bg-card rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden lg:table-cell">ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Descrizione</TableHead>
                <TableHead>Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((ft) => (
                <TableRow key={ft.id}>
                  <TableCell className="hidden lg:table-cell font-medium text-sm">{ft.id}</TableCell>
                  <TableCell className="text-sm font-medium">{ft.name}</TableCell>
                  <TableCell className="hidden md:table-cell max-w-md truncate text-sm">{ft.description}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditClick(ft)}
                        className="text-primary hover:text-primary text-xs px-2"
                      >
                        Modifica
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteDialog({ open: true, financialType: ft })}
                        className="text-destructive hover:text-destructive text-xs px-2"
                      >
                        Elimina
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={deleteDialog.open}
        onOpenChange={/* istanbul ignore next */ (open) => !deleteMutation.isPending && setDeleteDialog({ open, financialType: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Elimina tipo finanziario</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare{" "}
              <span className="font-semibold">{deleteDialog.financialType?.name}</span>? L&apos;operazione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, financialType: null })}
              disabled={deleteMutation.isPending}
            >
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={/* istanbul ignore next */ () => deleteDialog.financialType && deleteMutation.mutate(deleteDialog.financialType.id)}
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
