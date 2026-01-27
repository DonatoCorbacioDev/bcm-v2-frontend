"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import UserTable from "@/components/users/UserTable";
import UserForm from "@/components/users/UserForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { User } from "@/types";

export default function UsersPage() {
  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    user: User | null;
  }>({ open: false, user: null });

  const handleCreateClick = () => {
    setFormDialog({ open: true, user: null });
  };

  const handleEditClick = (user: User) => {
    setFormDialog({ open: true, user });
  };

  const handleCloseForm = () => {
    setFormDialog({ open: false, user: null });
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-gray-600 mt-1">Manage system users</p>
        </div>
        <Button onClick={handleCreateClick}>+ New User</Button>
      </div>

      <UserTable onEditClick={handleEditClick} />

      {/* Create/Edit Dialog */}
      <Dialog open={formDialog.open} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formDialog.user ? "Edit User" : "Create New User"}
            </DialogTitle>
          </DialogHeader>
          <UserForm
            user={formDialog.user}
            onClose={handleCloseForm}
            onSuccess={() => { }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}