"use client";

import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUsers, usersQueryKeys } from "@/hooks/useUsers";
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
    if (deleteDialog.user) {
      deleteMutation.mutate(deleteDialog.user.id);
    }
  };

  if (isLoading) {
    return <TableSkeleton rows={5} columns={7} />;
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-red-600">
        Failed to load users. Please try again.
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No users found. Create your first one!
      </div>
    );
  }

  return (
    <>
      {/* Search and Filters */}
      <div className="mb-4 flex gap-4 items-center flex-wrap">
        <div className="flex-1 min-w-[300px]">
          <Input
            placeholder="Search users (username)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-600">Status:</span>
          <select
            value={verifiedFilter}
            onChange={(e) => setVerifiedFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            >
              Clear Filters
            </Button>
          )}
        </div>

        <div className="text-sm text-gray-600">
          {filteredUsers.length} / {users.length} users
        </div>
      </div>

      {/* Empty state after filtering */}
      {filteredUsers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No users match your filters
        </div>
      )}

      {/* Table */}
      {filteredUsers.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Manager ID</TableHead>
                <TableHead>Role ID</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.id}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.managerId}</TableCell>
                  <TableCell>{user.roleId}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${user.verified
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                        }`}
                    >
                      {user.verified ? "Yes" : "No"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditClick(user)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(user)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete user <span className="font-semibold">{deleteDialog.user?.username}</span>? This action cannot be undone.
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
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}