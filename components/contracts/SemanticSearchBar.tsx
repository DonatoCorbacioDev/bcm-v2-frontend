"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Search, Loader2, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { semanticSearchService } from "@/services/semanticSearch.service";

/** Searches contract documents by meaning, not exact keywords — only
 * documents someone has run "Analizza con AI" on are indexed (see
 * DocumentsTab). Results are similarity, not exact matches: shown as a
 * percentage, not a guarantee. */
export function SemanticSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const searchMutation = useMutation({
    mutationFn: semanticSearchService.search,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setExpanded(true);
    searchMutation.mutate(query);
  };

  const results = searchMutation.data ?? [];

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca nei documenti per significato, es. «penale per ritardo nella consegna»"
              className="pl-9"
              aria-label="Ricerca semantica nei documenti contrattuali"
            />
          </div>
          <Button type="submit" disabled={searchMutation.isPending || !query.trim()}>
            {searchMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              "Cerca"
            )}
          </Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">
          Risultati per similarità semantica, non corrispondenza esatta — solo documenti già analizzati con AI.
        </p>

        {expanded && !searchMutation.isPending && (
          <div className="mt-4 space-y-2">
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nessun documento indicizzato corrisponde alla ricerca.
              </p>
            ) : (
              results.map((r) => (
                <button
                  key={r.documentId}
                  type="button"
                  onClick={() => router.push(`/contracts/${r.contractId}`)}
                  className="w-full flex items-center gap-3 rounded-lg border border-border p-3 text-left hover:bg-muted transition-colors"
                >
                  <FileText className="h-4 w-4 flex-none text-muted-foreground" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {r.contractNumber} — {r.customerName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{r.fileName}</p>
                  </div>
                  <span className="flex-none text-xs font-mono text-muted-foreground tabular-nums">
                    {Math.round(r.score * 100)}%
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
