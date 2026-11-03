"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { Fragment, useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useFinancialValues, financialValuesQueryKeys } from "@/hooks/useFinancialValues";
import { financialValuesService } from "@/services/financialValues.service";
import { useContractsPaged } from "@/hooks/useContractsPaged";
import { ChevronRight } from "lucide-react";
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
  /** Restricts rows to this business area. `null` (the default) shows every area. */
  readonly areaId?: number | null;
}

// Search and filter logic for financial values (category is no longer a
// filter: revenue and cost render as two separate sections, never mixed in
// the same table - see CategorySection below).
function useFinancialValueFilters(
  financialValues: FinancialValue[],
  year: number | null,
  areaId: number | null,
  contractNumbers: ReadonlyMap<number, string>
) {
  const [searchQuery, setSearchQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState<string>("ALL");

  const scopedValues = useMemo(() => {
    return financialValues.filter((fv) => {
      const matchesYear = year === null || fv.year === year;
      const matchesArea = areaId === null || fv.businessAreaId === areaId;
      return matchesYear && matchesArea;
    });
  }, [financialValues, year, areaId]);

  const filteredFinancialValues = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return scopedValues.filter((fv) => {
      const searchable = [
        fv.customerName,
        contractNumbers.get(fv.contractId),
        fv.areaName,
        fv.typeName,
        `${getMonthName(fv.month)}/${fv.year}`,
        fv.financialAmount.toString(),
      ];
      const matchesSearch = query === "" || searchable.some((text) => text?.toString().toLowerCase().includes(query));

      const matchesMonth =
        monthFilter === "ALL" || fv.month.toString() === monthFilter;

      return matchesSearch && matchesMonth;
    });
  }, [scopedValues, searchQuery, monthFilter, contractNumbers]);

  return {
    searchQuery,
    setSearchQuery,
    monthFilter,
    setMonthFilter,
    filteredFinancialValues,
    yearScopedCount: scopedValues.length,
  };
}

const MIXED_AREAS = "Più aree";

interface ContractGroup {
  readonly contractId: number;
  readonly counterparty: string;
  readonly contractNumber?: string;
  readonly areaName?: string;
  readonly rows: FinancialValue[];
  readonly total: number;
}

// One group per contract, biggest total first; months oldest first inside.
function groupByContract(rows: FinancialValue[], contractNumbers: ReadonlyMap<number, string>): ContractGroup[] {
  const byContract = new Map<number, FinancialValue[]>();
  for (const fv of rows) {
    const group = byContract.get(fv.contractId);
    if (group) group.push(fv);
    else byContract.set(fv.contractId, [fv]);
  }
  return Array.from(byContract, ([contractId, values]) => {
    const sorted = [...values].sort((a, b) => a.year - b.year || a.month - b.month);
    const areaNames = new Set(sorted.map((fv) => fv.areaName));
    return {
      contractId,
      counterparty: sorted[0].customerName || "N/D",
      contractNumber: contractNumbers.get(contractId),
      areaName: areaNames.size === 1 ? sorted[0].areaName : MIXED_AREAS,
      rows: sorted,
      total: sorted.reduce((sum, fv) => sum + fv.financialAmount, 0),
    };
  }).sort((a, b) => b.total - a.total);
}

interface CategorySectionProps {
  readonly title: string;
  readonly emptyLabel: string;
  readonly rows: FinancialValue[];
  readonly contractNumbers: ReadonlyMap<number, string>;
  /** A search or month filter is active: every contract is shown expanded. */
  readonly expandAll: boolean;
  readonly totalVariantClass: string;
  readonly onEditClick: (fv: FinancialValue) => void;
  readonly onDeleteClick: (fv: FinancialValue) => void;
}

