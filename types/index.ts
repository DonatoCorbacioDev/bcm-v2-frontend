// Core entity types matching backend DTOs
export interface User {
  id: number;
  username: string;
  managerId: number;
  role: string;
  roleId: number;
  verified: boolean;
  createdAt: string;
  canApproveContracts?: boolean;
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
  managerName: string;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED" | "DRAFT";
  createdAt: string;
  manager?: Manager;
  area?: BusinessArea;
  daysUntilExpiry?: number;
  workflowStage?: "DRAFT" | "IN_REVIEW" | "APPROVED" | null;
}

export interface ContractWorkflowEvent {
  id: number;
  fromStage: "DRAFT" | "IN_REVIEW" | "APPROVED" | null;
  toStage: "DRAFT" | "IN_REVIEW" | "APPROVED";
  action: "SUBMIT" | "APPROVE" | "REJECT";
  actorUsername: string;
  comment: string | null;
  createdAt: string;
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
  customerName?: string;
}

export interface ContractHistory {
  id: number;
  contractId: number;
  modifiedById: number;
  modificationDate: string;
  previousStatus: string;
  newStatus: string;
}

export interface ContractImportRowError {
  rowNumber: number;
  message: string;
}

export interface ContractImportResult {
  totalRows: number;
  importedCount: number;
  errorCount: number;
  errors: ContractImportRowError[];
}

// Notifications
export interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type?: "INFO" | "WARNING" | "ERROR";
}

// Forecasting (FastAPI on port 8000)
export interface ForecastPoint {
  month: string;
  amount: number;
  lower?: number;
  upper?: number;
}

export interface ForecastResponse {
  historical: ForecastPoint[];
  forecast: ForecastPoint[];
  reliable?: boolean;
}

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface RiskScore {
  contractId: number;
  customerName: string;
  riskScore: number;
  level: RiskLevel;
  anomalies: string[];
  mlScore?: number;
  mlLevel?: RiskLevel;
}

export interface RiskFeedback {
  id: number;
  contractId: number;
  riskScore: number;
  riskLevel: RiskLevel;
  mlScore: number | null;
  mlLevel: RiskLevel | null;
  agree: boolean;
  createdAt: string;
}

export interface RiskFeedbackRequest {
  riskScore: number;
  level: RiskLevel;
  mlScore?: number;
  mlLevel?: RiskLevel;
  agree: boolean;
}

export interface ContractDocument {
  id: number;
  contractId: number;
  fileName: string;
  fileSize: number;
  contentType: string;
  uploadedAt: string;
  downloadUrl: string;
}

export interface DocumentAnalysis {
  documentId: number;
  rawText: string;
  detectedCustomerName: string | null;
  detectedContractNumber: string | null;
  detectedStartDate: string | null;
  detectedEndDate: string | null;
  detectedAmount: string | null;
}

// Contract Templates
export interface ContractTemplate {
  id: number;
  name: string;
  description: string | null;
  defaultStatus: "ACTIVE" | "EXPIRED" | "CANCELLED" | "DRAFT" | null;
  defaultDurationDays: number | null;
  businessAreaId: number | null;
  defaultManagerId: number | null;
  autoRenew: boolean;
  notificationDays: number | null;
  createdAt: string;
}

// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

// Dashboard Statistics
export interface ContractsByArea {
  areaName: string;
  count: number;
}

export interface ContractsTimeline {
  month: string;
  count: number;
}

export interface TopManager {
  managerId: number;
  managerName: string;
  contractsCount: number;
}