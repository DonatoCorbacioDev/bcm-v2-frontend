"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, Download, Trash2, FileText, Loader2, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import type { Contract, ContractDocument, DocumentAnalysis } from "@/types";

interface DocumentsTabProps {
  readonly contractId: number;
  readonly isAdmin: boolean;
  readonly onApply: (detected: Partial<Contract>) => void;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsTab({ contractId, isAdmin, onApply }: DocumentsTabProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analysisMap, setAnalysisMap] = useState<Record<number, DocumentAnalysis>>({});
  const [expandedDoc, setExpandedDoc] = useState<number | null>(null);

  const { data: documents, isLoading } = useQuery<ContractDocument[]>({
    queryKey: ["documents", contractId],
    queryFn: async () => {
      const res = await api.get(`/contracts/${contractId}/documents`);
      return res.data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post(`/contracts/${contractId}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", contractId] });
      toast.success("Document uploaded successfully");
      /* istanbul ignore next */
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: () => toast.error("Failed to upload document"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (documentId: number) => {
      await api.delete(`/contracts/${contractId}/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", contractId] });
      toast.success("Document deleted");
    },
    onError: () => toast.error("Failed to delete document"),
  });

  const analyzeMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const res = await api.post<DocumentAnalysis>(
        `/contracts/${contractId}/documents/${documentId}/extract`
      );
      return { documentId, analysis: res.data };
    },
    onSuccess: ({ documentId, analysis }) => {
      setAnalysisMap((prev) => ({ ...prev, [documentId]: analysis }));
      setExpandedDoc(documentId);
      toast.success("Analysis completed");
    },
    onError: () => toast.error("Analysis failed"),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }
    uploadMutation.mutate(file);
  };

  const handleDownload = async (doc: ContractDocument) => {
    try {
      const res = await api.get(`/contracts/${contractId}/documents/${doc.id}/download`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download document");
    }
  };

  const handleApply = (analysis: DocumentAnalysis) => {
    const detected: Partial<Contract> = {};
    if (analysis.detectedCustomerName) detected.customerName = analysis.detectedCustomerName;
    if (analysis.detectedContractNumber) detected.contractNumber = analysis.detectedContractNumber;
    if (analysis.detectedStartDate) detected.startDate = analysis.detectedStartDate;
    if (analysis.detectedEndDate) detected.endDate = analysis.detectedEndDate;
    onApply(detected);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
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
          accept="application/pdf"
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
          {uploadMutation.isPending ? "Uploading..." : "Upload PDF"}
        </Button>
        <span className="text-xs text-gray-500">PDF only · max 10 MB</span>
      </div>

      {/* Document list */}
      {!documents || documents.length === 0 ? (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-700">
              <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Documents Yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload a PDF to attach it to this contract.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const analysis = analysisMap[doc.id];
            const isExpanded = expandedDoc === doc.id;
            const isAnalyzing = analyzeMutation.isPending && analyzeMutation.variables === doc.id;

            return (
              <div
                key={doc.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                {/* Document row */}
                <div className="flex items-center justify-between gap-4 p-4 bg-white dark:bg-gray-800">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {doc.fileName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatBytes(doc.fileSize)} ·{" "}
                        {new Date(doc.uploadedAt).toLocaleDateString("en-US", {
                          year: "numeric", month: "short", day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => analyzeMutation.mutate(doc.id)}
                      disabled={isAnalyzing}
                      title="Analizza con AI"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-blue-500" />
                      )}
                    </Button>

                    {analysis && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}
                        title="Toggle analysis"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    )}

                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(doc.id)}
                        disabled={deleteMutation.isPending}
                        title="Delete"
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Analysis panel */}
                {analysis && isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-blue-50 dark:bg-blue-900/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        AI Extraction Results
                      </h4>
                      <Button size="sm" onClick={() => handleApply(analysis)}>
                        Apply to Contract
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { label: "Customer Name", value: analysis.detectedCustomerName },
                        { label: "Contract Number", value: analysis.detectedContractNumber },
                        { label: "Start Date", value: analysis.detectedStartDate },
                        { label: "End Date", value: analysis.detectedEndDate },
                        { label: "Amount", value: analysis.detectedAmount },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{label}</p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {value ?? <span className="text-gray-400 italic">Not detected</span>}
                          </p>
                        </div>
                      ))}
                    </div>

                    {analysis.rawText && (
                      <details className="mt-2">
                        <summary className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                          Show extracted text
                        </summary>
                        <pre className="mt-2 text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-white dark:bg-gray-800 rounded p-3 max-h-40 overflow-y-auto">
                          {analysis.rawText}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
