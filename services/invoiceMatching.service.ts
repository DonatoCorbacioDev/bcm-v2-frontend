/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import api from "@/lib/api";
import type { ElectronicInvoice } from "@/types";

export const invoiceMatchingService = {
  confirm: async (contractId: number, invoiceId: number, financialValueId?: number): Promise<ElectronicInvoice> => {
    const res = await api.post<ElectronicInvoice>(
      `/contracts/${contractId}/invoices/${invoiceId}/match/confirm`,
      financialValueId != null ? { financialValueId } : {}
    );
    return res.data;
  },

  reject: async (contractId: number, invoiceId: number): Promise<ElectronicInvoice> => {
    const res = await api.post<ElectronicInvoice>(`/contracts/${contractId}/invoices/${invoiceId}/match/reject`);
    return res.data;
  },

  recompute: async (contractId: number): Promise<ElectronicInvoice[]> => {
    const res = await api.post<ElectronicInvoice[]>(`/contracts/${contractId}/invoices/match/recompute`);
    return res.data;
  },
};
