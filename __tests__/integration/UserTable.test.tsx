import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { User, Manager } from '@/types';
import { createWrapper } from '../mocks/wrapper';
import UserTable from '@/components/users/UserTable';

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// Mock hooks to control returned data without real network calls.
jest.mock('@/hooks/useUsers', () => ({
  useUsers: jest.fn(),
  usersQueryKeys: { all: ['users'] },
}));

jest.mock('@/hooks/useManagers', () => ({
  useManagers: jest.fn(),
}));

jest.mock('@/hooks/useRoles', () => ({
  useRoles: jest.fn(),
}));

// Mock the service layer so delete mutations resolve immediately.
jest.mock('@/services/users.service', () => ({
  usersService: {
    list: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
    create: jest.fn(),
    update: jest.fn(),
    invite: jest.fn(),
  },
}));

// Required because usersService imports api, which throws without NEXT_PUBLIC_API_URL.
// __esModule: true prevents esModuleInterop from wrapping the default export.
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

import { toast } from 'sonner';
import { useUsers } from '@/hooks/useUsers';
import { useManagers } from '@/hooks/useManagers';
import { useRoles } from '@/hooks/useRoles';
import { usersService } from '@/services/users.service';

const mockUsers: User[] = [
  {
    id: 1,
    username: 'alice@example.com',
    managerId: 1,
    role: 'ADMIN',
    roleId: 1,
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    username: 'bob@example.com',
    managerId: 2,
    role: 'VIEWER',
    roleId: 2,
    verified: false,
    createdAt: '2024-02-01T00:00:00Z',
  },
];

const mockManagers: Manager[] = [
  { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com', phoneNumber: '0000', department: 'IT' },
  { id: 2, firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', phoneNumber: '1111', department: 'HR' },
];

describe('UserTable', () => {
  const onEditClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useUsers as jest.Mock).mockReturnValue({
      data: mockUsers,
      isLoading: false,
      isError: false,
    });
    (useManagers as jest.Mock).mockReturnValue({ data: mockManagers });
    (useRoles as jest.Mock).mockReturnValue({
      data: [{ id: 1, role: 'ADMIN' }, { id: 2, role: 'VIEWER' }],
    });
  });

  it('renders all user rows', () => {
    render(<UserTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
  });

  it('displays role names resolved from roleId via roleMap', () => {
    render(<UserTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
    expect(screen.getByText('VIEWER')).toBeInTheDocument();
  });

  it('shows "—" when roleId has no matching role', () => {
    (useRoles as jest.Mock).mockReturnValue({ data: [] });
    render(<UserTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('displays resolved manager names instead of raw IDs', () => {
    render(<UserTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows verified badge for each user', () => {
    render(<UserTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    // alice (row 1) is verified, bob (row 2) is not
    const rows = screen.getAllByRole('row');
    expect(within(rows[1]).getByText('Yes')).toBeInTheDocument();
    expect(within(rows[2]).getByText('No')).toBeInTheDocument();
  });

  it('shows skeleton while loading', () => {
    (useUsers as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(<UserTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    // Table is replaced by skeleton — rows should not be visible
    expect(screen.queryByText('alice@example.com')).not.toBeInTheDocument();
  });

  it('shows error state when the users API fails', () => {
    (useUsers as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(<UserTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByText(/failed to load users/i)).toBeInTheDocument();
  });

  it('filters users when typing in the search input', async () => {
    render(<UserTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText(/search users/i);
    await userEvent.type(searchInput, 'alice');

    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.queryByText('bob@example.com')).not.toBeInTheDocument();
  });

  it('restores all users after clearing the search input', async () => {
    render(<UserTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText(/search users/i);
    await userEvent.type(searchInput, 'alice');
    expect(screen.queryByText('bob@example.com')).not.toBeInTheDocument();

    await userEvent.clear(searchInput);
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
  });

  it('shows empty state message when search yields no results', async () => {
    render(<UserTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText(/search users/i);
    await userEvent.type(searchInput, 'zzz-no-match');

    expect(screen.getByText(/no users match/i)).toBeInTheDocument();
  });

  it('calls onEditClick with the correct user when Edit is clicked', async () => {
    render(<UserTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    const editButton = within(rows[1]).getByRole('button', { name: /edit/i });
    await userEvent.click(editButton);

    expect(onEditClick).toHaveBeenCalledTimes(1);
    expect(onEditClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, username: 'alice@example.com' })
    );
  });

  it('opens the delete confirmation dialog when Delete is clicked', async () => {
    render(<UserTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    const deleteButton = within(rows[1]).getByRole('button', { name: /delete/i });
    await userEvent.click(deleteButton);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/are you sure/i)).toBeInTheDocument();
    // The dialog shows the username in its description
    expect(within(dialog).getByText('alice@example.com')).toBeInTheDocument();
  });

  it('closes the dialog when Cancel is clicked', async () => {
    render(<UserTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /delete/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('shows empty state when no users exist', () => {
    (useUsers as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
    render(<UserTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    expect(screen.getByText(/no users found/i)).toBeInTheDocument();
  });

  it('confirms delete and shows success toast', async () => {
    render(<UserTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /delete/i }));
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('User deleted successfully!');
    });
  });

  it('shows error toast when delete fails', async () => {
    (usersService.delete as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    render(<UserTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /delete/i }));
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to delete user');
    });
  });

  it('shows Clear button when verified filter is set and clears on click', async () => {
    render(<UserTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    await userEvent.selectOptions(screen.getByLabelText(/filter by verification status/i), 'VERIFIED');
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
  });

  it('filters to only unverified users when UNVERIFIED filter is selected', async () => {
    render(<UserTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    await userEvent.selectOptions(screen.getByLabelText(/filter by verification status/i), 'UNVERIFIED');

    expect(screen.queryByText('alice@example.com')).not.toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
  });

  it('falls back to empty roles when useRoles returns undefined data', () => {
    (useRoles as jest.Mock).mockReturnValue({ data: undefined });
    render(<UserTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });
});
