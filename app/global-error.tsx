/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
"use client";

import { useEffect } from "react";
import { logError } from "@/lib/logError";

/**
 * Replaces the root layout when that fails, so none of the app's styles or
 * components are there: inline styles only (the CSP allows them), colors
 * from the OS scheme. Like every error page, it never shows the error.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    logError("Application error:", error);
  }, [error]);

  return (
    <html lang="it">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 16px",
          fontFamily: "system-ui, sans-serif",
          colorScheme: "light dark",
          textAlign: "center",
        }}
      >
        <title>Errore | BCM - Business Contracts Manager</title>
        <main style={{ maxWidth: 420 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>Qualcosa è andato storto</h1>
          <p style={{ opacity: 0.75 }}>
            BCM non è riuscito a caricarsi per un errore imprevisto. Riprova tra qualche istante.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{ marginTop: 24, padding: "8px 20px", fontSize: 16, borderRadius: 6, cursor: "pointer" }}
          >
            Riprova
          </button>
        </main>
      </body>
    </html>
  );
}
