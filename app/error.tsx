/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
"use client";

import { useEffect } from "react";
import { ErrorScreen } from "@/components/errors/ErrorScreen";
import { Button } from "@/components/ui/button";
import { logError } from "@/lib/logError";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    logError("Page error:", error);
  }, [error]);

  return (
    <ErrorScreen
      title="Qualcosa è andato storto"
      description="La pagina non è stata caricata per un errore imprevisto. Riprova tra qualche istante."
      action={<Button onClick={() => retry()}>Riprova</Button>}
    />
  );
}
