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
import { contractsService } from "@/services/contracts.service";
import { toast } from "sonner";
import { FileSpreadsheet, FileText } from "lucide-react";

export default function ContractsPage() {
  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    contract: Contract | null;
  }>({ open: false, contract: null });

  const [isExporting, setIsExporting] = useState(false);

  const handleCreateClick = () => {
    setFormDialog({ open: true, contract: null });
  };

  const handleEditClick = (contract: Contract) => {
    setFormDialog({ open: true, contract });
  };

  const handleCloseForm = () => {
    setFormDialog({ open: false, contract: null });
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const blob = await contractsService.exportExcel();
      const url = globalThis.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `contracts_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      globalThis.URL.revokeObjectURL(url);
      toast.success("Excel exported successfully!");
    } catch (error) {
      toast.error("Failed to export Excel file");
      console.error("Export Excel error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const blob = await contractsService.exportPdf();
      const url = globalThis.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `contracts_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      globalThis.URL.revokeObjectURL(url);
      toast.success("PDF exported successfully!");
    } catch (error) {
      toast.error("Failed to export PDF file");
      console.error("Export PDF error:", error);
    } finally {
      setIsExporting(false);
    }
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={isExporting}
            className="hidden sm:flex"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Excel"}
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPdf}
            disabled={isExporting}
            className="hidden sm:flex"
          >
            <FileText className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "PDF"}
          </Button>
          <Button onClick={handleCreateClick}>+ New Contract</Button>
        </div>
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