import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FinancialValue } from '@/types';
import { createWrapper } from '../mocks/wrapper';

// ─── Module mocks ────────────────────────────────────────────────────────────

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/hooks/useFinancialValues', () => ({
  useFinancialValues: jest.fn(),
  financialValuesQueryKeys: { all: ['financialValues'] },
}));

jest.mock('@/services/financialValues.service', () => ({
  financialValuesService: {
    list: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    delete: jest.fn().mockResolvedValue({}),
    post: jest.fn(),
    put: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    defaults: { headers: { common: {} } },
  },
}));

// ─── Imports that reference mocked modules ───────────────────────────────────

import { toast } from 'sonner';
import { useFinancialValues } from '@/hooks/useFinancialValues';
import { financialValuesService } from '@/services/financialValues.service';
import FinancialValueTable from '@/components/financial-values/FinancialValueTable';

// ─── Test fixtures ───────────────────────────────────────────────────────────

const value1: FinancialValue = {
  id: 1,
  month: 1,
  year: 2024,
  financialAmount: 10000,
  financialTypeId: 1,
  businessAreaId: 1,
  contractId: 1,
  typeName: 'Revenue',
  areaName: 'Engineering',
  customerName: 'Acme Corp',
};

const value2: FinancialValue = {
  id: 2,
  month: 6,
  year: 2024,
  financialAmount: 5000,
  financialTypeId: 2,
  businessAreaId: 2,
  contractId: 2,
  typeName: 'Expense',
  areaName: 'Sales',
  customerName: 'Beta Inc',
};

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('FinancialValueTable', () => {
  const onEditClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useFinancialValues as jest.Mock).mockReturnValue({
      data: [value1, value2],
      isLoading: false,
      isError: false,
    });
  });

  // ── States ────────────────────────────────────────────────────────────────

  it('shows skeleton while loading', () => {
    (useFinancialValues as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
    render(<FinancialValueTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    expect(screen.queryByText('Gen/2024')).not.toBeInTheDocument();
  });

  it('shows error state when the API fails', () => {
    (useFinancialValues as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    render(<FinancialValueTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    expect(screen.getByText(/impossibile caricare i valori finanziari/i)).toBeInTheDocument();
  });

  it('shows empty state when no financial values exist', () => {
    (useFinancialValues as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
    render(<FinancialValueTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    expect(screen.getByText(/nessun valore finanziario trovato/i)).toBeInTheDocument();
  });

  // ── Data rendering ────────────────────────────────────────────────────────

  it('renders financial value rows with period', () => {
    render(<FinancialValueTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    expect(screen.getByText('Gen/2024')).toBeInTheDocument();
    expect(screen.getByText('Giu/2024')).toBeInTheDocument();
  });

  it('shows the value count', () => {
    render(<FinancialValueTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    expect(screen.getByText(/2 \/ 2 valori/i)).toBeInTheDocument();
  });

  // ── Search ────────────────────────────────────────────────────────────────

  it('filters values by year', async () => {
    render(<FinancialValueTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    await userEvent.type(screen.getByPlaceholderText(/cerca per anno\/importo/i), '2024');
    expect(screen.getByText(/2 \/ 2 valori/i)).toBeInTheDocument();
  });

  it('shows no match message when search has no results', async () => {
    render(<FinancialValueTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    await userEvent.type(screen.getByPlaceholderText(/cerca per anno\/importo/i), '9999');
    expect(screen.getByText(/nessun valore finanziario corrisponde ai filtri/i)).toBeInTheDocument();
  });

  // ── Month filter ──────────────────────────────────────────────────────────

  it('filters by month', async () => {
    render(<FinancialValueTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    await userEvent.click(screen.getByRole('combobox', { name: /filtra per mese/i }));
    await userEvent.click(await screen.findByRole('option', { name: /^gennaio$/i }));
    expect(screen.getByText('Gen/2024')).toBeInTheDocument();
    expect(screen.queryByText('Giu/2024')).not.toBeInTheDocument();
  });

  it('shows Clear button when a filter is active', async () => {
    render(<FinancialValueTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    await userEvent.click(screen.getByRole('combobox', { name: /filtra per mese/i }));
    await userEvent.click(await screen.findByRole('option', { name: /^gennaio$/i }));
    expect(screen.getByRole('button', { name: /pulisci/i })).toBeInTheDocument();
  });

  // ── Actions ───────────────────────────────────────────────────────────────

  it('calls onEditClick with the correct value when Edit is clicked', async () => {
    render(<FinancialValueTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /modifica/i }));
    expect(onEditClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, year: 2024, month: 1 })
    );
  });

  it('opens delete confirmation dialog when Delete is clicked', async () => {
    render(<FinancialValueTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /elimina/i }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/sei sicuro/i)).toBeInTheDocument();
  });

  it('closes the delete dialog when Cancel is clicked', async () => {
    render(<FinancialValueTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /elimina/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /annulla/i }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('confirms delete and shows success toast', async () => {
    render(<FinancialValueTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /elimina/i }));
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /^elimina$/i }));
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Valore finanziario eliminato con successo!');
    });
  });

  it('shows error toast when delete fails', async () => {
    (financialValuesService.delete as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    render(<FinancialValueTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /elimina/i }));
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /^elimina$/i }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Eliminazione del valore finanziario non riuscita");
    });
  });

  it('clears filters when Clear is clicked', async () => {
    render(<FinancialValueTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    await userEvent.click(screen.getByRole('combobox', { name: /filtra per mese/i }));
    await userEvent.click(await screen.findByRole('option', { name: /^gennaio$/i }));
    expect(screen.getByRole('button', { name: /pulisci/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /pulisci/i }));
    expect(screen.queryByRole('button', { name: /pulisci/i })).not.toBeInTheDocument();
  });
});
