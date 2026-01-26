"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import ContractTable from "@/components/contracts/ContractTable";
import ContractForm from "@/components/contracts/ContractForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Contract } from "@/types";

export default function ContractsPage() {
  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    contract: Contract | null;
  }>({ open: false, contract: null });

  const handleCreateClick = () => {
    setFormDialog({ open: true, contract: null });
  };

  const handleEditClick = (contract: Contract) => {
    setFormDialog({ open: true, contract });
  };

  const handleCloseForm = () => {
    setFormDialog({ open: false, contract: null });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Contracts
          </h2>
          <p className="text-gray-500 mt-2">Manage all business contracts</p>
        </div>
        <Button onClick={handleCreateClick}>+ New Contract</Button>
      </div>

      <ContractTable onEditClick={handleEditClick} />

      <Dialog open={formDialog.open} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formDialog.contract ? "Edit Contract" : "Create New Contract"}
            </DialogTitle>
          </DialogHeader>
          <ContractForm
            contract={formDialog.contract}
            onClose={handleCloseForm}
            onSuccess={() => { }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}