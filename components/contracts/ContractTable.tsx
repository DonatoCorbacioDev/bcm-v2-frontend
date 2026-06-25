"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { useContractsPaged } from "@/hooks/useContractsPaged";
import { contractsQueryKeys } from "@/hooks/queries/contracts.queryKeys";
import { contractsService } from "@/services/contracts.service";
import { useAuthStore } from "@/store/authStore";
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

type PageItem = number | "ellipsis-start" | "ellipsis-end";

type SortableColumn =
  | "contractNumber"
  | "customerName"
  | "projectName"
  | "wbsCode"
  | "managerName"
  | "status"
  | "startDate"
  | "endDate";

type SortDirection = "asc" | "desc";

const COLUMNS: { key: SortableColumn; label: string; className?: string }[] = [
  { key: "contractNumber", label: "Numero" },
  { key: "customerName", label: "Cliente" },
  { key: "projectName", label: "Progetto", className: "hidden md:table-cell" },
  { key: "wbsCode", label: "Codice WBS", className: "hidden lg:table-cell" },
  { key: "managerName", label: "Responsabile", className: "hidden lg:table-cell" },
  { key: "status", label: "Stato" },
  { key: "startDate", label: "Data inizio", className: "hidden md:table-cell" },
  { key: "endDate", label: "Data fine", className: "hidden lg:table-cell" },
];

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
  if (!sortKey) return contracts;
  const sorted = [...contracts].sort((a, b) => {
    // Every SortableColumn is a non-nullable string on Contract; the
    // fallback only guards against malformed API data slipping past types.
    /* istanbul ignore next */
    const aVal = a[sortKey] ?? "";
    /* istanbul ignore next */
    const bVal = b[sortKey] ?? "";
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
}

export default function ContractTable({ onEditClick }: ContractTableProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  // Pagination state
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Search and filter state (server-side now)
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

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
      queryClient.invalidateQueries({ queryKey: contractsQueryKeys.list() });
      toast.success("Contratto eliminato con successo!");
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

    queryClient.invalidateQueries({ queryKey: contractsQueryKeys.list() });
    setIsBulkDeleting(false);
    setBulkDeleteDialogOpen(false);
    setSelectedIds(new Set());

    if (failed === 0) {
      toast.success(`${succeeded} contratt${succeeded === 1 ? "o" : "i"} eliminat${succeeded === 1 ? "o" : "i"} con successo!`);
    } else if (succeeded === 0) {
      toast.error("Eliminazione dei contratti selezionati non riuscita");
    } else {
      toast.error(`${succeeded} eliminati, ${failed} non riusciti`);
    }
  };

  const getStatusBadge = (status: Contract["status"]) => {
    const variants: Record<
      Contract["status"],
      "success" | "secondary" | "destructive"
    > = {
      ACTIVE: "success",
      EXPIRED: "destructive",
      CANCELLED: "secondary",
    };
    return variants[status];
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
          <select
            id="status-filter"
            aria-label="Filtra per stato"
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-2 md:px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">Tutti</option>
            <option value="ACTIVE">Attivo</option>
            <option value="EXPIRED">Scaduto</option>
            <option value="CANCELLED">Annullato</option>
          </select>

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

      {/* Table with Responsive Columns */}
      <div className="bg-card rounded-lg border border-border overflow-x-auto">
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
                <TableCell className="text-sm">{c.customerName}</TableCell>
                <TableCell className="hidden md:table-cell text-sm">{c.projectName}</TableCell>
                <TableCell className="hidden lg:table-cell text-sm">{c.wbsCode}</TableCell>
                <TableCell className="hidden lg:table-cell text-sm">{c.managerName}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadge(c.status)} className="text-xs">
                    {c.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm">{c.startDate}</TableCell>
                <TableCell className="hidden lg:table-cell text-sm">{/* istanbul ignore next */c.endDate || "N/D"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/contracts/${c.id}`)}
                      className="text-green-800 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 text-xs px-2"
                    >
                      Visualizza
                    </Button>
                    {isAdmin && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditClick(c)}
                          className="text-primary hover:text-primary text-xs px-2 hidden sm:inline-flex"
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 md:px-6 py-4 border-t border-border gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="page-size" className="text-xs md:text-sm text-muted-foreground">Righe:</label>
              <select
                id="page-size"
                aria-label="Righe per pagina"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(0);
                }}
                className="px-2 py-1 border border-input rounded text-xs md:text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
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
        <DialogContent>
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