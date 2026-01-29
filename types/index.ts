// Core entity types matching backend DTOs
export interface User {
  id: number;
  username: string;
  managerId: number;
  role: string;
  verified: boolean;
}

export interface Manager {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  department: string;
}

export interface Role {
  id: number;
  role: string;
}

export interface BusinessArea {
  id: number;
  name: string;
  description: string;
}

export interface FinancialType {
  id: number;
  name: string;
  description: string;
}

export interface Contract {
  id: number;
  customerName: string;
  contractNumber: string;
  wbsCode: string;
  projectName: string;
  areaId: number;
  managerId: number;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  createdAt: string;
  manager?: Manager;
  area?: BusinessArea;
}

export interface FinancialValue {
  id: number;
  month: number;
  year: number;
  financialAmount: number;
  financialTypeId: number;
  businessAreaId: number;
  contractId: number;
  typeName?: string;
  areaName?: string;
}

export interface ContractHistory {
  id: number;
  contractId: number;
  modifiedById: number;
  modifiedAt: string;
  previousStatus: string;
  newStatus: string;
}

// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}