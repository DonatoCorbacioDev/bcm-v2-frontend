"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Pencil, Trash2 } from "lucide-react";

import { useContractTemplates } from "@/hooks/useContractTemplates";
import { contractTemplatesQueryKeys } from "@/hooks/queries/contractTemplates.queryKeys";
import { contractTemplatesService } from "@/services/contractTemplates.service";
import { useAuthStore } from "@/store/authStore";
import type { ContractTemplate } from "@/types";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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

import InstantiateTemplateDialog from "@/components/contract-templates/InstantiateTemplateDialog";

interface ContractTemplateTableProps {
  readonly onEditClick: (template: ContractTemplate) => void;
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Attivo",
  DRAFT: "Bozza",
  EXPIRED: "Scaduto",
  CANCELLED: "Annullato",
};

const STATUS_VARIANTS: Record<string, "success" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "success",
  DRAFT: "outline",
  EXPIRED: "destructive",
  CANCELLED: "secondary",
};

export default function ContractTemplateTable({ onEditClick }: ContractTemplateTableProps) {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  const [search, setSearch] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; template: ContractTemplate | null }>({
    open: false,
    template: null,
  });
  const [instantiateDialog, setInstantiateDialog] = useState<{
    open: boolean;
    template: ContractTemplate | null;
  }>({ open: false, template: null });

  const { data, isLoading, isError } = useContractTemplates();

  const filteredTemplates = (data ?? []).filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const deleteMutation = useMutation({
    mutationFn: (id: number) => contractTemplatesService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contractTemplatesQueryKeys.list() });
      toast.success("Template eliminato con successo!");
      setDeleteDialog({ open: false, template: null });
    },
    onError: () => {
      toast.error("Eliminazione del template non riuscita");
    },
  });

  if (isLoading) return <TableSkeleton rows={5} columns={6} />;

  if (isError) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border border-border">
        <p className="text-destructive">Impossibile caricare i template</p>
        <p className="text-sm text-muted-foreground mt-2">Controlla API / rete / token di autenticazione</p>
      </div>
    );
  }

  return (
    <>
      {/* Search */}
      <div className="mb-4 flex items-center gap-4">
        <Input
          aria-label="Cerca template"
          placeholder="Cerca template..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "" : ""}
        </span>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <p className="text-muted-foreground">Nessun template trovato</p>
          <p className="text-sm text-muted-foreground mt-2">
            {search
              ? "Modifica i criteri di ricerca"
              : isAdmin
              ? "Crea il primo template per iniziare"
              : "Nessun template disponibile"}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Descrizione</TableHead>
                <TableHead>Stato predefinito</TableHead>
                <TableHead className="hidden lg:table-cell">Durata (gg)</TableHead>
                <TableHead className="hidden lg:table-cell">Rinnovo auto</TableHead>
                <TableHead>Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium text-sm">{t.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-xs truncate">
                    {t.description ?? "—"}
                  </TableCell>
                  <TableCell>
                    {t.defaultStatus ? (
                      <Badge variant={STATUS_VARIANTS[t.defaultStatus] ?? "outline"} className="text-xs">
                        {STATUS_LABELS[t.defaultStatus] ?? t.defaultStatus}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">
                    {t.defaultDurationDays ?? "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">
                    {t.autoRenew ? "Sì" : "No"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInstantiateDialog({ open: true, template: t })}
                        className="text-xs px-2"
                        title="Crea contratto da questo template"
                      >
                        <Copy className="h-3 w-3 mr-1" aria-hidden="true" />
                        Usa
                      </Button>
                      {isAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditClick(t)}
                            className="text-primary hover:text-primary text-xs px-2 hidden sm:inline-flex"
                            title="Modifica template"
                          >
                            <Pencil className="h-3 w-3 mr-1" aria-hidden="true" />
                            Modifica
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteDialog({ open: true, template: t })}
                            className="text-destructive hover:text-destructive text-xs px-2 hidden sm:inline-flex"
                            title="Elimina template"
                          >
                            <Trash2 className="h-3 w-3 mr-1" aria-hidden="true" />
                            Elimina
                          </Button>
                        </>
                      )}
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
        onOpenChange={/* istanbul ignore next */ (open) =>
          !deleteMutation.isPending && setDeleteDialog({ open, template: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Elimina template</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare il template{" "}
              <span className="font-semibold">{deleteDialog.template?.name}</span>?
              L&apos;operazione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, template: null })}
              disabled={deleteMutation.isPending}
            >
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                /* istanbul ignore else */
                if (deleteDialog.template) deleteMutation.mutate(deleteDialog.template.id);
              }}
              disabled={deleteMutation.isPending}
            >
              {/* istanbul ignore next */}
              {deleteMutation.isPending ? "Eliminazione..." : "Elimina"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Instantiate Dialog */}
      <InstantiateTemplateDialog
        template={instantiateDialog.template}
        open={instantiateDialog.open}
        onOpenChange={(open) =>
          setInstantiateDialog((prev) => ({ ...prev, open }))
        }
      />
    </>
  );
}
