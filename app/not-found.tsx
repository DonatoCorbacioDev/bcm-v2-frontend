/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import type { Metadata } from "next";
import { ErrorScreen } from "@/components/errors/ErrorScreen";

export const metadata: Metadata = {
  title: "Pagina non trovata | BCM - Business Contracts Manager",
};

export default function NotFound() {
  return (
    <ErrorScreen
      title="Pagina non trovata"
      description="L'indirizzo non corrisponde a nessuna pagina di BCM: forse il link è vecchio o contiene un errore."
    />
  );
}
