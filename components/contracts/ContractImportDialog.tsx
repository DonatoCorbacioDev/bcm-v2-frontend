"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";

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
import { contractsQueryKeys } from "@/hooks/queries/contracts.queryKeys";
import { contractsService } from "@/services/contracts.service";
import type { ContractImportResult } from "@/types";

function downloadBlob(blob: Blob, filename: string) {
  const url = globalThis.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  globalThis.URL.revokeObjectURL(url);
}

interface ContractImportDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export default function ContractImportDialog({ open, onOpenChange }: ContractImportDialogProps) {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [result, setResult] = useState<ContractImportResult | null>(null);
  // Native file inputs are uncontrolled: clearing the selection on close
  // requires remounting the element, not resetting a value prop.
  const [inputKey, setInputKey] = useState(0);

  const importMutation = useMutation({
    mutationFn: (file: File) => contractsService.importExcel(file),
    onSuccess: (data) => {
      setResult(data);
      if (data.importedCount > 0) {
        queryClient.invalidateQueries({ queryKey: contractsQueryKeys.list() });
      }
      if (data.errorCount === 0) {
        toast.success(`${data.importedCount} contratt${data.importedCount === 1 ? "o" : "i"} importat${data.importedCount === 1 ? "o" : "i"} con successo!`);
      } else if (data.importedCount === 0) {
        toast.error("Nessun contratto importato: controlla gli errori");
      } else {
        toast.error(`${data.importedCount} importati, ${data.errorCount} righe con errori`);
      }
    },
    onError: () => {
      toast.error("Importazione non riuscita. Controlla che il file sia un .xlsx valido");
    },
  });

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      const blob = await contractsService.downloadImportTemplate();
      downloadBlob(blob, "template_import_contratti.xlsx");
    } catch {
      toast.error("Impossibile scaricare il template");
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResult(null);
    setSelectedFile(e.target.files?.[0] ?? null);
  };

  const handleImport = () => {
    /* istanbul ignore else */
    if (selectedFile) {
      importMutation.mutate(selectedFile);
    }
  };

  const handleClose = () => {
    /* istanbul ignore next */
    if (importMutation.isPending) return;
    setSelectedFile(null);
    setResult(null);
    setInputKey((k) => k + 1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importa contratti da Excel</DialogTitle>
          <DialogDescription>
            Carica un file .xlsx per creare più contratti in una volta. Le righe con
            errori vengono segnalate singolarmente: le altre vengono comunque importate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadTemplate}
            disabled={isDownloadingTemplate}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            {isDownloadingTemplate ? "Download..." : "Scarica template"}
          </Button>

          <div className="space-y-2">
            <label htmlFor="import-file" className="text-sm text-muted-foreground">
              File Excel (.xlsx)
            </label>
            <Input
              key={inputKey}
              id="import-file"
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
            />
          </div>

          {result && (
            <div className="rounded-md border border-border p-3 space-y-2 max-h-60 overflow-y-auto">
              <p className="text-sm font-medium text-foreground">
                {result.totalRows} righe lette · {result.importedCount} importate · {result.errorCount} con errori
              </p>
              {result.errors.length > 0 && (
                <ul className="text-xs text-destructive space-y-1">
                  {result.errors.map((err) => (
                    <li key={err.rowNumber}>
                      Riga {err.rowNumber}: {err.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={importMutation.isPending}>
            Chiudi
          </Button>
          <Button onClick={handleImport} disabled={!selectedFile || importMutation.isPending}>
            <Upload className="mr-2 h-4 w-4" />
            {importMutation.isPending ? "Importazione..." : "Importa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
