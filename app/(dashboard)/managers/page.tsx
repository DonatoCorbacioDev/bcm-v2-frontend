"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import ManagerTable from "@/components/managers/ManagerTable";
import ManagerForm from "@/components/managers/ManagerForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Manager } from "@/types";

export default function ManagersPage() {
  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    manager: Manager | null;
  }>({ open: false, manager: null });

  const handleCreateClick = () => {
    setFormDialog({ open: true, manager: null });
  };

  const handleEditClick = (manager: Manager) => {
    setFormDialog({ open: true, manager });
  };

  const handleCloseForm = () => {
    setFormDialog({ open: false, manager: null });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Managers
          </h2>
          <p className="text-gray-500 mt-2">Manage team managers</p>
        </div>
        <Button onClick={handleCreateClick}>+ New Manager</Button>
      </div>

      <ManagerTable onEditClick={handleEditClick} />

      <Dialog open={formDialog.open} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formDialog.manager ? "Edit Manager" : "Create New Manager"}
            </DialogTitle>
          </DialogHeader>
          <ManagerForm
            manager={formDialog.manager}
            onClose={handleCloseForm}
            onSuccess={() => { }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}