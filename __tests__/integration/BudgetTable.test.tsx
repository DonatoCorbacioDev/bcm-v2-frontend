import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Budget } from '@/types';
import { createWrapper } from '../mocks/wrapper';

// ─── Module mocks ────────────────────────────────────────────────────────────

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/hooks/useBudgets', () => ({
  useBudgets: jest.fn(),
}));

jest.mock('@/services/budgets.service', () => ({
  budgetsService: {
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
import { useBudgets } from '@/hooks/useBudgets';
import { budgetsService } from '@/services/budgets.service';
import BudgetTable from '@/components/budgets/BudgetTable';

// ─── Test fixtures ───────────────────────────────────────────────────────────

const budget1: Budget = {
  id: 1, businessAreaId: 1, areaName: 'IT', category: 'COST',
  year: 2025, targetAmount: 10000, actualAmount: 4000, percentUsed: 40,
};
const budget2: Budget = {
  id: 2, businessAreaId: 2, areaName: 'Sales', category: 'REVENUE',
  year: 2025, targetAmount: 20000, actualAmount: 22000, percentUsed: 110,
};

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('BudgetTable', () => {
  const onEditClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useBudgets as jest.Mock).mockReturnValue({
      data: [budget1, budget2],
      isLoading: false,
      isError: false,
    });
  });

  // ── States ────────────────────────────────────────────────────────────────

  it('shows skeleton while loading', () => {
    (useBudgets as jest.Mock).mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<BudgetTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    expect(screen.queryByText('IT')).not.toBeInTheDocument();
  });

  it('shows error state when the API fails', () => {
    (useBudgets as jest.Mock).mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<BudgetTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    expect(screen.getByText(/impossibile caricare i budget/i)).toBeInTheDocument();
  });

  it('shows empty state when no budgets exist', () => {
    (useBudgets as jest.Mock).mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<BudgetTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    expect(screen.getByText(/nessun budget trovato/i)).toBeInTheDocument();
  });

  // ── Data rendering ────────────────────────────────────────────────────────

  it('renders budget rows with area, category and amounts', () => {
    render(<BudgetTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    expect(screen.getByText('IT')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('Costo')).toBeInTheDocument();
    expect(screen.getByText('Ricavo')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByText('110%')).toBeInTheDocument();
  });

  it('shows the budget count', () => {
    render(<BudgetTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    expect(screen.getByText(/2 \/ 2 budget/i)).toBeInTheDocument();
  });

  // ── Search ────────────────────────────────────────────────────────────────

  it('filters budgets by area on search', async () => {
    render(<BudgetTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    await userEvent.type(screen.getByPlaceholderText(/cerca per area/i), 'IT');
    expect(screen.getByText('IT')).toBeInTheDocument();
    expect(screen.queryByText('Sales')).not.toBeInTheDocument();
  });

  it('shows no match message when search has no results', async () => {
    render(<BudgetTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    await userEvent.type(screen.getByPlaceholderText(/cerca per area/i), 'xyz-no-match');
    expect(screen.getByText(/nessun budget corrisponde alla ricerca/i)).toBeInTheDocument();
  });

  it('shows Clear button when search is active', async () => {
    render(<BudgetTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    await userEvent.type(screen.getByPlaceholderText(/cerca per area/i), 'IT');
    expect(screen.getByRole('button', { name: /pulisci/i })).toBeInTheDocument();
  });

  // ── Actions ───────────────────────────────────────────────────────────────

  it('calls onEditClick with the correct budget when Edit is clicked', async () => {
    render(<BudgetTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /modifica/i }));
    expect(onEditClick).toHaveBeenCalledWith(expect.objectContaining({ id: 1, areaName: 'IT' }));
  });

  it('opens delete confirmation dialog when Delete is clicked', async () => {
    render(<BudgetTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /elimina/i }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/sei sicuro/i)).toBeInTheDocument();
  });

  it('closes the delete dialog when Cancel is clicked', async () => {
    render(<BudgetTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /elimina/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /annulla/i }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('confirms delete and shows success toast', async () => {
    render(<BudgetTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /elimina/i }));
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /^elimina$/i }));
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Budget eliminato con successo!');
    });
  });

  it('shows error toast when delete fails', async () => {
    (budgetsService.delete as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    render(<BudgetTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /elimina/i }));
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /^elimina$/i }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Eliminazione del budget non riuscita');
    });
  });

  it('clears the search field when Clear is clicked', async () => {
    render(<BudgetTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    await userEvent.type(screen.getByPlaceholderText(/cerca per area/i), 'IT');
    await userEvent.click(screen.getByRole('button', { name: /pulisci/i }));
    expect(screen.getByPlaceholderText(/cerca per area/i)).toHaveValue('');
  });
});
