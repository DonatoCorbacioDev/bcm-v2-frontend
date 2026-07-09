"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, Download, Trash2, Receipt, Loader2, Landmark, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import api from "@/lib/api";
import { sepaPaymentsService, type SepaPaymentBatch } from "@/services/sepaPayments.service";

interface LineItem {
  lineNumber: number;
  description: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  totalPrice: number;
  vatRate: number;
}

interface ElectronicInvoice {
  id: number;
  contractId: number;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  downloadUrl: string;
  supplierName: string;
  supplierVatNumber: string;
  documentType: string;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;
  currency: string;
  lineItems: LineItem[];
  supplierIban: string | null;
  supplierBic: string | null;
  paymentDueDate: string | null;
  sepaBatchId: number | null;
}

interface InvoicesTabProps {
  readonly contractId: number;
  readonly isAdmin: boolean;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatAmount(amount: number, currency: string) {
  return `${amount.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export default function InvoicesTab({ contractId, isAdmin }: InvoicesTabProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<ElectronicInvoice | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [paymentDetailsInvoice, setPaymentDetailsInvoice] = useState<ElectronicInvoice | null>(null);
  const [ibanInput, setIbanInput] = useState("");
  const [bicInput, setBicInput] = useState("");
  const [dueDateInput, setDueDateInput] = useState("");

  const { data: invoices, isLoading } = useQuery<ElectronicInvoice[]>({
    queryKey: ["invoices", contractId],
    queryFn: async () => {
      const res = await api.get(`/contracts/${contractId}/invoices`);
      return res.data;
    },
  });

  const { data: sepaPayments } = useQuery<SepaPaymentBatch[]>({
    queryKey: ["sepa-payments", contractId],
    queryFn: () => sepaPaymentsService.list(contractId),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post(`/contracts/${contractId}/invoices`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", contractId] });
      toast.success("Fattura caricata con successo");
      /* istanbul ignore next */
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: () => toast.error("Caricamento della fattura non riuscito"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      await api.delete(`/contracts/${contractId}/invoices/${invoiceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", contractId] });
      toast.success("Fattura eliminata");
    },
    onError: () => toast.error("Eliminazione della fattura non riuscita"),
  });

  const paymentDetailsMutation = useMutation({
    mutationFn: async (params: { invoiceId: number; supplierIban: string; supplierBic: string | null; paymentDueDate: string | null }) => {
      await api.patch(`/contracts/${contractId}/invoices/${params.invoiceId}/payment-details`, {
        supplierIban: params.supplierIban,
        supplierBic: params.supplierBic || null,
        paymentDueDate: params.paymentDueDate || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", contractId] });
      toast.success("Dati di pagamento aggiornati");
      setPaymentDetailsInvoice(null);
    },
    onError: () => toast.error("Aggiornamento dei dati di pagamento non riuscito"),
  });

  const generateSepaMutation = useMutation({
    mutationFn: async (invoiceIds: number[]) => {
      return sepaPaymentsService.create(contractId, { invoiceIds });
    },
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sepa-${contractId}.xml`;
      a.click();
      URL.revokeObjectURL(url);
      queryClient.invalidateQueries({ queryKey: ["invoices", contractId] });
      queryClient.invalidateQueries({ queryKey: ["sepa-payments", contractId] });
      setSelectedIds([]);
      toast.success("Pagamento SEPA generato con successo");
    },
    onError: () => toast.error("Generazione del pagamento SEPA non riuscita"),
  });

  const handleDownloadSepaPayment = async (batch: SepaPaymentBatch) => {
    try {
      const blob = await sepaPaymentsService.download(contractId, batch.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = batch.fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Download del pagamento SEPA non riuscito");
    }
  };

  const toggleSelected = (invoice: ElectronicInvoice) => {
    setSelectedIds((prev) =>
      prev.includes(invoice.id) ? prev.filter((id) => id !== invoice.id) : [...prev, invoice.id]
    );
  };

  const openPaymentDetailsDialog = (invoice: ElectronicInvoice) => {
    setPaymentDetailsInvoice(invoice);
    setIbanInput(invoice.supplierIban ?? "");
    setBicInput(invoice.supplierBic ?? "");
    setDueDateInput(invoice.paymentDueDate ? invoice.paymentDueDate.slice(0, 10) : "");
  };

  const handleSavePaymentDetails = () => {
    /* istanbul ignore next -- Save button only renders while paymentDetailsInvoice is set */
    if (!paymentDetailsInvoice) return;
    if (!ibanInput.trim()) {
      toast.error("L'IBAN è obbligatorio");
      return;
    }
    paymentDetailsMutation.mutate({
      invoiceId: paymentDetailsInvoice.id,
      supplierIban: ibanInput.trim(),
      supplierBic: bicInput.trim() || null,
      paymentDueDate: dueDateInput || null,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".xml")) {
      toast.error("Sono ammessi solo file XML");
      /* istanbul ignore next */
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    uploadMutation.mutate(file);
  };

  const handleDownload = async (invoice: ElectronicInvoice) => {
    try {
      const res = await api.get(`/contracts/${contractId}/invoices/${invoice.id}/download`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = invoice.fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Download della fattura non riuscito");
    }
  };

  const handleRowClick = async (invoice: ElectronicInvoice) => {
    try {
      const res = await api.get<ElectronicInvoice>(`/contracts/${contractId}/invoices/${invoice.id}`);
      setSelectedInvoice(res.data);
      setDetailDialogOpen(true);
    } catch {
      toast.error("Caricamento dei dettagli della fattura non riuscito");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-muted rounded animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload */}
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xml"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          variant="outline"
          onClick={/* istanbul ignore next */ () => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
        >
          {uploadMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {uploadMutation.isPending ? "Caricamento..." : "Carica fattura"}
        </Button>
        <span className="text-xs text-muted-foreground">Solo XML FatturaPA</span>
        {selectedIds.length > 0 && (
          <Button
            onClick={() => generateSepaMutation.mutate(selectedIds)}
            disabled={generateSepaMutation.isPending}
          >
            {generateSepaMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Landmark className="h-4 w-4 mr-2" />
            )}
            Genera pagamento SEPA ({selectedIds.length})
          </Button>
        )}
      </div>

      {/* Invoice list */}
      {!invoices || invoices.length === 0 ? (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-muted">
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Nessuna fattura
          </h2>
          <p className="text-sm text-muted-foreground">
            Carica un XML FatturaPA per allegarlo a questo contratto.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 w-10">
                  <span className="sr-only">Seleziona</span>
                </th>
                {["File", "Fornitore", "N. fattura", "Data", "Totale", "Pagamento", "Azioni"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="hover:bg-accent cursor-pointer"
                  onClick={() => handleRowClick(invoice)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(invoice.id)}
                      disabled={!invoice.supplierIban || invoice.sepaBatchId != null}
                      onCheckedChange={() => toggleSelected(invoice)}
                      aria-label={`Seleziona fattura ${invoice.fileName}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate max-w-[180px]" title={invoice.fileName}>
                        {invoice.fileName}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                      {formatBytes(invoice.fileSize)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                    {invoice.supplierName}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(invoice.invoiceDate).toLocaleDateString("it-IT", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-foreground whitespace-nowrap">
                    {formatAmount(invoice.totalAmount, invoice.currency)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    {(() => {
                      if (invoice.sepaBatchId != null) {
                        return <Badge variant="success">Pagata</Badge>;
                      }
                      if (invoice.supplierIban) {
                        return <Badge variant="secondary">Pronta per SEPA</Badge>;
                      }
                      return (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openPaymentDetailsDialog(invoice)}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1.5" />
                          IBAN mancante
                        </Button>
                      );
                    })()}
                  </td>
                  <td
                    className="px-4 py-3 whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(invoice)}
                        title="Scarica fattura"
                        aria-label="Scarica fattura"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {invoice.sepaBatchId == null && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPaymentDetailsDialog(invoice)}
                          title="Modifica dati di pagamento"
                          aria-label="Modifica dati di pagamento"
                        >
                          <Landmark className="h-4 w-4" />
                        </Button>
                      )}
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(invoice.id)}
                          disabled={deleteMutation.isPending}
                          title="Elimina fattura"
                          aria-label="Elimina fattura"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SEPA payments history */}
      {sepaPayments && sepaPayments.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Pagamenti SEPA generati
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted">
                <tr>
                  {["File", "Data esecuzione", "Importo", "N. fatture", "Generato il", "Azioni"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      {h === "Azioni" ? <span className="sr-only">{h}</span> : h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {sepaPayments.map((batch) => (
                  <tr key={batch.id} className="hover:bg-accent">
                    <td className="px-4 py-2 text-foreground whitespace-nowrap">{batch.fileName}</td>
                    <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                      {new Date(batch.executionDate).toLocaleDateString("it-IT")}
                    </td>
                    <td className="px-4 py-2 font-medium text-foreground whitespace-nowrap">
                      {formatAmount(batch.totalAmount, batch.currency)}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                      {batch.numberOfTransactions}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                      {new Date(batch.createdAt).toLocaleDateString("it-IT")}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadSepaPayment(batch)}
                        title="Scarica di nuovo"
                        aria-label="Scarica di nuovo"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dettaglio fattura</DialogTitle>
            <DialogDescription>
              {selectedInvoice?.fileName}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6">
              {/* Supplier info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Fornitore", value: selectedInvoice.supplierName },
                  { label: "Partita IVA", value: selectedInvoice.supplierVatNumber },
                  { label: "Tipo documento", value: selectedInvoice.documentType },
                  { label: "Numero fattura", value: selectedInvoice.invoiceNumber },
                  {
                    label: "Data fattura",
                    value: new Date(selectedInvoice.invoiceDate).toLocaleDateString("it-IT", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }),
                  },
                  {
                    label: "Importo totale",
                    value: formatAmount(selectedInvoice.totalAmount, selectedInvoice.currency),
                  },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      {label}
                    </p>
                    <p className="text-sm font-medium text-foreground mt-0.5">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Line items */}
              {selectedInvoice.lineItems && selectedInvoice.lineItems.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    Voci di dettaglio
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border text-sm">
                      <thead className="bg-muted">
                        <tr>
                          {["#", "Descrizione", "Qtà", "UM", "Prezzo unitario", "Totale", "IVA %"].map((h) => (
                            <th
                              key={h}
                              className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {selectedInvoice.lineItems.map((item) => (
                          <tr key={item.lineNumber} className="hover:bg-accent">
                            <td className="px-3 py-2 text-muted-foreground">
                              {item.lineNumber}
                            </td>
                            <td className="px-3 py-2 text-foreground max-w-[200px]">
                              {item.description}
                            </td>
                            <td className="px-3 py-2 text-foreground whitespace-nowrap">
                              {item.quantity}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                              {item.unitOfMeasure}
                            </td>
                            <td className="px-3 py-2 text-foreground whitespace-nowrap">
                              {item.unitPrice.toLocaleString("it-IT", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-3 py-2 font-medium text-foreground whitespace-nowrap">
                              {item.totalPrice.toLocaleString("it-IT", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                              {item.vatRate}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment details edit Dialog */}
      <Dialog
        open={paymentDetailsInvoice !== null}
        onOpenChange={
          /* istanbul ignore next -- Radix only invokes this to request a close (open=false) since there is no DialogTrigger */
          (open) => { if (!open) setPaymentDetailsInvoice(null); }
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dati di pagamento fornitore</DialogTitle>
            <DialogDescription>
              IBAN, BIC e scadenza da usare per generare un pagamento SEPA per questa fattura.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label htmlFor="supplier-iban" className="block text-sm font-medium mb-2">
                IBAN *
              </label>
              <Input
                id="supplier-iban"
                value={ibanInput}
                onChange={(e) => setIbanInput(e.target.value)}
                placeholder="IT60X0542811101000000123456"
              />
            </div>
            <div>
              <label htmlFor="supplier-bic" className="block text-sm font-medium mb-2">
                BIC / SWIFT
              </label>
              <Input
                id="supplier-bic"
                value={bicInput}
                onChange={(e) => setBicInput(e.target.value)}
                placeholder="UNCRITMMXXX"
              />
            </div>
            <div>
              <label htmlFor="payment-due-date" className="block text-sm font-medium mb-2">
                Scadenza pagamento
              </label>
              <Input
                id="payment-due-date"
                type="date"
                value={dueDateInput}
                onChange={(e) => setDueDateInput(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDetailsInvoice(null)}>
              Annulla
            </Button>
            <Button onClick={handleSavePaymentDetails} disabled={paymentDetailsMutation.isPending}>
              {paymentDetailsMutation.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
