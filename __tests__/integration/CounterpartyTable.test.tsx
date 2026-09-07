import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Counterparty } from '@/types';
import { createWrapper } from '../mocks/wrapper';

// ─── Module mocks ────────────────────────────────────────────────────────────

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/hooks/useCounterparties', () => ({
  useCounterparties: jest.fn(),
}));

jest.mock('@/services/counterparties.service', () => ({
  counterpartiesService: {
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
import { useCounterparties } from '@/hooks/useCounterparties';
import { counterpartiesService } from '@/services/counterparties.service';
import CounterpartyTable from '@/components/counterparties/CounterpartyTable';

// ─── Test fixtures ───────────────────────────────────────────────────────────

const alfa: Counterparty = {
  id: 1,
  name: 'Alfa Srl',
  type: 'CUSTOMER',
  vatNumber: 'IT01234567890',
};

const beta: Counterparty = {
  id: 2,
  name: 'Beta Srl',
  type: 'SUPPLIER',
};

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('CounterpartyTable', () => {
  const onEditClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useCounterparties as jest.Mock).mockReturnValue({
      data: [alfa, beta],
      isLoading: false,
      isError: false,
    });
  });

  // ── States ────────────────────────────────────────────────────────────────

  it('shows skeleton while loading', () => {
    (useCounterparties as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(<CounterpartyTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.queryByText('Alfa Srl')).not.toBeInTheDocument();
  });

  it('shows error state when the API fails', () => {
    (useCounterparties as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(<CounterpartyTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByText(/impossibile caricare le controparti/i)).toBeInTheDocument();
  });

  it('shows empty state when no counterparties exist', () => {
    (useCounterparties as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    render(<CounterpartyTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByText(/nessuna controparte trovata/i)).toBeInTheDocument();
  });

  // ── Data rendering ────────────────────────────────────────────────────────

  it('renders counterparty rows with name and type', () => {
    render(<CounterpartyTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByText('Alfa Srl')).toBeInTheDocument();
    expect(screen.getByText('Beta Srl')).toBeInTheDocument();
    expect(screen.getByText('Cliente')).toBeInTheDocument();
    expect(screen.getByText('Fornitore')).toBeInTheDocument();
  });

  it('shows the counterparty count', () => {
    render(<CounterpartyTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByText(/2 \/ 2 controparti/i)).toBeInTheDocument();
  });

  // ── Search ────────────────────────────────────────────────────────────────

  it('search input has an accessible label', () => {
    render(<CounterpartyTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByRole('textbox', { name: /cerca controparti/i })).toBeInTheDocument();
  });

  it('filters counterparties by name on search', async () => {
    render(<CounterpartyTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    await userEvent.type(screen.getByRole('textbox', { name: /cerca controparti/i }), 'Alfa');

    expect(screen.getByText('Alfa Srl')).toBeInTheDocument();
    expect(screen.queryByText('Beta Srl')).not.toBeInTheDocument();
  });

  it('shows "no counterparties match" when search has no results', async () => {
    render(<CounterpartyTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    await userEvent.type(screen.getByRole('textbox', { name: /cerca controparti/i }), 'xyz-no-match');

    expect(screen.getByText(/nessuna controparte corrisponde alla ricerca/i)).toBeInTheDocument();
  });

  // ── Actions ───────────────────────────────────────────────────────────────

  it('calls onEditClick with the correct counterparty when Edit is clicked', async () => {
    render(<CounterpartyTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /modifica/i }));

    expect(onEditClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, name: 'Alfa Srl' })
    );
  });

  it('opens the delete confirmation dialog when Delete is clicked', async () => {
    render(<CounterpartyTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /elimina/i }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/sei sicuro/i)).toBeInTheDocument();
    expect(within(dialog).getByText('Alfa Srl')).toBeInTheDocument();
  });

  it('closes the delete dialog when Cancel is clicked', async () => {
    render(<CounterpartyTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /elimina/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /annulla/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('confirms delete and shows success toast', async () => {
    render(<CounterpartyTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /elimina/i }));
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /^elimina$/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Controparte eliminata');
    });
  });

  it('shows error toast when delete fails', async () => {
    (counterpartiesService.delete as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    render(<CounterpartyTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /elimina/i }));
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /^elimina$/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Eliminazione della controparte non riuscita');
    });
  });

  it('clears the search field when Clear is clicked', async () => {
    render(<CounterpartyTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    await userEvent.type(screen.getByRole('textbox', { name: /cerca controparti/i }), 'Alfa');
    await userEvent.click(screen.getByRole('button', { name: /pulisci/i }));

    expect(screen.getByRole('textbox', { name: /cerca controparti/i })).toHaveValue('');
  });
});
