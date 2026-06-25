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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { TableSkeleton } from "@/components/ui/table-skeleton";

type PageItem = number | "ellipsis-start" | "ellipsis-end";

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

  // Use paginated hook with params
  const { data, isLoading, isError } = useContractsPaged({
    page,
    size: pageSize,
    query: searchQuery,
    status: statusFilter,
  });

  // Extract data from PageResponse
  const contracts = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

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

        <div aria-live="polite" aria-atomic="true" className="text-xs md:text-sm text-muted-foreground">
          {totalElements} contratt{totalElements === 1 ? "o" : "i"}
        </div>
      </div>

      {/* Table with Responsive Columns */}
      <div className="bg-card rounded-lg border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numero</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden md:table-cell">Progetto</TableHead>
              <TableHead className="hidden lg:table-cell">Codice WBS</TableHead>
              <TableHead className="hidden lg:table-cell">Responsabile</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead className="hidden md:table-cell">Data inizio</TableHead>
              <TableHead className="hidden lg:table-cell">Data fine</TableHead>
              <TableHead>Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((c) => (
              <TableRow key={c.id}>
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
                      className="text-green-600 hover:text-green-700 text-xs px-2"
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
    </>
  );
}