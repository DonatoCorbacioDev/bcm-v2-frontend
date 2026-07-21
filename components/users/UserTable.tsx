"use client";

import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUsers, usersQueryKeys } from "@/hooks/useUsers";
import { useManagers } from "@/hooks/useManagers";
import { useRoles } from "@/hooks/useRoles";
import { usersService } from "@/services/users.service";
import type { User } from "@/types";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { TableSkeleton } from "@/components/ui/table-skeleton";

interface UserTableProps {
  readonly onEditClick: (user: User) => void;
}

// Search and filter logic for users
function useUserFilters(users: User[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("ALL");

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase());

      // Verified filter
      const matchesVerified =
        verifiedFilter === "ALL" ||
        (verifiedFilter === "VERIFIED" && user.verified) ||
        (verifiedFilter === "UNVERIFIED" && !user.verified);

      return matchesSearch && matchesVerified;
    });
  }, [users, searchQuery, verifiedFilter]);

  return {
    searchQuery,
    setSearchQuery,
    verifiedFilter,
    setVerifiedFilter,
    filteredUsers,
  };
}

export default function UserTable({ onEditClick }: UserTableProps) {
  const { data: users = [], isLoading, isError } = useUsers();
  /* istanbul ignore next */
  const { data: managers = [] } = useManagers();
  const { data: roles = [] } = useRoles();
  const managerMap = useMemo(
    () => new Map(managers.map((m) => [m.id, `${m.firstName} ${m.lastName}`])),
    [managers]
  );
  const roleMap = useMemo(
    () => new Map(roles.map((r) => [r.id, r.role])),
    [roles]
  );
  const queryClient = useQueryClient();

  // Search and filter state
  const {
    searchQuery,
    setSearchQuery,
    verifiedFilter,
    setVerifiedFilter,
    filteredUsers,
  } = useUserFilters(users);

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    user: User | null;
  }>({ open: false, user: null });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await usersService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.all });
      toast.success("Utente eliminato con successo!");
      setDeleteDialog({ open: false, user: null });
    },
    onError: () => {
      toast.error("Eliminazione dell'utente non riuscita");
    },
  });

  const handleDeleteClick = (user: User) => {
    setDeleteDialog({ open: true, user });
  };

  const confirmDelete = () => {
    /* istanbul ignore else */
    if (deleteDialog.user) {
      deleteMutation.mutate(deleteDialog.user.id);
    }
  };

  if (isLoading) {
    return <TableSkeleton rows={5} columns={7} />;
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-destructive">
        Impossibile caricare gli utenti. Riprova.
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nessun utente trovato. Creane uno!
      </div>
    );
  }

  return (
    <>
      {/* Search and Filters */}
      <div className="mb-4 flex gap-2 md:gap-4 items-center flex-wrap">
        <div className="flex-1 min-w-50">
          <Input
            aria-label="Cerca utenti"
            placeholder="Cerca utenti..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="flex gap-2 items-center">
          <label htmlFor="verified-filter" className="text-sm text-muted-foreground hidden sm:inline">Stato:</label>
          <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
            <SelectTrigger id="verified-filter" aria-label="Filtra per stato di verifica" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tutti</SelectItem>
              <SelectItem value="VERIFIED">Verificato</SelectItem>
              <SelectItem value="UNVERIFIED">Non verificato</SelectItem>
            </SelectContent>
          </Select>

          {(searchQuery || verifiedFilter !== "ALL") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setVerifiedFilter("ALL");
              }}
              className="hidden sm:inline-flex"
            >
              Pulisci
            </Button>
          )}
        </div>

        <div aria-live="polite" aria-atomic="true" className="text-xs md:text-sm text-muted-foreground">
          {filteredUsers.length} / {users.length} utenti
        </div>
      </div>

      {/* Empty state after filtering */}
      {filteredUsers.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nessun utente corrisponde ai filtri
        </div>
      )}

      {/* Table with Responsive Columns */}
      {filteredUsers.length > 0 && (
        <div className="bg-card rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden lg:table-cell">ID</TableHead>
                <TableHead>Nome utente</TableHead>
                <TableHead className="hidden md:table-cell">Manager</TableHead>
                <TableHead className="hidden md:table-cell">Ruolo</TableHead>
                <TableHead>Verificato</TableHead>
                <TableHead className="hidden md:table-cell">Approvatore</TableHead>
                <TableHead className="hidden lg:table-cell">Data creazione</TableHead>
                <TableHead>Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="hidden lg:table-cell font-medium text-sm">{user.id}</TableCell>
                  <TableCell className="text-sm">{user.username}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{/* istanbul ignore next */managerMap.get(user.managerId) ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{roleMap.get(user.roleId) ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={user.verified ? "success" : "secondary"}>
                      {user.verified ? "Sì" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={user.canApproveContracts ? "success" : "secondary"}>
                      {user.canApproveContracts ? "Sì" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">
                    {new Date(user.createdAt).toLocaleDateString("it-IT")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditClick(user)}
                        className="text-primary hover:text-primary text-xs px-2"
                      >
                        Modifica
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(user)}
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
        onOpenChange={/* istanbul ignore next */ (open) => !deleteMutation.isPending && setDeleteDialog({ open, user: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Elimina utente</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare l&apos;utente{" "}
              <span className="font-semibold">{deleteDialog.user?.username}</span>? L&apos;operazione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, user: null })}
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