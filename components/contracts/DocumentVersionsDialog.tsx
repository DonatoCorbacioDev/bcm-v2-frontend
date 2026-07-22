"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, GitCompareArrows, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import api from "@/lib/api";
import type { ContractDocument, DocumentDiff } from "@/types";

interface DocumentVersionsDialogProps {
  readonly contractId: number;
  readonly documentId: number | null;
  readonly fileName: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onDownload: (doc: ContractDocument) => void;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("it-IT", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function DocumentVersionsDialog({
  contractId, documentId, fileName, open, onOpenChange, onDownload,
}: DocumentVersionsDialogProps) {
  const [selected, setSelected] = useState<number[]>([]);

  const { data: versions, isLoading } = useQuery<ContractDocument[]>({
    queryKey: ["document-versions", contractId, documentId],
    queryFn: async () => {
      const res = await api.get(`/contracts/${contractId}/documents/${documentId}/versions`);
      return res.data;
    },
    enabled: open && documentId !== null,
  });

  const comparePair = useMemo(() => {
    if (selected.length !== 2 || !versions) return null;
    const [a, b] = selected
      .map((id) => versions.find((v) => v.id === id))
      .filter((v): v is ContractDocument => !!v)
      .sort((x, y) => (x.versionNumber ?? 0) - (y.versionNumber ?? 0));
    if (!a || !b) return null;
    return { fromId: a.id, toId: b.id };
  }, [selected, versions]);

  const { data: diff, isFetching: isDiffing } = useQuery<DocumentDiff>({
    queryKey: ["document-diff", contractId, comparePair?.fromId, comparePair?.toId],
    queryFn: async () => {
      const res = await api.get(
        `/contracts/${contractId}/documents/${comparePair!.fromId}/diff/${comparePair!.toId}`
      );
      return res.data;
    },
    enabled: !!comparePair,
  });

  const toggleSelected = (id: number) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((v) => v !== id);
      if (prev.length < 2) return [...prev, id];
      return [prev[1], id];
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cronologia versioni</DialogTitle>
          <DialogDescription>
            {fileName} · seleziona due versioni per confrontarle (redlining)
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2">
            {versions?.map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                <Checkbox
                  checked={selected.includes(v.id)}
                  onCheckedChange={() => toggleSelected(v.id)}
                  aria-label={`Seleziona versione ${v.versionNumber ?? 1} per il confronto`}
                />
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    v{v.versionNumber ?? 1} · {v.fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(v.uploadedAt)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDownload(v)}
                  title="Scarica versione"
                  aria-label="Scarica versione"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {selected.length === 2 && (
          <div className="border-t border-border pt-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <GitCompareArrows className="h-4 w-4" />
              Confronto tra versioni
            </h2>

            {isDiffing ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card font-mono text-xs overflow-hidden">
                {diff?.lines.map((line, idx) => {
                  const key = `${line.tag}-${idx}`;
                  if (line.tag === "EQUAL") {
                    return (
                      <div key={key} className="px-3 py-1 text-muted-foreground whitespace-pre-wrap">
                        {line.oldText}
                      </div>
                    );
                  }
                  return (
                    <div key={key}>
                      {line.oldText !== null && (
                        <div className="px-3 py-1 whitespace-pre-wrap bg-[var(--status-red-bg)] text-[var(--status-red-fg)]">
                          − {line.oldText}
                        </div>
                      )}
                      {line.newText !== null && (
                        <div className="px-3 py-1 whitespace-pre-wrap bg-[var(--status-green-bg)] text-[var(--status-green-fg)]">
                          + {line.newText}
                        </div>
                      )}
                    </div>
                  );
                })}
                {diff?.lines.length === 0 && (
                  <p className="px-3 py-4 text-muted-foreground text-center">
                    Nessuna differenza rilevata tra le due versioni
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
