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
      toast.success("User deleted successfully!");
      setDeleteDialog({ open: false, user: null });
    },
    onError: () => {
      toast.error("Failed to delete user");
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
        Failed to load users. Please try again.
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No users found. Create your first one!
      </div>
    );
  }

  return (
    <>
      {/* Search and Filters */}
      <div className="mb-4 flex gap-2 md:gap-4 items-center flex-wrap">
        <div className="flex-1 min-w-50">
          <Input
            aria-label="Search users"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="flex gap-2 items-center">
          <label htmlFor="verified-filter" className="text-sm text-muted-foreground hidden sm:inline">Status:</label>
          <select
            id="verified-filter"
            aria-label="Filter by verification status"
            value={verifiedFilter}
            onChange={(e) => setVerifiedFilter(e.target.value)}
            className="px-2 md:px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">All</option>
            <option value="VERIFIED">Verified</option>
            <option value="UNVERIFIED">Unverified</option>
          </select>

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
              Clear
            </Button>
          )}
        </div>

        <div aria-live="polite" aria-atomic="true" className="text-xs md:text-sm text-muted-foreground">
          {filteredUsers.length} / {users.length} users
        </div>
      </div>

      {/* Empty state after filtering */}
      {filteredUsers.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No users match your filters
        </div>
      )}

      {/* Table with Responsive Columns */}
      {filteredUsers.length > 0 && (
        <div className="bg-card rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden lg:table-cell">ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead className="hidden md:table-cell">Manager</TableHead>
                <TableHead className="hidden md:table-cell">Role</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead className="hidden lg:table-cell">Created At</TableHead>
                <TableHead>Actions</TableHead>
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
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${user.verified
                          ? "bg-green-100 text-green-800"
                          : "bg-muted text-muted-foreground"
                        }`}
                    >
                      {user.verified ? "Yes" : "No"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditClick(user)}
                        className="text-primary hover:text-primary text-xs px-2"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(user)}
                        className="text-destructive hover:text-destructive text-xs px-2"
                      >
                        Delete
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
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete user{" "}
              <span className="font-semibold">{deleteDialog.user?.username}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, user: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {/* istanbul ignore next */deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}