// Movements are grouped by contract (one collapsible row each) so a monthly
// contract doesn't repeat its counterparty on twelve rows in a row.
function CategorySection({
  title,
  emptyLabel,
  rows,
  contractNumbers,
  expandAll,
  totalVariantClass,
  onEditClick,
  onDeleteClick,
}: CategorySectionProps) {
  const groups = useMemo(() => groupByContract(rows, contractNumbers), [rows, contractNumbers]);
  const [expanded, setExpanded] = useState<ReadonlySet<number>>(new Set());
  const total = rows.reduce((sum, fv) => sum + fv.financialAmount, 0);

  const toggle = (contractId: number) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(contractId)) next.delete(contractId);
      else next.add(contractId);
      return next;
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">
          {groups.length} {groups.length === 1 ? "contratto" : "contratti"} · {rows.length} {rows.length === 1 ? "voce" : "voci"}
        </span>
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
                <TableHead>Contratto</TableHead>
                <TableHead className="hidden md:table-cell">Area di business</TableHead>
                <TableHead className="text-right">Importo</TableHead>
                {/* Fixed width: the edit/delete buttons only appear on expanded
                    rows, and the amounts must not shift when a contract opens. */}
                <TableHead className="w-44">
                  <span className="sr-only">Azioni</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) => {
                const isOpen = expandAll || expanded.has(group.contractId);
                const movements = `${group.rows.length} ${group.rows.length === 1 ? "movimento" : "movimenti"}`;
                return (
                  <Fragment key={group.contractId}>
                    <TableRow className="bg-muted/30">
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => toggle(group.contractId)}
                          disabled={expandAll}
                          aria-expanded={isOpen}
                          className="flex items-center gap-2 text-left disabled:cursor-default"
                        >
                          <ChevronRight
                            aria-hidden="true"
                            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`}
                          />
                          <span>
                            <span className="block text-sm font-medium text-foreground">{group.counterparty}</span>
                            <span className="block text-xs text-muted-foreground">
                              {group.contractNumber ? `${group.contractNumber} · ${movements}` : movements}
                            </span>
                          </span>
                        </button>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{group.areaName || "N/D"}</TableCell>
                      <TableCell className="text-right text-sm font-semibold tabular-nums">
                        {EUR_FORMATTER.format(group.total)}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                    {isOpen && group.rows.map((fv) => (
                      <TableRow key={fv.id}>
                        <TableCell className="pl-12 text-sm">
                          {getMonthName(fv.month)}/{fv.year}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {/* The group row already names the area, unless it spans several. */}
                          {group.areaName === MIXED_AREAS ? fv.areaName : null}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {EUR_FORMATTER.format(fv.financialAmount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 justify-end">
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
                  </Fragment>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="text-sm font-semibold text-foreground">Totale</TableCell>
                <TableCell className="hidden md:table-cell" />
                <TableCell className={`text-right text-sm font-bold tabular-nums ${totalVariantClass}`}>
                  {EUR_FORMATTER.format(total)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
}

export default function FinancialValueTable({ onEditClick, year = null, areaId = null }: FinancialValueTableProps) {
  const { data: financialValues = [], isLoading, isError } = useFinancialValues();
  // Same query the page already runs for its prerequisites, so it is served
  // from the cache: it only adds the contract number to each group.
  const { data: contractsPage } = useContractsPaged({ size: 1000 });
  const contractNumbers = useMemo(
    () => new Map((contractsPage?.content ?? []).map((c) => [c.id, c.contractNumber])),
    [contractsPage]
  );
  const queryClient = useQueryClient();

  const {
    searchQuery,
    setSearchQuery,
    monthFilter,
    setMonthFilter,
    filteredFinancialValues,
    yearScopedCount,
  } = useFinancialValueFilters(financialValues, year, areaId, contractNumbers);

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    financialValue: FinancialValue | null;
  }>({ open: false, financialValue: null });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await financialValuesService.delete(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: financialValuesQueryKeys.all });
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

  const filtersActive = searchQuery.trim() !== "" || monthFilter !== "ALL";
  const revenueRows = filteredFinancialValues.filter((fv) => fv.category === "REVENUE");
  const costRows = filteredFinancialValues.filter((fv) => fv.category === "COST");

  return (
    <>
      {/* Search and Filters */}
      <div className="mb-4 flex gap-2 md:gap-4 items-center flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Cerca per controparte, contratto, area o importo..."
            aria-label="Cerca movimenti"
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

          {filtersActive && (
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
            contractNumbers={contractNumbers}
            expandAll={filtersActive}
            totalVariantClass="text-[var(--status-green-fg)]"
            onEditClick={onEditClick}
            onDeleteClick={handleDeleteClick}
          />
          <CategorySection
            title="Costi"
            emptyLabel="Nessun costo per questo periodo"
            rows={costRows}
            contractNumbers={contractNumbers}
            expandAll={filtersActive}
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
