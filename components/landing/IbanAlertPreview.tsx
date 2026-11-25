/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { HomeAttentionList } from "@/components/dashboard/HomeAttentionList";

/**
 * The real Home row for the demo's changed IBAN (Ferri & Associati, invoice
 * FA-2026-4T), drawn by the app's own component. `inert` keeps its link out
 * of the keyboard order: on the landing it is a picture.
 */
export function IbanAlertPreview() {
  return (
    <div inert className="select-none">
      <HomeAttentionList
        windowDays={30}
        items={[
          {
            type: "IBAN_CHANGED",
            contractId: "demo-118",
            contractNumber: "NRT-118",
            counterpartyName: "Ferri & Associati S.r.l.",
            projectName: null,
            dueDate: null,
            daysLeft: null,
            managerName: "Marco Bellini",
            renewalMonths: null,
            invoiceId: "demo-fa-4t",
            invoiceNumber: "FA-2026-4T",
            invoiceAmount: null,
          },
        ]}
      />
    </div>
  );
}
