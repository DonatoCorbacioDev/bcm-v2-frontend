"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, Download, Trash2, Receipt, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import api from "@/lib/api";

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
  return `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export default function InvoicesTab({ contractId, isAdmin }: InvoicesTabProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<ElectronicInvoice | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const { data: invoices, isLoading } = useQuery<ElectronicInvoice[]>({
    queryKey: ["invoices", contractId],
    queryFn: async () => {
      const res = await api.get(`/contracts/${contractId}/invoices`);
      return res.data;
    },
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
      toast.success("Invoice uploaded successfully");
      /* istanbul ignore next */
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: () => toast.error("Failed to upload invoice"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      await api.delete(`/contracts/${contractId}/invoices/${invoiceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", contractId] });
      toast.success("Invoice deleted");
    },
    onError: () => toast.error("Failed to delete invoice"),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".xml")) {
      toast.error("Only XML files are allowed");
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
      toast.error("Failed to download invoice");
    }
  };

  const handleRowClick = async (invoice: ElectronicInvoice) => {
    try {
      const res = await api.get<ElectronicInvoice>(`/contracts/${contractId}/invoices/${invoice.id}`);
      setSelectedInvoice(res.data);
      setDetailDialogOpen(true);
    } catch {
      toast.error("Failed to load invoice details");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
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
          {uploadMutation.isPending ? "Uploading..." : "Upload Invoice"}
        </Button>
        <span className="text-xs text-gray-500">XML FatturaPA only</span>
      </div>

      {/* Invoice list */}
      {!invoices || invoices.length === 0 ? (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-700">
              <Receipt className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Invoices Yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload a FatturaPA XML to attach it to this contract.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {["File", "Supplier", "Invoice #", "Date", "Total", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleRowClick(invoice)}
                >
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate max-w-[180px]" title={invoice.fileName}>
                        {invoice.fileName}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                      {formatBytes(invoice.fileSize)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                    {invoice.supplierName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {new Date(invoice.invoiceDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">
                    {formatAmount(invoice.totalAmount, invoice.currency)}
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
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(invoice.id)}
                          disabled={deleteMutation.isPending}
                          title="Delete"
                          className="text-red-500 hover:text-red-600"
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

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Detail</DialogTitle>
            <DialogDescription>
              {selectedInvoice?.fileName}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6">
              {/* Supplier info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Supplier", value: selectedInvoice.supplierName },
                  { label: "VAT Number", value: selectedInvoice.supplierVatNumber },
                  { label: "Document Type", value: selectedInvoice.documentType },
                  { label: "Invoice Number", value: selectedInvoice.invoiceNumber },
                  {
                    label: "Invoice Date",
                    value: new Date(selectedInvoice.invoiceDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }),
                  },
                  {
                    label: "Total Amount",
                    value: formatAmount(selectedInvoice.totalAmount, selectedInvoice.currency),
                  },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                      {label}
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Line items */}
              {selectedInvoice.lineItems && selectedInvoice.lineItems.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Line Items
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          {["#", "Description", "Qty", "UoM", "Unit Price", "Total", "VAT %"].map((h) => (
                            <th
                              key={h}
                              className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {selectedInvoice.lineItems.map((item) => (
                          <tr key={item.lineNumber} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                              {item.lineNumber}
                            </td>
                            <td className="px-3 py-2 text-gray-900 dark:text-white max-w-[200px]">
                              {item.description}
                            </td>
                            <td className="px-3 py-2 text-gray-900 dark:text-white whitespace-nowrap">
                              {item.quantity}
                            </td>
                            <td className="px-3 py-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              {item.unitOfMeasure}
                            </td>
                            <td className="px-3 py-2 text-gray-900 dark:text-white whitespace-nowrap">
                              {item.unitPrice.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-3 py-2 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                              {item.totalPrice.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-3 py-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">
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
    </div>
  );
}
