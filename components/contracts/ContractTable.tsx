"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { useContractsPaged } from "@/hooks/useContractsPaged";
import { contractsQueryKeys } from "@/hooks/queries/contracts.queryKeys";
import { contractsService } from "@/services/contracts.service";
import { useAuthStore } from "@/store/authStore";
import { CONTRACT_STATUS_LABELS, getContractStatusVariant } from "@/lib/utils";
import { ExpiringSoonBadge } from "@/components/contracts/ExpiringSoonBadge";
import type { Contract } from "@/types";

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
import { Checkbox } from "@/components/ui/checkbox";
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
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown, Trash2, Save } from "lucide-react";

import { TableSkeleton } from "@/components/ui/table-skeleton";
import { useIsMobile } from "@/hooks/useIsMobile";

type PageItem = number | "ellipsis-start" | "ellipsis-end";

type SortableColumn =
  | "contractNumber"
  | "counterpartyName"
  | "projectName"
  | "managerName"
  | "status"
  | "nextDeadline";

type SortDirection = "asc" | "desc";

const COLUMNS: { key: SortableColumn; label: string; className?: string }[] = [
  { key: "contractNumber", label: "Numero" },
  { key: "counterpartyName", label: "Controparte" },
  { key: "projectName", label: "Oggetto", className: "hidden md:table-cell" },
  { key: "managerName", label: "Responsabile", className: "hidden lg:table-cell" },
  { key: "status", label: "Stato" },
  // The date to act on: the last day to give notice for a tacit renewal,
  // otherwise the end date. WBS code and start date live in the detail page.
  { key: "nextDeadline", label: "Prossima scadenza", className: "hidden md:table-cell" },
];

/** A tacit renewal whose last day to give notice has gone by: it will renew at the end date. */
function noticeDeadlinePassed(c: Contract): boolean {
  return c.noticeDeadline != null && c.daysUntilNoticeDeadline != null && c.daysUntilNoticeDeadline < 0;
}

/**
 * The date to act on (YYYY-MM-DD): the notice deadline for a tacit renewal,
 * otherwise the end date. Once the notice deadline has passed, the end date
 * again: that is when the contract renews.
 */
function nextDeadline(c: Contract): string | null {
  if (noticeDeadlinePassed(c)) return c.endDate ?? null;
  return c.noticeDeadline ?? c.endDate ?? null;
}

/** The date to act on with what it means, for the table cell and the phone card. */
function NextDeadline({ contract: c }: { readonly contract: Contract }) {
  const date = nextDeadline(c);
  return (
    <>
      {date ? new Date(date).toLocaleDateString("it-IT") : "N/D"}
      {c.noticeDeadline && !noticeDeadlinePassed(c) && (
        <span className="block text-xs text-muted-foreground">ultimo giorno per disdire</span>
      )}
      {noticeDeadlinePassed(c) && (
        <span className="block text-xs text-muted-foreground">si rinnova: termine di disdetta passato</span>
      )}
    </>
  );
}

// counterpartyName has no flat property on Contract (only the nested
// counterparty object) -- every other column is a plain string field, so a
// resolver map keeps sortContracts generic without adding a redundant flat
// field to the Contract type just for sorting.
const SORT_VALUE: Record<SortableColumn, (c: Contract) => string> = {
  contractNumber: (c) => c.contractNumber,
  counterpartyName: (c) => c.counterparty?.name ?? "",
  projectName: (c) => c.projectName,
  managerName: (c) => c.managerName,
  status: (c) => c.status,
  nextDeadline: (c) => nextDeadline(c) ?? "",
};

/**
 * Sorts only the contracts already on the current page: pagination is
 * server-side and the backend always returns results ordered by
 * contractNumber, so this can't reorder across pages without a backend
 * `sort` parameter. Good enough for "find the row I'm looking at" on a
 * single page; not a substitute for a real server-side sort.
 */
