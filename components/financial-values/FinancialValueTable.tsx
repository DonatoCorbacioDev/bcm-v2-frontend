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
  TableFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { TableSkeleton } from "@/components/ui/table-skeleton";

const EUR_FORMATTER = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

const MONTH_NAMES = [
  "Gen", "Feb", "Mar", "Apr", "Mag", "Giu",
  "Lug", "Ago", "Set", "Ott", "Nov", "Dic",
];
const getMonthName = (month: number) => /* istanbul ignore next */ MONTH_NAMES[month - 1] || month;

interface FinancialValueTableProps {
  readonly onEditClick: (financialValue: FinancialValue) => void;
  /** Restricts rows to this year. `null` (the default) shows every year. */
  readonly year?: number | null;
}

// Search and filter logic for financial values (category is no longer a
// filter: revenue and cost render as two separate sections, never mixed in
// the same table - see CategorySection below).
function useFinancialValueFilters(financialValues: FinancialValue[], year: number | null) {
  const [searchQuery, setSearchQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState<string>("ALL");

  const yearScopedValues = useMemo(
    () => (year === null ? financialValues : financialValues.filter((fv) => fv.year === year)),
    [financialValues, year]
  );

  const filteredFinancialValues = useMemo(() => {
    return yearScopedValues.filter((fv) => {
      const matchesSearch =
        searchQuery === "" ||
        fv.year.toString().includes(searchQuery) ||
        fv.financialAmount.toString().includes(searchQuery);

      const matchesMonth =
        monthFilter === "ALL" || fv.month.toString() === monthFilter;

      return matchesSearch && matchesMonth;
    });
  }, [yearScopedValues, searchQuery, monthFilter]);

  return {
    searchQuery,
    setSearchQuery,
    monthFilter,
    setMonthFilter,
    filteredFinancialValues,
    yearScopedCount: yearScopedValues.length,
  };
}

interface CategorySectionProps {
  readonly title: string;
  readonly emptyLabel: string;
  readonly rows: FinancialValue[];
  readonly totalVariantClass: string;
  readonly onEditClick: (fv: FinancialValue) => void;
  readonly onDeleteClick: (fv: FinancialValue) => void;
}

function CategorySection({ title, emptyLabel, rows, totalVariantClass, onEditClick, onDeleteClick }: CategorySectionProps) {
  const total = rows.reduce((sum, fv) => sum + fv.financialAmount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">{rows.length} {rows.length === 1 ? "voce" : "voci"}</span>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground bg-card rounded-lg border border-border">
          {emptyLabel}
        </div>
      ) : (
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
              {rows.map((fv) => (
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
                        className="text-primary hover:text-primary text-xs px-2 dark:text-[var(--accent-foreground)] dark:hover:text-[var(--accent-foreground)]"
                      >
                        Modifica
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteClick(fv)}
                        className="text-destructive hover:text-destructive text-xs px-2"
                      >
                        Elimina
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="text-sm font-semibold text-foreground">Totale</TableCell>
                <TableCell className={`text-sm font-bold ${totalVariantClass}`}>
                  {EUR_FORMATTER.format(total)}
                </TableCell>
                <TableCell className="hidden md:table-cell" />
                <TableCell className="hidden lg:table-cell" />
                <TableCell className="hidden lg:table-cell" />
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
}

export default function FinancialValueTable({ onEditClick, year = null }: FinancialValueTableProps) {
  const { data: financialValues = [], isLoading, isError } = useFinancialValues();
  const queryClient = useQueryClient();

  const {
    searchQuery,
    setSearchQuery,
    monthFilter,
    setMonthFilter,
    filteredFinancialValues,
    yearScopedCount,
  } = useFinancialValueFilters(financialValues, year);

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
      toast.success("Valore finanziario eliminato");
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

  if (isLoading) {
    return <TableSkeleton rows={5} columns={7} />;
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
        Nessun valore finanziario trovato
      </div>
    );
  }

  const revenueRows = filteredFinancialValues.filter((fv) => fv.category === "REVENUE");
  const costRows = filteredFinancialValues.filter((fv) => fv.category === "COST");

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
          <label htmlFor="month-filter" className="text-sm text-muted-foreground hidden sm:inline">Mese:</label>
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger id="month-filter" aria-label="Filtra per mese" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tutti</SelectItem>
              <SelectItem value="1">Gennaio</SelectItem>
              <SelectItem value="2">Febbraio</SelectItem>
              <SelectItem value="3">Marzo</SelectItem>
              <SelectItem value="4">Aprile</SelectItem>
              <SelectItem value="5">Maggio</SelectItem>
              <SelectItem value="6">Giugno</SelectItem>
              <SelectItem value="7">Luglio</SelectItem>
              <SelectItem value="8">Agosto</SelectItem>
              <SelectItem value="9">Settembre</SelectItem>
              <SelectItem value="10">Ottobre</SelectItem>
              <SelectItem value="11">Novembre</SelectItem>
              <SelectItem value="12">Dicembre</SelectItem>
            </SelectContent>
          </Select>

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
          {filteredFinancialValues.length} / {yearScopedCount} valori
        </div>
      </div>

      {/* Empty state after filtering */}
      {filteredFinancialValues.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nessun valore finanziario corrisponde ai filtri
        </div>
      )}

      {/* Ricavi and Costi always rendered as two separate sections - never
          interleaved in the same table, so it's never ambiguous which is which. */}
      {filteredFinancialValues.length > 0 && (
        <div className="space-y-6">
          <CategorySection
            title="Ricavi"
            emptyLabel="Nessun ricavo per questo periodo"
            rows={revenueRows}
            totalVariantClass="text-[var(--status-green-fg)]"
            onEditClick={onEditClick}
            onDeleteClick={handleDeleteClick}
          />
          <CategorySection
            title="Costi"
            emptyLabel="Nessun costo per questo periodo"
            rows={costRows}
            totalVariantClass="text-[var(--status-red-fg)]"
            onEditClick={onEditClick}
            onDeleteClick={handleDeleteClick}
          />
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
