import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createWrapper } from '../mocks/wrapper';

// ─── Module mocks ────────────────────────────────────────────────────────────

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/hooks/useContract', () => ({
  useContract: jest.fn(),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/services/contracts.service', () => ({
  contractsService: { delete: jest.fn() },
}));

jest.mock('@/services/contractWorkflow.service', () => ({
  contractWorkflowService: {
    submit: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
    getEvents: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('@/hooks/queries/contracts.queryKeys', () => ({
  contractsQueryKeys: { detail: (id: number) => ['contracts', id], all: ['contracts'] },
}));

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({ data: [] }),
    post: jest.fn(), put: jest.fn(), delete: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    defaults: { headers: { common: {} } },
  },
}));

jest.mock('@/components/contracts/DocumentsTab', () => ({
  __esModule: true,
  default: () => <div>Documents Tab Stub</div>,
}));

jest.mock('@/components/contracts/InvoicesTab', () => ({
  __esModule: true,
  default: () => <div>Invoices Tab Stub</div>,
}));

jest.mock('@/components/contracts/ContractForm', () => ({
  __esModule: true,
  default: () => <div>Contract Form Stub</div>,
}));

// ─── Imports after mocks ─────────────────────────────────────────────────────

import { toast } from 'sonner';
import { useContract } from '@/hooks/useContract';
import { useAuthStore } from '@/store/authStore';
import { contractWorkflowService } from '@/services/contractWorkflow.service';
import api from '@/lib/api';
import ContractDetailPage from '@/app/(dashboard)/contracts/[id]/page';

const baseContract = {
  id: 1,
  customerName: 'Acme',
  contractNumber: 'CNT-1',
  wbsCode: 'WBS-1',
  projectName: 'Progetto',
  areaId: 1,
  managerId: 5,
  managerName: 'Mario Rossi',
  startDate: '2025-01-01',
  endDate: '2026-01-01',
  status: 'DRAFT',
  createdAt: '2025-01-01',
  workflowStage: null as string | null,
};

const mockAuthAs = (overrides: Partial<{ role: string; managerId: number; canApproveContracts: boolean }>) => {
  (useAuthStore as unknown as jest.Mock).mockReturnValue({
    user: { id: 1, username: 'user', role: 'MANAGER', managerId: 5, canApproveContracts: false, ...overrides },
  });
};

