import api from "@/lib/api";
import type { Contract, ContractsByArea, ContractsTimeline, TopManager } from "@/types";

export type ContractStatus = "ACTIVE" | "EXPIRED" | "CANCELLED";

export type ContractUpsertPayload = {
  customerName: string;
  contractNumber: string;
  wbsCode: string;
  projectName: string;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  areaId: number;
  managerId: number;
};

// Pagination types
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ContractSearchParams {
  page?: number;
  size?: number;
  query?: string;
  status?: string;
}

export const contractsService = {
  list: async (): Promise<Contract[]> => {
    const res = await api.get<Contract[]>("/contracts");
    return res.data;
  },

  create: async (payload: ContractUpsertPayload): Promise<Contract> => {
    const res = await api.post<Contract>("/contracts", payload);
    return res.data;
  },

  update: async (id: number, payload: ContractUpsertPayload): Promise<Contract> => {
    const res = await api.put<Contract>(`/contracts/${id}`, payload);
    return res.data;
  },

  getById: async (id: number): Promise<Contract> => {
    const res = await api.get<Contract>(`/contracts/${id}`);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/contracts/${id}`);
  },

  // Paginated search
  searchPaged: async (params: ContractSearchParams): Promise<PageResponse<Contract>> => {
    const { page = 0, size = 10, query, status } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    if (query) queryParams.append("q", query);
    if (status && status !== "ALL") queryParams.append("status", status);

    const res = await api.get<PageResponse<Contract>>(`/contracts/search?${queryParams.toString()}`);
    return res.data;
  },

  // Export methods
  exportExcel: async (): Promise<Blob> => {
    const res = await api.get("/contracts/export/excel", {
      responseType: "blob",
    });
    return res.data;
  },

  exportPdf: async (): Promise<Blob> => {
    const res = await api.get("/contracts/export/pdf", {
      responseType: "blob",
    });
    return res.data;
  },

  // Dashboard Statistics
  async getContractsByArea(): Promise<ContractsByArea[]> {
    const response = await api.get<ContractsByArea[]>('/contracts/stats/by-area');
    return response.data;
  },

  async getContractsTimeline(): Promise<ContractsTimeline[]> {
    const response = await api.get<ContractsTimeline[]>('/contracts/stats/timeline');
    return response.data;
  },

  async getTopManagers(): Promise<TopManager[]> {
    const response = await api.get<TopManager[]>('/contracts/stats/top-managers');
    return response.data;
  },
};