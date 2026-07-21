import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FinancialType } from '@/types';
import { createWrapper } from '../mocks/wrapper';

// ─── Module mocks ────────────────────────────────────────────────────────────

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/hooks/useFinancialTypes', () => ({
  useFinancialTypes: jest.fn(),
}));

jest.mock('@/services/financialTypes.service', () => ({
  financialTypesService: {
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
import { useFinancialTypes } from '@/hooks/useFinancialTypes';
import { financialTypesService } from '@/services/financialTypes.service';
import FinancialTypeTable from '@/components/financial-types/FinancialTypeTable';

// ─── Test fixtures ───────────────────────────────────────────────────────────

const type1: FinancialType = { id: 1, name: 'Revenue', description: 'Revenue type', category: 'REVENUE' };
const type2: FinancialType = { id: 2, name: 'Expense', description: 'Expense type', category: 'COST' };

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('FinancialTypeTable', () => {
  const onEditClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useFinancialTypes as jest.Mock).mockReturnValue({
      data: [type1, type2],
      isLoading: false,
      isError: false,
    });
  });

  // ── States ────────────────────────────────────────────────────────────────

  it('shows skeleton while loading', () => {
    (useFinancialTypes as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
    render(<FinancialTypeTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    expect(screen.queryByText('Revenue')).not.toBeInTheDocument();
  });

  it('shows error state when the API fails', () => {
    (useFinancialTypes as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    render(<FinancialTypeTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    expect(screen.getByText(/impossibile caricare i tipi finanziari/i)).toBeInTheDocument();
  });

  it('shows empty state when no financial types exist', () => {
    (useFinancialTypes as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
    render(<FinancialTypeTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    expect(screen.getByText(/nessun tipo finanziario trovato/i)).toBeInTheDocument();
  });

  // ── Data rendering ────────────────────────────────────────────────────────

  it('renders financial type rows with name and description', () => {
    render(<FinancialTypeTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Expense')).toBeInTheDocument();
  });

  it('shows the type count', () => {
    render(<FinancialTypeTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    expect(screen.getByText(/2 \/ 2 tipi/i)).toBeInTheDocument();
  });

  it('shows the category badge for each type', () => {
    render(<FinancialTypeTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    expect(screen.getByText('Ricavo')).toBeInTheDocument();
    expect(screen.getByText('Costo')).toBeInTheDocument();
  });

  // ── Search ────────────────────────────────────────────────────────────────

  it('filters types by name on search', async () => {
    render(<FinancialTypeTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    await userEvent.type(screen.getByPlaceholderText(/cerca tipi finanziari/i), 'Revenue');
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.queryByText('Expense')).not.toBeInTheDocument();
  });

  it('filters types by description on search', async () => {
    render(<FinancialTypeTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    await userEvent.type(screen.getByPlaceholderText(/cerca tipi finanziari/i), 'Revenue type');
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.queryByText('Expense')).not.toBeInTheDocument();
  });

  it('shows no match message when search has no results', async () => {
    render(<FinancialTypeTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    await userEvent.type(screen.getByPlaceholderText(/cerca tipi finanziari/i), 'xyz-no-match');
    expect(screen.getByText(/nessun tipo finanziario corrisponde alla ricerca/i)).toBeInTheDocument();
  });

  it('shows Clear button when search is active', async () => {
    render(<FinancialTypeTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    await userEvent.type(screen.getByPlaceholderText(/cerca tipi finanziari/i), 'Revenue');
    expect(screen.getByRole('button', { name: /pulisci/i })).toBeInTheDocument();
  });

  // ── Actions ───────────────────────────────────────────────────────────────

  it('calls onEditClick with the correct type when Edit is clicked', async () => {
    render(<FinancialTypeTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /modifica/i }));
    expect(onEditClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, name: 'Revenue' })
    );
  });

  it('opens delete confirmation dialog when Delete is clicked', async () => {
    render(<FinancialTypeTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /elimina/i }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/sei sicuro/i)).toBeInTheDocument();
    expect(within(dialog).getByText('Revenue')).toBeInTheDocument();
  });

  it('closes the delete dialog when Cancel is clicked', async () => {
    render(<FinancialTypeTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /elimina/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /annulla/i }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('confirms delete and shows success toast', async () => {
    render(<FinancialTypeTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /elimina/i }));
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /^elimina$/i }));
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Tipo finanziario eliminato con successo!');
    });
  });

  it('shows error toast when delete fails', async () => {
    (financialTypesService.delete as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    render(<FinancialTypeTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /elimina/i }));
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /^elimina$/i }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Eliminazione del tipo finanziario non riuscita");
    });
  });

  it('clears the search field when Clear is clicked', async () => {
    render(<FinancialTypeTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    await userEvent.type(screen.getByPlaceholderText(/cerca tipi finanziari/i), 'Revenue');
    await userEvent.click(screen.getByRole('button', { name: /pulisci/i }));
    expect(screen.getByPlaceholderText(/cerca tipi finanziari/i)).toHaveValue('');
  });
});
