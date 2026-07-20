"use client";

import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useFinancialValues, financialValuesQueryKeys } from "@/hooks/useFinancialValues";
import { financialValuesService } from "@/services/financialValues.service";
import type { FinancialValue } from "@/types";

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

const EUR_FORMATTER = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

interface FinancialValueTableProps {
  readonly onEditClick: (financialValue: FinancialValue) => void;
}

// Search and filter logic for financial values
function useFinancialValueFilters(financialValues: FinancialValue[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState<string>("ALL");

  const filteredFinancialValues = useMemo(() => {
    return financialValues.filter((fv) => {
      // Search filter (year or amount)
      const matchesSearch =
        searchQuery === "" ||
        fv.year.toString().includes(searchQuery) ||
        fv.financialAmount.toString().includes(searchQuery);

      // Month filter
      const matchesMonth =
        monthFilter === "ALL" || fv.month.toString() === monthFilter;

      return matchesSearch && matchesMonth;
    });
  }, [financialValues, searchQuery, monthFilter]);

  return {
    searchQuery,
    setSearchQuery,
    monthFilter,
    setMonthFilter,
    filteredFinancialValues,
  };
}

export default function FinancialValueTable({ onEditClick }: FinancialValueTableProps) {
  const { data: financialValues = [], isLoading, isError } = useFinancialValues();
  const queryClient = useQueryClient();

  // Search and filter state
  const {
    searchQuery,
    setSearchQuery,
    monthFilter,
    setMonthFilter,
    filteredFinancialValues,
  } = useFinancialValueFilters(financialValues);

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    financialValue: FinancialValue | null;
  }>({ open: false, financialValue: null });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await financialValuesService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialValuesQueryKeys.all });
      toast.success("Valore finanziario eliminato con successo!");
      setDeleteDialog({ open: false, financialValue: null });
    },
    onError: () => {
      toast.error("Eliminazione del valore finanziario non riuscita");
    },
  });

  const handleDeleteClick = (financialValue: FinancialValue) => {
    setDeleteDialog({ open: true, financialValue });
  };

  const confirmDelete = () => {
    /* istanbul ignore else */
    if (deleteDialog.financialValue) {
      deleteMutation.mutate(deleteDialog.financialValue.id);
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      "Gen", "Feb", "Mar", "Apr", "Mag", "Giu",
      "Lug", "Ago", "Set", "Ott", "Nov", "Dic"
    ];
    return /* istanbul ignore next */months[month - 1] || month;
  };

  if (isLoading) {
    return <TableSkeleton rows={5} columns={6} />;
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-destructive">
        Impossibile caricare i valori finanziari. Riprova.
      </div>
    );
  }

  if (financialValues.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nessun valore finanziario trovato. Creane uno!
      </div>
    );
  }

  return (
    <>
      {/* Search and Filters */}
      <div className="mb-4 flex gap-2 md:gap-4 items-center flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Cerca per anno/importo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-sm text-muted-foreground hidden sm:inline">Mese:</span>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="px-2 md:px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">Tutti</option>
            <option value="1">Gennaio</option>
            <option value="2">Febbraio</option>
            <option value="3">Marzo</option>
            <option value="4">Aprile</option>
            <option value="5">Maggio</option>
            <option value="6">Giugno</option>
            <option value="7">Luglio</option>
            <option value="8">Agosto</option>
            <option value="9">Settembre</option>
            <option value="10">Ottobre</option>
            <option value="11">Novembre</option>
            <option value="12">Dicembre</option>
          </select>

          {(searchQuery || monthFilter !== "ALL") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setMonthFilter("ALL");
              }}
              className="hidden sm:inline-flex"
            >
              Pulisci
            </Button>
          )}
        </div>

        <div className="text-xs md:text-sm text-muted-foreground">
          {filteredFinancialValues.length} / {financialValues.length} valori
        </div>
      </div>

      {/* Empty state after filtering */}
      {filteredFinancialValues.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nessun valore finanziario corrisponde ai filtri
        </div>
      )}

      {/* Table with Responsive Columns */}
      {filteredFinancialValues.length > 0 && (
        <div className="bg-card rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Periodo</TableHead>
                <TableHead>Importo</TableHead>
                <TableHead className="hidden md:table-cell">Cliente</TableHead>
                <TableHead className="hidden lg:table-cell">Tipo</TableHead>
                <TableHead className="hidden lg:table-cell">Area di business</TableHead>
                <TableHead>Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFinancialValues.map((fv) => (
                <TableRow key={fv.id}>
                  <TableCell className="font-medium text-sm">
                    {getMonthName(fv.month)}/{fv.year}
                  </TableCell>
                  <TableCell className="font-semibold text-sm">
                    {EUR_FORMATTER.format(fv.financialAmount)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{/* istanbul ignore next */fv.customerName || 'N/D'}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">{/* istanbul ignore next */fv.typeName || 'N/D'}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">{/* istanbul ignore next */fv.areaName || 'N/D'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditClick(fv)}
                        className="text-primary hover:text-primary text-xs px-2"
                      >
                        Modifica
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(fv)}
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={/* istanbul ignore next */ (open) => !deleteMutation.isPending && setDeleteDialog({ open, financialValue: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Elimina valore finanziario</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare questo valore finanziario? L&apos;operazione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, financialValue: null })}
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