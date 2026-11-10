/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import api from "@/lib/api";

export interface SepaPaymentBatch {
  id: string;
  contractId: string;
  executionDate: string;
  totalAmount: number;
  currency: string;
  numberOfTransactions: number;
  fileName: string;
  createdAt: string;
}

export interface CreateSepaPaymentPayload {
  invoiceIds: string[];
  executionDate?: string;
}

export const sepaPaymentsService = {
  list: async (contractId: string): Promise<SepaPaymentBatch[]> => {
    const res = await api.get<SepaPaymentBatch[]>(`/contracts/${contractId}/sepa-payments`);
    return res.data;
  },

  create: async (contractId: string, payload: CreateSepaPaymentPayload): Promise<Blob> => {
    const res = await api.post(`/contracts/${contractId}/sepa-payments`, payload, {
      responseType: "blob",
    });
    return res.data as Blob;
  },

  download: async (contractId: string, batchId: string): Promise<Blob> => {
    const res = await api.get(`/contracts/${contractId}/sepa-payments/${batchId}/download`, {
      responseType: "blob",
    });
    return res.data as Blob;
  },
};
