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

import { useManagers } from '@/hooks/useManagers';
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

    expect(screen.getByText(/failed to load managers/i)).toBeInTheDocument();
  });

  it('shows empty state when no managers exist', () => {
    (useManagers as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    render(<ManagerTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByText(/no managers found/i)).toBeInTheDocument();
    expect(screen.getByText(/create your first manager/i)).toBeInTheDocument();
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

    expect(screen.getByText(/2 \/ 2 managers/i)).toBeInTheDocument();
  });

  // ── Search ────────────────────────────────────────────────────────────────

  it('search input has an accessible label', () => {
    render(<ManagerTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByRole('textbox', { name: /search managers/i })).toBeInTheDocument();
  });

  it('filters managers by name on search', async () => {
    render(<ManagerTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    await userEvent.type(screen.getByRole('textbox', { name: /search managers/i }), 'Alice');

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument();
  });

  it('shows "no managers match" when search has no results', async () => {
    render(<ManagerTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    await userEvent.type(screen.getByRole('textbox', { name: /search managers/i }), 'xyz-no-match');

    expect(screen.getByText(/no managers match your search/i)).toBeInTheDocument();
  });

  // ── Actions ───────────────────────────────────────────────────────────────

  it('calls onEditClick with the correct manager when Edit is clicked', async () => {
    render(<ManagerTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /edit/i }));

    expect(onEditClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, firstName: 'Alice' })
    );
  });

  it('opens the delete confirmation dialog when Delete is clicked', async () => {
    render(<ManagerTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /delete/i }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent(/are you sure/i);
    expect(dialog).toHaveTextContent(/Alice Smith/i);
  });

  it('closes the delete dialog when Cancel is clicked', async () => {
    render(<ManagerTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /delete/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
