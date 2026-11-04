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
  useSearchParams: () => mockSearchParams,
}));

let mockSearchParams = new URLSearchParams();

jest.mock('@/hooks/useContract', () => ({
  useContract: jest.fn(),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/services/contracts.service', () => ({
  contractsService: { delete: jest.fn(), generateFinancialValues: jest.fn() },
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
import { contractsService } from '@/services/contracts.service';
import { contractWorkflowService } from '@/services/contractWorkflow.service';
import api from '@/lib/api';
import ContractDetailPage from '@/app/(dashboard)/contracts/[id]/page';

const baseContract = {
  id: 1,
  counterpartyId: 1,
  counterparty: { id: 1, name: 'Acme', type: 'CUSTOMER' as const },
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
  financialTypeId: null as number | null,
  annualValue: null as number | null,
  billingFrequency: null as string | null,
  daysUntilExpiry: undefined as number | undefined,
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

  it('does not duplicate the status badge when the workflow stage is DRAFT', () => {
    mockContract({ workflowStage: 'DRAFT', status: 'DRAFT' });
    mockAuthAs({ role: 'ADMIN' });

    render(<ContractDetailPage />, { wrapper: createWrapper() });

    // Both the contract status and the workflow stage translate to "Bozza" —
    // only the status badge should render, not two identical badges side by side.
    expect(screen.getAllByText('Bozza')).toHaveLength(1);
  });
});

describe('ContractDetailPage — expiry badge', () => {
  it('shows how many days are left next to "Attivo" when the contract ends within 30 days', () => {
    mockContract({ status: 'ACTIVE', workflowStage: 'APPROVED', daysUntilExpiry: 12 });
    mockAuthAs({ role: 'ADMIN' });

    render(<ContractDetailPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Attivo')).toBeInTheDocument();
    expect(screen.getByText('Scade tra 12 giorni')).toBeInTheDocument();
  });

  it('shows no expiry badge when the end date is further away', () => {
    mockContract({ status: 'ACTIVE', workflowStage: 'APPROVED', daysUntilExpiry: 90 });
    mockAuthAs({ role: 'ADMIN' });

    render(<ContractDetailPage />, { wrapper: createWrapper() });

    expect(screen.queryByText(/^Scade (tra|oggi)/)).not.toBeInTheDocument();
  });
});

describe('ContractDetailPage — section tabs', () => {
  beforeEach(() => {
    mockContract({ workflowStage: 'DRAFT' });
    mockAuthAs({ role: 'ADMIN' });
  });

  it('exposes the sections as a labelled tablist with one selected tab and its panel', () => {
    render(<ContractDetailPage />, { wrapper: createWrapper() });

    expect(screen.getByRole('tablist', { name: 'Sezioni del contratto' })).toBeInTheDocument();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((t) => t.textContent)).toEqual(['Documenti', 'Valori finanziari', 'Cronologia modifiche', 'Fatture']);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    // Only the active tab is in the Tab order (roving tabindex).
    expect(tabs[0]).toHaveAttribute('tabindex', '0');
    expect(tabs[1]).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('tabpanel', { name: 'Documenti' })).toBeInTheDocument();
  });

  it('opens the tab named in the link, as the home page links invoices (?tab=invoices)', () => {
    mockSearchParams = new URLSearchParams('tab=invoices');
    try {
      render(<ContractDetailPage />, { wrapper: createWrapper() });
      expect(screen.getByRole('tab', { name: 'Fatture' })).toHaveAttribute('aria-selected', 'true');
    } finally {
      mockSearchParams = new URLSearchParams();
    }
  });

  it('ignores an unknown tab in the link', () => {
    mockSearchParams = new URLSearchParams('tab=nope');
    try {
      render(<ContractDetailPage />, { wrapper: createWrapper() });
      expect(screen.getByRole('tab', { name: 'Documenti' })).toHaveAttribute('aria-selected', 'true');
    } finally {
      mockSearchParams = new URLSearchParams();
    }
  });

  it('moves between tabs with the arrow, Home and End keys', async () => {
    render(<ContractDetailPage />, { wrapper: createWrapper() });
    const tab = (name: string) => screen.getByRole('tab', { name });

    tab('Documenti').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(tab('Valori finanziari')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Valori finanziari')).toHaveFocus();

    await userEvent.keyboard('{End}');
    expect(tab('Fatture')).toHaveFocus();
    expect(screen.getByRole('tabpanel', { name: 'Fatture' })).toBeInTheDocument();

    await userEvent.keyboard('{ArrowRight}');
    expect(tab('Documenti')).toHaveFocus();

    await userEvent.keyboard('{ArrowLeft}');
    expect(tab('Fatture')).toHaveFocus();

    await userEvent.keyboard('{Home}');
    expect(tab('Documenti')).toHaveAttribute('aria-selected', 'true');
  });

  it('ignores other keys on the tablist', async () => {
    render(<ContractDetailPage />, { wrapper: createWrapper() });
    screen.getByRole('tab', { name: 'Documenti' }).focus();

    await userEvent.keyboard('{ArrowDown}');

    expect(screen.getByRole('tab', { name: 'Documenti' })).toHaveAttribute('aria-selected', 'true');
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
    await userEvent.click(screen.getByRole('tab', { name: /valori finanziari/i }));

    // Italian accounting format, thousands always grouped ("1.000,00 €").
    const eur = (n: number) =>
      new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', useGrouping: 'always' })
        .format(n)
        .replace(/ /g, ' ');

    expect(await screen.findByText('Totale ricavi')).toBeInTheDocument();
    expect(screen.getByText('Totale costi')).toBeInTheDocument();
    expect(screen.getByText('Margine netto')).toBeInTheDocument();
    expect(screen.getAllByText(eur(1000)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(eur(400)).length).toBeGreaterThan(0);
    expect(screen.getByText(eur(600))).toBeInTheDocument();
    expect(screen.queryByText(/^Totale$/)).not.toBeInTheDocument();
  });
});

describe('ContractDetailPage — regenerate financial values button', () => {
  const contractWithFinancialTerms = {
    financialTypeId: 1,
    annualValue: 36000,
    billingFrequency: 'MONTHLY' as const,
  };

  it('shows the button for an ADMIN when the contract has financial terms set', async () => {
    mockContract(contractWithFinancialTerms);
    mockAuthAs({ role: 'ADMIN' });

    render(<ContractDetailPage />, { wrapper: createWrapper() });
    await userEvent.click(screen.getByRole('tab', { name: /valori finanziari/i }));

    expect(await screen.findByRole('button', { name: /rigenera valori finanziari/i })).toBeInTheDocument();
  });

  it('hides the button when the contract has no financial terms set', async () => {
    mockContract({}); // baseContract has no financialTypeId/annualValue/billingFrequency
    mockAuthAs({ role: 'ADMIN' });

    render(<ContractDetailPage />, { wrapper: createWrapper() });
    await userEvent.click(screen.getByRole('tab', { name: /valori finanziari/i }));

    expect(screen.queryByRole('button', { name: /rigenera valori finanziari/i })).not.toBeInTheDocument();
  });

  it('hides the button for a MANAGER even when financial terms are set', async () => {
    mockContract(contractWithFinancialTerms);
    mockAuthAs({ role: 'MANAGER', managerId: 5 });

    render(<ContractDetailPage />, { wrapper: createWrapper() });
    await userEvent.click(screen.getByRole('tab', { name: /valori finanziari/i }));

    expect(screen.queryByRole('button', { name: /rigenera valori finanziari/i })).not.toBeInTheDocument();
  });

  it('calls generateFinancialValues and shows a summary toast on click', async () => {
    mockContract(contractWithFinancialTerms);
    mockAuthAs({ role: 'ADMIN' });
    (contractsService.generateFinancialValues as jest.Mock).mockResolvedValue({
      created: 5, regenerated: 2, skippedManual: 1, values: [],
    });

    render(<ContractDetailPage />, { wrapper: createWrapper() });
    await userEvent.click(screen.getByRole('tab', { name: /valori finanziari/i }));
    await userEvent.click(await screen.findByRole('button', { name: /rigenera valori finanziari/i }));

    await waitFor(() => expect(contractsService.generateFinancialValues).toHaveBeenCalledWith(1));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('5 creati'))
    );
  });

  it('shows an error toast when regeneration fails', async () => {
    mockContract(contractWithFinancialTerms);
    mockAuthAs({ role: 'ADMIN' });
    (contractsService.generateFinancialValues as jest.Mock).mockRejectedValue(new Error('fail'));

    render(<ContractDetailPage />, { wrapper: createWrapper() });
    await userEvent.click(screen.getByRole('tab', { name: /valori finanziari/i }));
    await userEvent.click(await screen.findByRole('button', { name: /rigenera valori finanziari/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Rigenerazione dei valori finanziari non riuscita')
    );
  });
});
