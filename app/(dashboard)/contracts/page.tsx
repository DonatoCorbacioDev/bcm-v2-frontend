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

export default function ContractsPage() {
  const [showForm, setShowForm] = useState(false);

  const handleSuccess = () => {
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
        <Button onClick={() => setShowForm(true)}>+ New Contract</Button>
      </div>

      <ContractTable />

      {/* Dialog for the form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Contract</DialogTitle>
          </DialogHeader>
          <ContractForm
            onClose={() => setShowForm(false)}
            onSuccess={handleSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