function sortContracts(
  contracts: Contract[],
  sortKey: SortableColumn | null,
  direction: SortDirection
): Contract[] {
  const getValue = sortKey ? SORT_VALUE[sortKey] : undefined;
  // A view saved before a column was removed (e.g. "wbsCode") sorts by nothing.
  if (!getValue) return contracts;
  const sorted = [...contracts].sort((a, b) => {
    /* istanbul ignore next */
    const aVal = getValue(a) ?? "";
    /* istanbul ignore next */
    const bVal = getValue(b) ?? "";
    return String(aVal).localeCompare(String(bVal), "it", { numeric: true });
  });
  return direction === "asc" ? sorted : sorted.reverse();
}

interface SavedView {
  name: string;
  searchQuery: string;
  statusFilter: string;
  pageSize: number;
  sortKey: SortableColumn | null;
  sortDirection: SortDirection;
}

// Keyed per user (not just per browser) so two accounts sharing a machine
// don't see each other's saved filter combinations.
function savedViewsKey(userId: number) {
  return `bcm-contract-views-${userId}`;
}

function loadSavedViews(userId: number): SavedView[] {
  try {
    const raw = localStorage.getItem(savedViewsKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistSavedViews(userId: number, views: SavedView[]) {
  localStorage.setItem(savedViewsKey(userId), JSON.stringify(views));
}

function getPageNumbers(current: number, total: number): PageItem[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  if (current <= 3) {
    return [0, 1, 2, 3, 4, "ellipsis-end", total - 1];
  }
  if (current >= total - 4) {
    return [0, "ellipsis-start", total - 5, total - 4, total - 3, total - 2, total - 1];
  }
  return [0, "ellipsis-start", current - 1, current, current + 1, "ellipsis-end", total - 1];
}

interface ContractTableProps {
  readonly onEditClick: (contract: Contract) => void;
  /** Pre-fills the search box — used by the header's global search, which
   * links here as `/contracts?q=...`. */
  readonly initialSearchQuery?: string;
}

export default function ContractTable({ onEditClick, initialSearchQuery = "" }: ContractTableProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  // Pagination state
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Search and filter state (server-side now)
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Re-searching from the header while already on this page (same route,
  // new `q`) doesn't remount this component, so the useState initializer
  // above won't see the new value — pick it up here instead.
  const [prevInitialSearchQuery, setPrevInitialSearchQuery] = useState(initialSearchQuery);
  if (initialSearchQuery !== prevInitialSearchQuery) {
    setPrevInitialSearchQuery(initialSearchQuery);
    setSearchQuery(initialSearchQuery);
    setPage(0);
  }

  // Sort state (client-side, current page only — see sortContracts)
  const [sortKey, setSortKey] = useState<SortableColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Saved views (localStorage, per user). Read once at mount via a lazy
  // initializer — same hydration caveat as `isAdmin` above: on a hard
  // reload landing directly on this page, the persisted auth store can
  // still be null on this exact render, in which case views load empty
  // until the next mount (e.g. navigating away and back). Acceptable since
  // it self-corrects, and avoids an extra render-and-refetch cycle on every
  // normal (already-hydrated) mount.
  const [savedViews, setSavedViews] = useState<SavedView[]>(() =>
    user?.id ? loadSavedViews(user.id) : []
  );
  const [activeViewName, setActiveViewName] = useState<string | null>(null);
  const [saveViewDialogOpen, setSaveViewDialogOpen] = useState(false);
  const [newViewName, setNewViewName] = useState("");

  // Only reachable via the Select's onValueChange — Radix's dropdown doesn't
  // open under jsdom (no real pointer events), so this can't be driven from
  // an RTL test the way the rest of the saved-views UI is. Same accepted gap
  // already documented for ContractForm's Select fields.
  /* istanbul ignore next */
  const handleApplyView = (name: string) => {
    const view = savedViews.find((v) => v.name === name);
    if (!view) return;
    setActiveViewName(name);
    setSearchQuery(view.searchQuery);
    setStatusFilter(view.statusFilter);
    setPageSize(view.pageSize);
    setSortKey(view.sortKey);
    setSortDirection(view.sortDirection);
    setPage(0);
  };

  const handleSaveView = () => {
    /* istanbul ignore next */
    if (!user?.id || !newViewName.trim()) return;
    const view: SavedView = {
      name: newViewName.trim(),
      searchQuery,
      statusFilter,
      pageSize,
      sortKey,
      sortDirection,
    };
    const next = [...savedViews.filter((v) => v.name !== view.name), view];
    setSavedViews(next);
    persistSavedViews(user.id, next);
    setActiveViewName(view.name);
    setNewViewName("");
    setSaveViewDialogOpen(false);
  };

  const handleDeleteView = (name: string) => {
    /* istanbul ignore next */
    if (!user?.id) return;
    const next = savedViews.filter((v) => v.name !== name);
    setSavedViews(next);
    persistSavedViews(user.id, next);
    // The only caller passes activeViewName, so this is always true today —
    // kept as a guard in case a future per-row delete button can target a
    // non-active view.
    /* istanbul ignore else */
    if (activeViewName === name) setActiveViewName(null);
  };

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Use paginated hook with params
  const { data, isLoading, isError } = useContractsPaged({
    page,
    size: pageSize,
    query: searchQuery,
    status: statusFilter,
  });

  // Extract data from PageResponse
  const contracts = sortContracts(data?.content ?? [], sortKey, sortDirection);
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  const handleSort = (key: SortableColumn) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const handleToggleSelectAll = () => {
    setSelectedIds(
      selectedIds.size === contracts.length
        ? new Set()
        : new Set(contracts.map((c) => c.id))
    );
  };

  const handleToggleSelectOne = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    contract: Contract | null;
  }>({ open: false, contract: null });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => contractsService.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: contractsQueryKeys.list() });
      toast.success("Contratto eliminato");
      setDeleteDialog({ open: false, contract: null });
    },
    onError: () => {
      toast.error("Eliminazione del contratto non riuscita");
    },
  });

  const handleDeleteClick = (contract: Contract) => {
    setDeleteDialog({ open: true, contract });
  };

  const handleDeleteConfirm = () => {
    /* istanbul ignore else */
    if (deleteDialog.contract) {
      deleteMutation.mutate(deleteDialog.contract.id);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    setIsBulkDeleting(true);
    const ids = [...selectedIds];
    const results = await Promise.allSettled(ids.map((id) => contractsService.delete(id)));
    const failed = results.filter((r) => r.status === "rejected").length;
    const succeeded = ids.length - failed;

    void queryClient.invalidateQueries({ queryKey: contractsQueryKeys.list() });
    setIsBulkDeleting(false);
    setBulkDeleteDialogOpen(false);
    setSelectedIds(new Set());

    if (failed === 0) {
      toast.success(`${succeeded} contratt${succeeded === 1 ? "o" : "i"} eliminat${succeeded === 1 ? "o" : "i"}`);
    } else if (succeeded === 0) {
      toast.error("Eliminazione dei contratti selezionati non riuscita");
    } else {
      toast.error(`${succeeded} eliminati, ${failed} non riusciti`);
    }
  };

  // Handle filter changes (reset to page 0)
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(0);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setPage(0);
  };

  // A row selected on one page/filter combination won't exist on another, so
  // any navigation that changes what's visible clears the selection. This is
  // React's "adjust state during render" pattern rather than an effect: it
  // only fires (and only re-renders) when the signature actually changes.
  const filterSignature = `${page}-${pageSize}-${searchQuery}-${statusFilter}`;
  const [prevFilterSignature, setPrevFilterSignature] = useState(filterSignature);
  if (filterSignature !== prevFilterSignature) {
    setPrevFilterSignature(filterSignature);
    setSelectedIds(new Set());
  }

  if (isLoading) {
    return <TableSkeleton rows={pageSize} columns={9} />;
  }

  if (isError) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border border-border">
        <p className="text-destructive">Impossibile caricare i contratti</p>
        <p className="text-sm text-muted-foreground mt-2">
          Controlla API / rete / token di autenticazione
        </p>
      </div>
    );
  }

  if (totalElements === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border border-border">
        <p className="text-muted-foreground">Nessun contratto trovato</p>
        <p className="text-sm text-muted-foreground mt-2">
          {searchQuery || statusFilter !== "ALL"
            ? "Modifica i criteri di ricerca o i filtri"
            : "Crea il tuo primo contratto per iniziare"}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Search and Filters */}
      <div className="mb-4 flex gap-2 md:gap-4 items-center flex-wrap">
        <div className="flex-1 min-w-50">
          <Input
            aria-label="Cerca contratti"
            placeholder="Cerca contratti..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="flex gap-2 items-center">
          <label htmlFor="status-filter" className="text-sm text-muted-foreground hidden sm:inline">Stato:</label>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger id="status-filter" aria-label="Filtra per stato" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tutti</SelectItem>
              {Object.entries(CONTRACT_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(searchQuery || statusFilter !== "ALL") && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="hidden sm:inline-flex"
            >
              Pulisci
            </Button>
          )}
        </div>

        <div className="flex gap-2 items-center">
          <Select
            value={activeViewName ?? ""}
            onValueChange={handleApplyView}
          >
            <SelectTrigger id="saved-views" className="w-40" aria-label="Viste salvate">
              <SelectValue placeholder="Viste salvate" />
            </SelectTrigger>
            <SelectContent>
              {savedViews.map((v) => (
                <SelectItem key={v.name} value={v.name}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSaveViewDialogOpen(true)}
            aria-label="Salva vista corrente"
          >
            <Save className="h-4 w-4" />
          </Button>

          {activeViewName && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteView(activeViewName)}
              aria-label="Elimina vista corrente"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div aria-live="polite" aria-atomic="true" className="text-xs md:text-sm text-muted-foreground">
          {totalElements} contratt{totalElements === 1 ? "o" : "i"}
        </div>
      </div>

      {/* Bulk action bar */}
      {isAdmin && selectedIds.size > 0 && (
        <div className="mb-4 flex items-center justify-between gap-4 px-4 py-2 bg-accent rounded-lg border border-border">
          <span className="text-sm text-foreground">
            {selectedIds.size} contratt{selectedIds.size === 1 ? "o" : "i"} selezionat{selectedIds.size === 1 ? "o" : "i"}
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setBulkDeleteDialogOpen(true)}
          >
            Elimina selezionati
          </Button>
        </div>
      )}

      {/* Table with Responsive Columns; on a phone, one card per contract */}
      <div className="bg-card rounded-lg border border-border overflow-x-auto">
        {isMobile ? (
          <ul aria-label="Contratti" className="divide-y divide-border">
            {contracts.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => router.push(`/contracts/${c.id}`)}
                  className="w-full text-left p-4 space-y-1.5 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-sm">{c.contractNumber}</span>
                    <div className="flex flex-wrap justify-end gap-1">
                      <Badge variant={getContractStatusVariant(c.status)} className="text-xs">
                        {CONTRACT_STATUS_LABELS[c.status] ?? c.status}
                      </Badge>
                      <ExpiringSoonBadge contract={c} className="text-xs" />
                    </div>
                  </div>
                  <p className="text-sm text-foreground">{c.counterparty?.name ?? "N/D"}</p>
                  {c.projectName && <p className="text-sm text-muted-foreground">{c.projectName}</p>}
                  <div className="text-sm">
                    <span className="text-muted-foreground">Prossima scadenza: </span>
                    <NextDeadline contract={c} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {isAdmin && (
                <TableHead className="w-10">
                  <Checkbox
                    aria-label="Seleziona tutti i contratti di questa pagina"
                    checked={contracts.length > 0 && selectedIds.size === contracts.length}
                    onCheckedChange={handleToggleSelectAll}
                  />
                </TableHead>
              )}
              {COLUMNS.map((col) => {
                const isActiveSort = sortKey === col.key;

                let ariaSortValue: "ascending" | "descending" | "none" = "none";
                if (isActiveSort) {
                  ariaSortValue = sortDirection === "asc" ? "ascending" : "descending";
                }

                let sortIcon = <ArrowUpDown className="h-3 w-3 opacity-40" aria-hidden="true" />;
                if (isActiveSort) {
                  sortIcon = sortDirection === "asc"
                    ? <ArrowUp className="h-3 w-3" aria-hidden="true" />
                    : <ArrowDown className="h-3 w-3" aria-hidden="true" />;
                }

                return (
                  <TableHead key={col.key} className={col.className} aria-sort={ariaSortValue}>
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className="flex items-center gap-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                    >
                      {col.label}
                      {sortIcon}
                    </button>
                  </TableHead>
                );
              })}
              <TableHead>Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((c) => (
              <TableRow key={c.id} data-state={selectedIds.has(c.id) ? "selected" : undefined}>
                {isAdmin && (
                  <TableCell>
                    <Checkbox
                      aria-label={`Seleziona contratto ${c.contractNumber}`}
                      checked={selectedIds.has(c.id)}
                      onCheckedChange={() => handleToggleSelectOne(c.id)}
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium text-sm">
                  {c.contractNumber}
                </TableCell>
                <TableCell className="text-sm">{c.counterparty?.name ?? "N/D"}</TableCell>
                <TableCell className="hidden md:table-cell text-sm">{c.projectName}</TableCell>
                <TableCell className="hidden lg:table-cell text-sm">{c.managerName || "Non assegnato"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant={getContractStatusVariant(c.status)} className="text-xs">
                      {CONTRACT_STATUS_LABELS[c.status] ?? c.status}
                    </Badge>
                    <ExpiringSoonBadge contract={c} className="text-xs" />
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm whitespace-nowrap">
                  <NextDeadline contract={c} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/contracts/${c.id}`)}
                      className="text-xs px-2"
                    >
                      Visualizza
                    </Button>
                    {isAdmin && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditClick(c)}
                          className="text-primary hover:text-primary text-xs px-2 hidden sm:inline-flex dark:text-[var(--accent-foreground)] dark:hover:text-[var(--accent-foreground)]"
                        >
                          Modifica
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(c)}
                          className="text-destructive hover:text-destructive text-xs px-2 hidden sm:inline-flex"
                        >
                          Elimina
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 md:px-6 py-4 border-t border-border gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="page-size" className="text-xs md:text-sm text-muted-foreground">Righe:</label>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPage(0);
                }}
              >
                <SelectTrigger id="page-size" aria-label="Righe per pagina" className="w-18 h-8 text-xs md:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
                aria-label="Pagina precedente"
                className="px-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {getPageNumbers(page, totalPages).map((p) =>
                typeof p === "string" ? (
                  <span
                    key={p}
                    className="px-1 text-sm text-muted-foreground select-none"
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(p)}
                    aria-label={`Vai a pagina ${p + 1}`}
                    aria-current={p === page ? "page" : undefined}
                    className="min-w-8 px-2 text-xs"
                  >
                    {p + 1}
                  </Button>
                )
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages - 1}
                aria-label="Pagina successiva"
                className="px-2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={/* istanbul ignore next */ (open) =>
          !deleteMutation.isPending &&
          setDeleteDialog({ open, contract: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Elimina contratto</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare il contratto{" "}
              <span className="font-semibold">
                {deleteDialog.contract?.contractNumber}
              </span>? L&apos;operazione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, contract: null })}
              disabled={deleteMutation.isPending}
            >
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {/* istanbul ignore next */deleteMutation.isPending ? "Eliminazione..." : "Elimina"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={bulkDeleteDialogOpen}
        onOpenChange={/* istanbul ignore next */ (open) => !isBulkDeleting && setBulkDeleteDialogOpen(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Elimina contratti selezionati</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare{" "}
              <span className="font-semibold">{selectedIds.size}</span> contratt{selectedIds.size === 1 ? "o" : "i"}?
              L&apos;operazione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkDeleteDialogOpen(false)}
              disabled={isBulkDeleting}
            >
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDeleteConfirm}
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? "Eliminazione..." : "Elimina"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save View Dialog */}
      <Dialog open={saveViewDialogOpen} onOpenChange={setSaveViewDialogOpen}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Salva vista corrente</DialogTitle>
            <DialogDescription>
              Salva la combinazione attuale di ricerca, filtro stato, ordinamento e righe per pagina.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="new-view-name" className="text-sm text-muted-foreground">
              Nome vista
            </label>
            <Input
              id="new-view-name"
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder="es. Contratti attivi per area Sales"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveViewDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSaveView} disabled={!newViewName.trim()}>
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}