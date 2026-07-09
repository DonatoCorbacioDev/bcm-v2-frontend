import api from "@/lib/api";

export interface SepaPaymentBatch {
  id: number;
  contractId: number;
  executionDate: string;
  totalAmount: number;
  currency: string;
  numberOfTransactions: number;
  fileName: string;
  createdAt: string;
}

export interface CreateSepaPaymentPayload {
  invoiceIds: number[];
  executionDate?: string;
}

export const sepaPaymentsService = {
  list: async (contractId: number): Promise<SepaPaymentBatch[]> => {
    const res = await api.get<SepaPaymentBatch[]>(`/contracts/${contractId}/sepa-payments`);
    return res.data;
  },

  create: async (contractId: number, payload: CreateSepaPaymentPayload): Promise<Blob> => {
    const res = await api.post(`/contracts/${contractId}/sepa-payments`, payload, {
      responseType: "blob",
    });
    return res.data as Blob;
  },

  download: async (contractId: number, batchId: number): Promise<Blob> => {
    const res = await api.get(`/contracts/${contractId}/sepa-payments/${batchId}/download`, {
      responseType: "blob",
    });
    return res.data as Blob;
  },
};
