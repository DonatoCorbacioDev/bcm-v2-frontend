"use client";

import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useBudgets } from "@/hooks/useBudgets";
import { budgetsService } from "@/services/budgets.service";
import { referenceQueryKeys } from "@/hooks/queries/reference.queryKeys";
import type { Budget } from "@/types";

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

const EUR_FORMATTER = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

interface BudgetTableProps {
  readonly onEditClick: (budget: Budget) => void;
}

function usageTone(percentUsed: number): { bar: string; text: string } {
  if (percentUsed > 100) return { bar: "bg-[var(--status-red-fg)]", text: "text-[var(--status-red-fg)]" };
  if (percentUsed >= 80) return { bar: "bg-[var(--status-amber-fg)]", text: "text-[var(--status-amber-fg)]" };
  return { bar: "bg-[var(--status-green-fg)]", text: "text-[var(--status-green-fg)]" };
}

export default function BudgetTable({ onEditClick }: BudgetTableProps) {
  const { data: budgets = [], isLoading, isError } = useBudgets();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    if (!searchQuery) return budgets;
    const q = searchQuery.toLowerCase();
    return budgets.filter((b) => b.areaName.toLowerCase().includes(q));
  }, [budgets, searchQuery]);

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    budget: Budget | null;
  }>({ open: false, budget: null });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => budgetsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referenceQueryKeys.budgets });
      toast.success("Budget eliminato con successo!");
      setDeleteDialog({ open: false, budget: null });
    },
    onError: () => {
      toast.error("Eliminazione del budget non riuscita");
    },
  });

  if (isLoading) return <TableSkeleton rows={5} columns={6} />;

  if (isError) {
    return (
      <div className="text-center py-8 text-destructive">
        Impossibile caricare i budget. Riprova.
      </div>
    );
  }

  if (budgets.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nessun budget trovato. Creane uno!
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex gap-2 md:gap-4 items-center flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Cerca per area..."
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
          {filtered.length} / {budgets.length} budget
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nessun budget corrisponde alla ricerca
        </div>
      )}

      {filtered.length > 0 && (
        <div className="bg-card rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Area</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Anno</TableHead>
                <TableHead>Obiettivo</TableHead>
                <TableHead>Reale</TableHead>
                <TableHead className="min-w-[140px]">Utilizzo</TableHead>
                <TableHead>Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b) => {
                const tone = usageTone(b.percentUsed);
                return (
                  <TableRow key={b.id}>
                    <TableCell className="text-sm font-medium">{b.areaName}</TableCell>
                    <TableCell>
                      <Badge variant={b.category === "REVENUE" ? "success" : "secondary"}>
                        {b.category === "REVENUE" ? "Ricavo" : "Costo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-mono tabular-nums">{b.year}</TableCell>
                    <TableCell className="text-sm font-mono tabular-nums">{EUR_FORMATTER.format(b.targetAmount)}</TableCell>
                    <TableCell className="text-sm font-mono tabular-nums">{EUR_FORMATTER.format(b.actualAmount)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-full h-1.5 bg-muted rounded-full">
                          <div
                            className={`h-1.5 rounded-full ${tone.bar}`}
                            style={{ width: `${Math.min(b.percentUsed, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-mono tabular-nums shrink-0 ${tone.text}`}>
                          {b.percentUsed.toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditClick(b)}
                          className="text-primary hover:text-primary text-xs px-2"
                        >
                          Modifica
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteDialog({ open: true, budget: b })}
                          className="text-destructive hover:text-destructive text-xs px-2"
                        >
                          Elimina
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={deleteDialog.open}
        onOpenChange={/* istanbul ignore next */ (open) => !deleteMutation.isPending && setDeleteDialog({ open, budget: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Elimina budget</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare il budget per{" "}
              <span className="font-semibold">{deleteDialog.budget?.areaName}</span>? L&apos;operazione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, budget: null })}
              disabled={deleteMutation.isPending}
            >
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={/* istanbul ignore next */ () => deleteDialog.budget && deleteMutation.mutate(deleteDialog.budget.id)}
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