const mockContract = (overrides: Partial<typeof baseContract>) => {
  (useContract as jest.Mock).mockReturnValue({
    data: { ...baseContract, ...overrides },
    isLoading: false,
    isError: false,
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  (contractWorkflowService.getEvents as jest.Mock).mockResolvedValue([]);
});

describe('ContractDetailPage — approval workflow', () => {
  it('shows "Invia in revisione" for the contract\'s own manager when DRAFT', () => {
    mockContract({ workflowStage: 'DRAFT' });
    mockAuthAs({ role: 'MANAGER', managerId: 5 });

    render(<ContractDetailPage />, { wrapper: createWrapper() });

    expect(screen.getByRole('button', { name: /invia in revisione/i })).toBeInTheDocument();
  });

  it('does not show "Invia in revisione" for a manager who does not own the contract', () => {
    mockContract({ workflowStage: 'DRAFT' });
    mockAuthAs({ role: 'MANAGER', managerId: 999 });

    render(<ContractDetailPage />, { wrapper: createWrapper() });

    expect(screen.queryByRole('button', { name: /invia in revisione/i })).not.toBeInTheDocument();
  });

  it('submits for review and shows a success toast', async () => {
    mockContract({ workflowStage: 'DRAFT' });
    mockAuthAs({ role: 'MANAGER', managerId: 5 });
    (contractWorkflowService.submit as jest.Mock).mockResolvedValue(undefined);

    render(<ContractDetailPage />, { wrapper: createWrapper() });
    await userEvent.click(screen.getByRole('button', { name: /invia in revisione/i }));

    await waitFor(() => expect(contractWorkflowService.submit).toHaveBeenCalledWith(1));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Contratto inviato in revisione'));
  });

  it('shows Approva/Rifiuta for an approver when IN_REVIEW', () => {
    mockContract({ workflowStage: 'IN_REVIEW' });
    mockAuthAs({ role: 'MANAGER', managerId: 999, canApproveContracts: true });

    render(<ContractDetailPage />, { wrapper: createWrapper() });

    expect(screen.getByRole('button', { name: /approva/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rifiuta/i })).toBeInTheDocument();
  });

  it('does not show Approva/Rifiuta for a manager without the approval permission', () => {
    mockContract({ workflowStage: 'IN_REVIEW' });
    mockAuthAs({ role: 'MANAGER', managerId: 5, canApproveContracts: false });

    render(<ContractDetailPage />, { wrapper: createWrapper() });

    expect(screen.queryByRole('button', { name: /approva/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /rifiuta/i })).not.toBeInTheDocument();
  });

  it('approves the contract and shows a success toast', async () => {
    mockContract({ workflowStage: 'IN_REVIEW' });
    mockAuthAs({ role: 'ADMIN' });
    (contractWorkflowService.approve as jest.Mock).mockResolvedValue(undefined);

    render(<ContractDetailPage />, { wrapper: createWrapper() });
    await userEvent.click(screen.getByRole('button', { name: /approva/i }));

    await waitFor(() => expect(contractWorkflowService.approve).toHaveBeenCalledWith(1));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Contratto approvato e attivato'));
  });

  it('rejects the contract with a comment via the reject dialog', async () => {
    mockContract({ workflowStage: 'IN_REVIEW' });
    mockAuthAs({ role: 'ADMIN' });
    (contractWorkflowService.reject as jest.Mock).mockResolvedValue(undefined);

    render(<ContractDetailPage />, { wrapper: createWrapper() });
    await userEvent.click(screen.getByRole('button', { name: /rifiuta/i }));

    const textarea = await screen.findByLabelText(/motivo del rifiuto/i);
    await userEvent.type(textarea, "Manca l'allegato");

    const rejectButtons = screen.getAllByRole('button', { name: /rifiuta/i });
    await userEvent.click(rejectButtons[rejectButtons.length - 1]);

    await waitFor(() => expect(contractWorkflowService.reject).toHaveBeenCalledWith(1, "Manca l'allegato"));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Contratto rifiutato e rimandato in bozza'));
  });

  it('disables the reject confirmation button until a comment is entered', async () => {
    mockContract({ workflowStage: 'IN_REVIEW' });
    mockAuthAs({ role: 'ADMIN' });

    render(<ContractDetailPage />, { wrapper: createWrapper() });
    await userEvent.click(screen.getByRole('button', { name: /rifiuta/i }));

    const rejectButtons = screen.getAllByRole('button', { name: /rifiuta/i });
    expect(rejectButtons[rejectButtons.length - 1]).toBeDisabled();
  });

  it('does not show workflow action buttons once the contract is APPROVED', () => {
    mockContract({ workflowStage: 'APPROVED', status: 'ACTIVE' });
    mockAuthAs({ role: 'ADMIN' });

    render(<ContractDetailPage />, { wrapper: createWrapper() });

    expect(screen.queryByRole('button', { name: /invia in revisione/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /approva/i })).not.toBeInTheDocument();
  });

  it('shows the workflow stage badge when present', () => {
    mockContract({ workflowStage: 'IN_REVIEW' });
    mockAuthAs({ role: 'ADMIN' });

    render(<ContractDetailPage />, { wrapper: createWrapper() });

    expect(screen.getByText('In revisione')).toBeInTheDocument();
  });
});

describe('ContractDetailPage — financial values tab', () => {
  it('totals revenue and cost separately instead of blending them together', async () => {
    mockContract({ workflowStage: 'DRAFT' });
    mockAuthAs({ role: 'MANAGER', managerId: 5 });
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/financial-values/by-contract/1') {
        return Promise.resolve({
          data: [
            { id: 1, typeName: 'Ricavi', areaName: 'IT', financialAmount: 1000, month: 1, year: 2025, category: 'REVENUE' },
            { id: 2, typeName: 'Costi', areaName: 'IT', financialAmount: 400, month: 1, year: 2025, category: 'COST' },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });

    render(<ContractDetailPage />, { wrapper: createWrapper() });
    await userEvent.click(screen.getByRole('button', { name: /valori finanziari/i }));

    // Computed with the component's own formatting rather than hardcoded,
    // so the assertion doesn't depend on the host's ICU separators for it-IT.
    const eur = (n: number) =>
      `€${n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    expect(await screen.findByText('Totale ricavi')).toBeInTheDocument();
    expect(screen.getByText('Totale costi')).toBeInTheDocument();
    expect(screen.getByText('Margine netto')).toBeInTheDocument();
    expect(screen.getAllByText(eur(1000)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(eur(400)).length).toBeGreaterThan(0);
    expect(screen.getByText(eur(600))).toBeInTheDocument();
    expect(screen.queryByText(/^Totale$/)).not.toBeInTheDocument();
  });
});
