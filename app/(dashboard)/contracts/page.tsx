"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import ContractTable from "@/components/contracts/ContractTable";
import ContractForm from "@/components/contracts/ContractForm";
import ContractImportDialog from "@/components/contracts/ContractImportDialog";
import { SemanticSearchBar } from "@/components/contracts/SemanticSearchBar";
import { MissingPrerequisiteBanner } from "@/components/shared/MissingPrerequisiteBanner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Contract } from "@/types";
import { contractsService } from "@/services/contracts.service";
import { useAuthStore } from "@/store/authStore";
import { useBusinessAreas } from "@/hooks/useBusinessAreas";
import { useManagers } from "@/hooks/useManagers";
import { useCounterparties } from "@/hooks/useCounterparties";
import { toast } from "sonner";
import { FileSpreadsheet, FileText, Upload } from "lucide-react";

type MissingPrerequisiteFlags = {
  missingAreas: boolean;
  missingManagers: boolean;
  missingCounterparties: boolean;
};

const PREREQUISITE_ITEMS = [
  { flag: "missingAreas", label: "un'area di business", action: { label: "Crea un'area di business", href: "/business-areas" } },
  { flag: "missingManagers", label: "un responsabile", action: { label: "Crea un responsabile", href: "/managers" } },
  { flag: "missingCounterparties", label: "una controparte", action: { label: "Crea una controparte", href: "/counterparties" } },
] as const;

/**
 * Consolidates the three independent "missing prerequisite" flags into the
 * banner's message/actions, kept out of the page component so its own
 * cognitive complexity stays low.
 */
function buildPrerequisiteInfo(flags: MissingPrerequisiteFlags, isAdmin: boolean) {
  const missingItems = PREREQUISITE_ITEMS.filter((item) => flags[item.flag]);
  const missingLabels = missingItems.map((item) => item.label);
  const contactSuffix = isAdmin ? "" : " Contatta un amministratore.";
  const message = `Per creare un contratto serve prima ${missingLabels.join(" e ")}.${contactSuffix}`;
  const actions = isAdmin ? missingItems.map((item) => item.action) : [];
  return { message, actions };
}

const EXPORT_CONFIG = {
  excel: {
    extension: "xlsx",
    label: "Excel",
    exportFn: () => contractsService.exportExcel(),
    errorMessage: "Esportazione del file Excel non riuscita",
  },
  pdf: {
    extension: "pdf",
    label: "PDF",
    exportFn: () => contractsService.exportPdf(),
    errorMessage: "Esportazione del file PDF non riuscita",
  },
} as const;

/** Triggers a browser download for the exported blob — shared by the Excel/PDF buttons. */
async function exportContracts(kind: keyof typeof EXPORT_CONFIG) {
  const config = EXPORT_CONFIG[kind];
  const blob = await config.exportFn();
  const url = globalThis.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `contracts_${new Date().toISOString().split("T")[0]}.${config.extension}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  globalThis.URL.revokeObjectURL(url);
  toast.success(`${config.label} esportato`);
}

function ContractsPageContent() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";
  const searchParams = useSearchParams();
  const initialSearchQuery = searchParams.get("q") ?? "";

  const businessAreasQuery = useBusinessAreas();
  const managersQuery = useManagers();
  const counterpartiesQuery = useCounterparties();
  const missingAreas = businessAreasQuery.isSuccess && businessAreasQuery.data.length === 0;
  const missingManagers = managersQuery.isSuccess && managersQuery.data.length === 0;
  const missingCounterparties = counterpartiesQuery.isSuccess && counterpartiesQuery.data.length === 0;
  const hasMissingPrerequisite = missingAreas || missingManagers || missingCounterparties;

  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    contract: Contract | null;
  }>({ open: false, contract: null });

  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const [isExporting, setIsExporting] = useState(false);

  const handleCreateClick = () => {
    setFormDialog({ open: true, contract: null });
  };

  const { message: prerequisiteMessage, actions: prerequisiteActions } = buildPrerequisiteInfo(
    { missingAreas, missingManagers, missingCounterparties },
    isAdmin
  );

  const handleEditClick = (contract: Contract) => {
    setFormDialog({ open: true, contract });
  };

  const handleCloseForm = () => {
    setFormDialog({ open: false, contract: null });
  };

  const handleExport = async (kind: keyof typeof EXPORT_CONFIG) => {
    setIsExporting(true);
    try {
      await exportContracts(kind);
    } catch (error) {
      toast.error(EXPORT_CONFIG[kind].errorMessage);
      console.error(`Export ${kind} error:`, error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Contratti
          </h1>
          <p className="text-muted-foreground mt-2">Gestisci tutti i contratti aziendali</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport("excel")}
            disabled={isExporting}
            className="hidden sm:flex"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {isExporting ? "Esportazione..." : "Excel"}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport("pdf")}
            disabled={isExporting}
            className="hidden sm:flex"
          >
            <FileText className="mr-2 h-4 w-4" />
            {isExporting ? "Esportazione..." : "PDF"}
          </Button>
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(true)}
              className="hidden sm:flex"
            >
              <Upload className="mr-2 h-4 w-4" />
              Importa
            </Button>
          )}
          {isAdmin && (
            <Button onClick={handleCreateClick} disabled={hasMissingPrerequisite}>
              + Nuovo contratto
            </Button>
          )}
        </div>
      </div>

      {hasMissingPrerequisite && (
        <MissingPrerequisiteBanner message={prerequisiteMessage} actions={prerequisiteActions} />
      )}

      <SemanticSearchBar />

      <ContractTable onEditClick={handleEditClick} initialSearchQuery={initialSearchQuery} />

      {isAdmin && (
        <ContractImportDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />
      )}

      <Dialog open={formDialog.open} onOpenChange={(open) => !open && handleCloseForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>
              {formDialog.contract ? "Modifica contratto" : "Crea nuovo contratto"}
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

export default function ContractsPage() {
  return (
    <Suspense>
      <ContractsPageContent />
    </Suspense>
  );
}