import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { createWrapper } from '../mocks/wrapper';
import DashboardPage from '@/app/(dashboard)/dashboard/page';
import type { Contract } from '@/types';

// ─── Module mocks ────────────────────────────────────────────────────────────

jest.mock('@/hooks/useDashboardStats', () => ({
  useDashboardStats: jest.fn(),
}));

jest.mock('@/hooks/useExpiringContracts', () => ({
  useExpiringContracts: jest.fn(),
}));

// Backs every other dashboard query (risk scores, chart data, forecast,
// financial values) with an inert empty response by default, so the page
// can render fully without each sub-chart needing its own mock. Some
// modules `import api from` (default) and some `import { api } from`
// (named) — both must resolve to the same mock object, or configuring one
// (e.g. via the named import in this test) silently leaves the other
// returning undefined instead of a promise.
jest.mock('@/lib/api', () => {
  const shared = { get: jest.fn() };
  return { __esModule: true, api: shared, default: shared };
});

import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useExpiringContracts } from '@/hooks/useExpiringContracts';
import { api } from '@/lib/api';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const baseContract: Omit<Contract, 'id' | 'contractNumber' | 'customerName' | 'daysUntilExpiry'> = {
  wbsCode: 'WBS-001',
  projectName: 'Project',
  areaId: 1,
  managerId: 1,
  managerName: 'John Doe',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  status: 'ACTIVE',
  createdAt: '2024-01-01T00:00:00Z',
};

const criticalContract: Contract = {
  ...baseContract,
  id: 1,
  contractNumber: 'CNT-CRIT',
  customerName: 'Urgent Corp',
  daysUntilExpiry: 3,
};

const nonCriticalContract: Contract = {
  ...baseContract,
  id: 2,
  contractNumber: 'CNT-SOON',
  customerName: 'Later Corp',
  daysUntilExpiry: 20,
};

const highRiskScore = {
  contractId: 3,
  customerName: 'Risky SpA',
  riskScore: 0.9,
  level: 'HIGH' as const,
  anomalies: ['LATE_PAYMENT'],
};

// ─── Test setup ───────────────────────────────────────────────────────────────

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useDashboardStats as jest.Mock).mockReturnValue({
      data: { total: 10, active: 7, expiring: 2, expired: 1 },
      isLoading: false,
      isError: false,
    });
    (useExpiringContracts as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/risk-scores') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
  });

  it('shows a reassuring empty state when there is nothing urgent', async () => {
    render(<DashboardPage />, { wrapper: createWrapper() });

    expect(await screen.findByText(/nessuna azione urgente/i)).toBeInTheDocument();
  });

  it('lists critical renewals (≤7 days) under Azioni consigliate', async () => {
    (useExpiringContracts as jest.Mock).mockReturnValue({
      data: [criticalContract, nonCriticalContract],
      isLoading: false,
      isError: false,
    });

    render(<DashboardPage />, { wrapper: createWrapper() });

    const actionsCard = screen.getByText('Azioni consigliate').closest('div')!.parentElement!;
    expect(within(actionsCard).getByText(/urgent corp/i)).toBeInTheDocument();
    expect(within(actionsCard).queryByText(/later corp/i)).not.toBeInTheDocument();
  });

  it('keeps non-critical expiring contracts (>7 days) in the existing expiry banner', async () => {
    (useExpiringContracts as jest.Mock).mockReturnValue({
      data: [criticalContract, nonCriticalContract],
      isLoading: false,
      isError: false,
    });

    render(<DashboardPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/later corp/i)).toBeInTheDocument();
    expect(screen.getByText(/1 contratto in scadenza/i)).toBeInTheDocument();
  });

  it('lists high-risk contracts under Azioni consigliate', async () => {
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/risk-scores') return Promise.resolve({ data: [highRiskScore] });
      return Promise.resolve({ data: [] });
    });

    render(<DashboardPage />, { wrapper: createWrapper() });

    expect(await screen.findAllByText('Risky SpA')).not.toHaveLength(0);
    expect(screen.getByText(/alto rischio/i)).toBeInTheDocument();
  });

  it('links each critical renewal to its contract detail page', async () => {
    (useExpiringContracts as jest.Mock).mockReturnValue({
      data: [criticalContract],
      isLoading: false,
      isError: false,
    });

    render(<DashboardPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/urgent corp/i).closest('a')).toHaveAttribute('href', '/contracts/1');
  });

  it('caps critical renewals at 3 and notes how many more there are', async () => {
    const manyCritical = Array.from({ length: 5 }, (_, i) => ({
      ...criticalContract,
      id: i + 1,
      contractNumber: `CNT-CRIT-${i}`,
      customerName: `Urgent ${i}`,
    }));
    (useExpiringContracts as jest.Mock).mockReturnValue({
      data: manyCritical,
      isLoading: false,
      isError: false,
    });

    render(<DashboardPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/\+ altri 2 rinnovi critici/i)).toBeInTheDocument();
  });

  it('caps high-risk contracts at 3 and notes how many more there are', async () => {
    const manyHighRisk = Array.from({ length: 5 }, (_, i) => ({
      ...highRiskScore,
      contractId: i + 1,
      customerName: `Risky ${i}`,
    }));
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/risk-scores') return Promise.resolve({ data: manyHighRisk });
      return Promise.resolve({ data: [] });
    });

    render(<DashboardPage />, { wrapper: createWrapper() });

    expect(await screen.findByText(/\+ altri 2 contratti ad alto rischio/i)).toBeInTheDocument();
  });

  it('shows a note when the risk analysis is unavailable', async () => {
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/risk-scores') return Promise.reject(new Error('unavailable'));
      return Promise.resolve({ data: [] });
    });

    render(<DashboardPage />, { wrapper: createWrapper() });

    expect(await screen.findByText(/analisi del rischio non disponibile al momento/i)).toBeInTheDocument();
  });
});
