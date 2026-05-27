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

const type1: FinancialType = { id: 1, name: 'Revenue', description: 'Revenue type' };
const type2: FinancialType = { id: 2, name: 'Expense', description: 'Expense type' };

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
    expect(screen.getByText(/failed to load financial types/i)).toBeInTheDocument();
  });

  it('shows empty state when no financial types exist', () => {
    (useFinancialTypes as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
    render(<FinancialTypeTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    expect(screen.getByText(/no financial types found/i)).toBeInTheDocument();
  });

  // ── Data rendering ────────────────────────────────────────────────────────

  it('renders financial type rows with name and description', () => {
    render(<FinancialTypeTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Expense')).toBeInTheDocument();
  });

  it('shows the type count', () => {
    render(<FinancialTypeTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    expect(screen.getByText(/2 \/ 2 types/i)).toBeInTheDocument();
  });

  // ── Search ────────────────────────────────────────────────────────────────

  it('filters types by name on search', async () => {
    render(<FinancialTypeTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    await userEvent.type(screen.getByPlaceholderText(/search financial types/i), 'Revenue');
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.queryByText('Expense')).not.toBeInTheDocument();
  });

  it('filters types by description on search', async () => {
    render(<FinancialTypeTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    await userEvent.type(screen.getByPlaceholderText(/search financial types/i), 'Revenue type');
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.queryByText('Expense')).not.toBeInTheDocument();
  });

  it('shows no match message when search has no results', async () => {
    render(<FinancialTypeTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    await userEvent.type(screen.getByPlaceholderText(/search financial types/i), 'xyz-no-match');
    expect(screen.getByText(/no financial types match your search/i)).toBeInTheDocument();
  });

  it('shows Clear button when search is active', async () => {
    render(<FinancialTypeTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    await userEvent.type(screen.getByPlaceholderText(/search financial types/i), 'Revenue');
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  // ── Actions ───────────────────────────────────────────────────────────────

  it('calls onEditClick with the correct type when Edit is clicked', async () => {
    render(<FinancialTypeTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /edit/i }));
    expect(onEditClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, name: 'Revenue' })
    );
  });

  it('opens delete confirmation dialog when Delete is clicked', async () => {
    render(<FinancialTypeTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /delete/i }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/are you sure/i)).toBeInTheDocument();
    expect(within(dialog).getByText('Revenue')).toBeInTheDocument();
  });

  it('closes the delete dialog when Cancel is clicked', async () => {
    render(<FinancialTypeTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /delete/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('confirms delete and shows success toast', async () => {
    render(<FinancialTypeTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /delete/i }));
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /^delete$/i }));
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Financial type deleted successfully!');
    });
  });

  it('shows error toast when delete fails', async () => {
    (financialTypesService.delete as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    render(<FinancialTypeTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /delete/i }));
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /^delete$/i }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to delete financial type');
    });
  });

  it('clears the search field when Clear is clicked', async () => {
    render(<FinancialTypeTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    await userEvent.type(screen.getByPlaceholderText(/search financial types/i), 'Revenue');
    await userEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(screen.getByPlaceholderText(/search financial types/i)).toHaveValue('');
  });
});
