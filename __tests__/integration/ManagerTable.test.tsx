import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Manager } from '@/types';
import { createWrapper } from '../mocks/wrapper';

// ─── Module mocks ────────────────────────────────────────────────────────────

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/hooks/useManagers', () => ({
  useManagers: jest.fn(),
}));

jest.mock('@/services/managers.service', () => ({
  managersService: {
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
import { useManagers } from '@/hooks/useManagers';
import { managersService } from '@/services/managers.service';
import ManagerTable from '@/components/managers/ManagerTable';

// ─── Test fixtures ───────────────────────────────────────────────────────────

const manager1: Manager = {
  id: 1,
  firstName: 'Alice',
  lastName: 'Smith',
  email: 'alice@example.com',
  phoneNumber: '+39 333 1234567',
  department: 'Engineering',
};

const manager2: Manager = {
  id: 2,
  firstName: 'Bob',
  lastName: 'Jones',
  email: 'bob@example.com',
  phoneNumber: '+39 333 9876543',
  department: 'Sales',
};

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('ManagerTable', () => {
  const onEditClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useManagers as jest.Mock).mockReturnValue({
      data: [manager1, manager2],
      isLoading: false,
      isError: false,
    });
  });

  // ── States ────────────────────────────────────────────────────────────────

  it('shows skeleton while loading', () => {
    (useManagers as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(<ManagerTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.queryByText('alice@example.com')).not.toBeInTheDocument();
  });

  it('shows error state when the API fails', () => {
    (useManagers as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(<ManagerTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByText(/impossibile caricare i manager/i)).toBeInTheDocument();
  });

  it('shows empty state when no managers exist', () => {
    (useManagers as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    render(<ManagerTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByText(/nessun manager trovato/i)).toBeInTheDocument();
    expect(screen.getByText(/crea il tuo primo manager/i)).toBeInTheDocument();
  });

  // ── Data rendering ────────────────────────────────────────────────────────

  it('renders manager rows with name and email', () => {
    render(<ManagerTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
  });

  it('shows the manager count', () => {
    render(<ManagerTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByText(/2 \/ 2 manager/i)).toBeInTheDocument();
  });

  // ── Search ────────────────────────────────────────────────────────────────

  it('search input has an accessible label', () => {
    render(<ManagerTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByRole('textbox', { name: /cerca manager/i })).toBeInTheDocument();
  });

  it('filters managers by name on search', async () => {
    render(<ManagerTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    await userEvent.type(screen.getByRole('textbox', { name: /cerca manager/i }), 'Alice');

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument();
  });

  it('shows "no managers match" when search has no results', async () => {
    render(<ManagerTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    await userEvent.type(screen.getByRole('textbox', { name: /cerca manager/i }), 'xyz-no-match');

    expect(screen.getByText(/nessun manager corrisponde alla ricerca/i)).toBeInTheDocument();
  });

  // ── Actions ───────────────────────────────────────────────────────────────

  it('calls onEditClick with the correct manager when Edit is clicked', async () => {
    render(<ManagerTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /modifica/i }));

    expect(onEditClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, firstName: 'Alice' })
    );
  });

  it('opens the delete confirmation dialog when Delete is clicked', async () => {
    render(<ManagerTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /elimina/i }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent(/sei sicuro/i);
    expect(dialog).toHaveTextContent(/Alice Smith/i);
  });

  it('closes the delete dialog when Cancel is clicked', async () => {
    render(<ManagerTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /elimina/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /annulla/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('confirms delete and shows success toast', async () => {
    render(<ManagerTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /elimina/i }));
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /^elimina$/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Manager eliminato con successo!');
    });
  });

  it('shows error toast when delete fails', async () => {
    (managersService.delete as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    render(<ManagerTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /elimina/i }));
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /^elimina$/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Eliminazione del manager non riuscita");
    });
  });

  it('clears the search field when Clear is clicked', async () => {
    render(<ManagerTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    await userEvent.type(screen.getByRole('textbox', { name: /cerca manager/i }), 'Alice');
    await userEvent.click(screen.getByRole('button', { name: /pulisci/i }));

    expect(screen.getByRole('textbox', { name: /cerca manager/i })).toHaveValue('');
  });
});
