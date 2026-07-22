"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Upload, Download, Trash2, FileText, Loader2, FileSearch, ChevronDown, ChevronUp,
  ShieldAlert, CheckCircle2, FilePlus2, History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import DocumentVersionsDialog from "@/components/contracts/DocumentVersionsDialog";
import type { Contract, ContractDocument, DocumentAnalysis, ClauseRiskAnalysis } from "@/types";

const RISK_LEVEL_CONFIG = {
  HIGH: { badge: "destructive" as const, label: "Alto" },
  MEDIUM: { badge: "warning" as const, label: "Medio" },
  LOW: { badge: "success" as const, label: "Basso" },
};

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
  const versionInputRef = useRef<HTMLInputElement>(null);
  const [analysisMap, setAnalysisMap] = useState<Record<number, DocumentAnalysis>>({});
  const [expandedDoc, setExpandedDoc] = useState<number | null>(null);
  const [clauseRiskMap, setClauseRiskMap] = useState<Record<number, ClauseRiskAnalysis>>({});
  const [expandedRiskDoc, setExpandedRiskDoc] = useState<number | null>(null);
  const [versionUploadTarget, setVersionUploadTarget] = useState<ContractDocument | null>(null);
  const [historyDoc, setHistoryDoc] = useState<ContractDocument | null>(null);

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
      toast.success("Documento caricato con successo");
      /* istanbul ignore next */
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: () => toast.error("Caricamento del documento non riuscito"),
  });

  const uploadVersionMutation = useMutation({
    mutationFn: async ({ documentId, file }: { documentId: number; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post(`/contracts/${contractId}/documents/${documentId}/versions`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", contractId] });
      queryClient.invalidateQueries({ queryKey: ["document-versions", contractId] });
      toast.success("Nuova versione caricata con successo");
      /* istanbul ignore next */
      if (versionInputRef.current) versionInputRef.current.value = "";
    },
    onError: () => toast.error("Caricamento della nuova versione non riuscito"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (documentId: number) => {
      await api.delete(`/contracts/${contractId}/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", contractId] });
      toast.success("Documento eliminato");
    },
    onError: () => toast.error("Eliminazione del documento non riuscita"),
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
      toast.success("Estrazione completata");
    },
    onError: () => toast.error("Estrazione non riuscita"),
  });

  const clauseRiskMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const res = await api.post<ClauseRiskAnalysis>(
        `/contracts/${contractId}/documents/${documentId}/analyze-clause-risk`
      );
      return { documentId, analysis: res.data };
    },
    onSuccess: ({ documentId, analysis }) => {
      setClauseRiskMap((prev) => ({ ...prev, [documentId]: analysis }));
      setExpandedRiskDoc(documentId);
      if (analysis.error) {
        toast.error("Analisi delle clausole non disponibile");
      } else {
        toast.success("Analisi clausole completata");
      }
    },
    onError: () => toast.error("Analisi delle clausole non riuscita"),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Sono ammessi solo file PDF");
      return;
    }
    uploadMutation.mutate(file);
  };

  const handleVersionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !versionUploadTarget) return;
    if (file.type !== "application/pdf") {
      toast.error("Sono ammessi solo file PDF");
      return;
    }
    uploadVersionMutation.mutate({ documentId: versionUploadTarget.id, file });
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
      toast.error("Download del documento non riuscito");
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
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
        <input
          ref={versionInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          data-testid="version-upload-input"
          onChange={handleVersionFileChange}
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
          {uploadMutation.isPending ? "Caricamento..." : "Carica PDF"}
        </Button>
        <span className="text-xs text-muted-foreground">Solo PDF · max 10 MB</span>
      </div>

      {/* Document list */}
      {!documents || documents.length === 0 ? (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-muted">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Nessun documento
          </h2>
          <p className="text-sm text-muted-foreground">
            Carica un PDF per allegarlo a questo contratto.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const analysis = analysisMap[doc.id];
            const isExpanded = expandedDoc === doc.id;
            const isAnalyzing = analyzeMutation.isPending && analyzeMutation.variables === doc.id;
            const riskAnalysis = clauseRiskMap[doc.id];
            const isRiskExpanded = expandedRiskDoc === doc.id;
            const isAnalyzingRisk = clauseRiskMutation.isPending && clauseRiskMutation.variables === doc.id;

            return (
              <div
                key={doc.id}
                className="border border-border rounded-lg overflow-hidden"
              >
                {/* Document row */}
                <div className="flex items-center justify-between gap-4 p-4 bg-card">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate flex items-center gap-2">
                        {doc.fileName}
                        <Badge variant="outline" className="text-[10px] font-normal">
                          v{doc.versionNumber ?? 1}
                        </Badge>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(doc.fileSize)} ·{" "}
                        {new Date(doc.uploadedAt).toLocaleDateString("it-IT", {
                          year: "numeric", month: "short", day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {(doc.versionCount ?? 1) > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setHistoryDoc(doc)}
                        title="Cronologia versioni"
                        aria-label="Cronologia versioni"
                      >
                        <History className="h-4 w-4" />
                        <span className="ml-1 text-xs">{doc.versionCount}</span>
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={/* istanbul ignore next */ () => {
                        setVersionUploadTarget(doc);
                        versionInputRef.current?.click();
                      }}
                      disabled={uploadVersionMutation.isPending}
                      title="Carica nuova versione"
                      aria-label="Carica nuova versione"
                    >
                      {uploadVersionMutation.isPending && uploadVersionMutation.variables?.documentId === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FilePlus2 className="h-4 w-4" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      title="Scarica documento"
                      aria-label="Scarica documento"
                    >
                      <Download className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => analyzeMutation.mutate(doc.id)}
                      disabled={isAnalyzing}
                      title="Estrai campi"
                      aria-label="Estrai campi dal documento"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileSearch className="h-4 w-4 text-primary" />
                      )}
                    </Button>

                    {analysis && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}
                        title={isExpanded ? "Comprimi analisi" : "Espandi analisi"}
                        aria-label={isExpanded ? "Comprimi analisi" : "Espandi analisi"}
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clauseRiskMutation.mutate(doc.id)}
                      disabled={isAnalyzingRisk}
                      title="Rileva clausole a rischio"
                      aria-label="Rileva clausole a rischio nel documento"
                    >
                      {isAnalyzingRisk ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldAlert className="h-4 w-4 text-amber-500" />
                      )}
                    </Button>

                    {riskAnalysis && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedRiskDoc(isRiskExpanded ? null : doc.id)}
                        title={isRiskExpanded ? "Comprimi clausole a rischio" : "Espandi clausole a rischio"}
                        aria-label={isRiskExpanded ? "Comprimi clausole a rischio" : "Espandi clausole a rischio"}
                        aria-expanded={isRiskExpanded}
                      >
                        {isRiskExpanded ? (
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
                        title="Elimina documento"
                        aria-label="Elimina documento"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Analysis panel */}
                {analysis && isExpanded && (
                  <div className="border-t border-border p-4 bg-primary/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-primary flex items-center gap-2">
                        <FileSearch className="h-4 w-4" />
                        Campi estratti
                      </h2>
                      <Button size="sm" onClick={() => handleApply(analysis)}>
                        Applica al contratto
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { label: "Nome cliente", value: analysis.detectedCustomerName },
                        { label: "Numero contratto", value: analysis.detectedContractNumber },
                        { label: "Data inizio", value: analysis.detectedStartDate },
                        { label: "Data fine", value: analysis.detectedEndDate },
                        { label: "Importo", value: analysis.detectedAmount },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-xs text-primary font-medium">{label}</p>
                          <p className="text-sm text-foreground">
                            {value ?? <span className="text-muted-foreground italic">Non rilevato</span>}
                          </p>
                        </div>
                      ))}
                    </div>

                    {analysis.rawText && (
                      <details className="mt-2">
                        <summary className="text-xs text-primary cursor-pointer hover:underline">
                          Mostra testo estratto
                        </summary>
                        <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap bg-card rounded p-3 max-h-40 overflow-y-auto">
                          {analysis.rawText}
                        </pre>
                      </details>
                    )}
                  </div>
                )}

                {/* Clause risk panel */}
                {riskAnalysis && isRiskExpanded && (
                  <div className="border-t border-border p-4 bg-amber-500/10 space-y-3">
                    <div>
                      <h2 className="text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4" />
                        Clausole a rischio
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        Analisi generata da un modello linguistico locale — non è un parere
                        legale, verificare sempre con un professionista.
                      </p>
                    </div>

                    {riskAnalysis.error ? (
                      <p className="text-sm text-muted-foreground">{riskAnalysis.error}</p>
                    ) : riskAnalysis.clauses.length === 0 ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Nessuna clausola a rischio rilevata
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {riskAnalysis.clauses.map((clause, idx) => {
                          const cfg = RISK_LEVEL_CONFIG[clause.riskLevel] ?? RISK_LEVEL_CONFIG.LOW;
                          return (
                            <div
                              key={`${clause.category}-${idx}`}
                              className="rounded-lg border border-border p-3 bg-card"
                            >
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="text-sm font-medium text-foreground">
                                  {clause.category}
                                </span>
                                <Badge variant={cfg.badge}>{cfg.label}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground italic mb-1.5">
                                &ldquo;{clause.excerpt}&rdquo;
                              </p>
                              <p className="text-sm text-foreground">{clause.reasoning}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <DocumentVersionsDialog
        contractId={contractId}
        documentId={historyDoc?.id ?? null}
        fileName={historyDoc?.fileName ?? ""}
        open={historyDoc !== null}
        onOpenChange={(next) => { if (!next) setHistoryDoc(null); }}
        onDownload={handleDownload}
      />
    </div>
  );
}
