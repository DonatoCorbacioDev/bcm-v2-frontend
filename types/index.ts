// USER & AUTH
export interface User {
  userId: number;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: Role;
  emailVerified: boolean;
  manager?: Manager;
}

export interface Role {
  roleId: number;
  roleName: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

// MANAGER
export interface Manager {
  managerId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  department?: string;
}

// CONTRACT
export interface Contract {
  contractId: number;
  customerName: string;
  contractNumber: string;
  wbsCode?: string;
  projectName?: string;
  businessArea?: BusinessArea;
  startDate: string;
  endDate?: string;
  status: ContractStatus;
  managers?: Manager[];
}

export enum ContractStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export interface BusinessArea {
  businessAreaId: number;
  name: string;
  description?: string;
}

export interface FinancialType {
  financialTypeId: number;
  name: string;
  description?: string;
}

export interface FinancialValue {
  financialValueId: number;
  monthValue: number;
  yearValue: number;
  financialAmount: number;
  financialType?: FinancialType;
}

// PAGINATION
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ApiError {
  message: string;
  status?: number;
}
