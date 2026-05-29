import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Contract } from '@/types';
import { createWrapper } from '../mocks/wrapper';
import ContractTable from '@/components/contracts/ContractTable';

// ─── Module mocks ────────────────────────────────────────────────────────────

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// useRouter is mocked as jest.fn() so we can set its return value per-test.
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/contracts',
}));

jest.mock('@/hooks/useContractsPaged', () => ({
  useContractsPaged: jest.fn(),
}));

jest.mock('@/services/contracts.service', () => ({
  contractsService: {
    searchPaged: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

// Avoids the NEXT_PUBLIC_API_URL throw from lib/api.ts.
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
import { useRouter } from 'next/navigation';
import { useContractsPaged } from '@/hooks/useContractsPaged';
import { contractsService } from '@/services/contracts.service';

// ─── Test fixtures ───────────────────────────────────────────────────────────

const mockPush = jest.fn();

const makePageResponse = (contracts: Contract[], totalPages = 1) => ({
  content: contracts,
  totalElements: contracts.length,
  totalPages,
  number: 0,
  size: 10,
});

const activeContract: Contract = {
  id: 1,
  contractNumber: 'CNT-001',
  customerName: 'Acme Corp',
  projectName: 'Digital Transform',
  wbsCode: 'WBS-001',
  areaId: 1,
  managerId: 1,
  managerName: 'John Doe',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  status: 'ACTIVE',
  createdAt: '2024-01-01T00:00:00Z',
};

const expiredContract: Contract = {
  ...activeContract,
  id: 2,
  contractNumber: 'CNT-002',
  customerName: 'Beta Ltd',
  status: 'EXPIRED',
};

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('ContractTable', () => {
  const onEditClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
    });
    // Default: two contracts, one page, loaded
    (useContractsPaged as jest.Mock).mockReturnValue({
      data: makePageResponse([activeContract, expiredContract]),
      isLoading: false,
      isError: false,
    });
  });

  // ── States ────────────────────────────────────────────────────────────────

  it('shows skeleton while loading', () => {
    (useContractsPaged as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.queryByText('CNT-001')).not.toBeInTheDocument();
  });

  it('shows error state when the API fails', () => {
    (useContractsPaged as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByText(/failed to load contracts/i)).toBeInTheDocument();
  });

  it('shows empty state with a create prompt when no contracts exist', () => {
    (useContractsPaged as jest.Mock).mockReturnValue({
      data: makePageResponse([]),
      isLoading: false,
      isError: false,
    });

    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByText(/no contracts found/i)).toBeInTheDocument();
    expect(screen.getByText(/create your first contract/i)).toBeInTheDocument();
  });

  it('shows filter hint when search is active but results are empty', async () => {
    // First call returns data so the search input is visible,
    // subsequent calls return empty so the "Try adjusting" hint appears.
    (useContractsPaged as jest.Mock)
      .mockReturnValueOnce({
        data: makePageResponse([activeContract]),
        isLoading: false,
        isError: false,
      })
      .mockReturnValue({
        data: makePageResponse([]),
        isLoading: false,
        isError: false,
      });

    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText(/search contracts/i);
    await userEvent.type(searchInput, 'xyz-no-match');

    expect(screen.getByText(/try adjusting your search/i)).toBeInTheDocument();
  });

  // ── Data rendering ────────────────────────────────────────────────────────

  it('renders contract rows with number, customer name and status', () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByText('CNT-001')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();

    expect(screen.getByText('CNT-002')).toBeInTheDocument();
    expect(screen.getByText('Beta Ltd')).toBeInTheDocument();
    expect(screen.getByText('EXPIRED')).toBeInTheDocument();
  });

  it('shows total contract count in the toolbar', () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByText(/2 contracts/i)).toBeInTheDocument();
  });

  it('shows singular "contract" when there is exactly one', () => {
    (useContractsPaged as jest.Mock).mockReturnValue({
      data: makePageResponse([activeContract]),
      isLoading: false,
      isError: false,
    });

    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByText('1 contract')).toBeInTheDocument();
  });

  // ── Actions ───────────────────────────────────────────────────────────────

  it('navigates to the contract detail page when View is clicked', async () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    const viewButton = within(rows[1]).getByRole('button', { name: /view/i });
    await userEvent.click(viewButton);

    expect(mockPush).toHaveBeenCalledWith('/contracts/1');
  });

  it('calls onEditClick with the correct contract when Edit is clicked', async () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    const editButton = within(rows[1]).getByRole('button', { name: /edit/i });
    await userEvent.click(editButton);

    expect(onEditClick).toHaveBeenCalledTimes(1);
    expect(onEditClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, contractNumber: 'CNT-001' })
    );
  });

  it('opens the delete confirmation dialog when Delete is clicked', async () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    const deleteButton = within(rows[1]).getByRole('button', { name: /delete/i });
    await userEvent.click(deleteButton);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/are you sure/i)).toBeInTheDocument();
    expect(within(dialog).getByText('CNT-001')).toBeInTheDocument();
  });

  it('closes the delete dialog when Cancel is clicked', async () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /delete/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  // ── Filters ───────────────────────────────────────────────────────────────

  it('renders the status filter select with all options', () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const select = screen.getByDisplayValue('All');
    expect(select).toBeInTheDocument();
    expect(within(select.closest('div') ?? document.body).queryByRole('option', { name: /active/i })).toBeInTheDocument();
  });

  it('shows the Clear button when status filter is active', async () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    // Initially no Clear button
    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();

    const select = screen.getByDisplayValue('All');
    await userEvent.selectOptions(select, 'ACTIVE');

    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('hides the Clear button after filters are reset', async () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const select = screen.getByDisplayValue('All');
    await userEvent.selectOptions(select, 'ACTIVE');
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
  });

  // ── Pagination ────────────────────────────────────────────────────────────

  it('hides pagination controls when there is only one page', () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.queryByRole('button', { name: /go to next page/i })).not.toBeInTheDocument();
  });

  it('shows pagination controls when there are multiple pages', () => {
    (useContractsPaged as jest.Mock).mockReturnValue({
      data: makePageResponse([activeContract, expiredContract], 3),
      isLoading: false,
      isError: false,
    });

    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByRole('button', { name: /go to next page/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go to previous page/i })).toBeInTheDocument();
    // On page 1, Prev should be disabled; Next should be enabled
    expect(screen.getByRole('button', { name: /go to previous page/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /go to next page/i })).not.toBeDisabled();
  });

  it('disables Next button on the last page', async () => {
    (useContractsPaged as jest.Mock).mockReturnValue({
      data: { ...makePageResponse([activeContract], 2), totalElements: 20 },
      isLoading: false,
      isError: false,
    });

    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    // Click Next to go to page 2 (last page since totalPages = 2)
    await userEvent.click(screen.getByRole('button', { name: /go to next page/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /go to next page/i })).toBeDisabled();
    });
  });

  it('confirms delete and shows success toast', async () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /delete/i }));
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Contract deleted successfully!');
    });
  });

  it('shows error toast when delete fails', async () => {
    (contractsService.delete as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /delete/i }));
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to delete contract');
    });
  });

  it('changes rows per page and resets to first page', async () => {
    (useContractsPaged as jest.Mock).mockReturnValue({
      data: makePageResponse([activeContract, expiredContract], 3),
      isLoading: false,
      isError: false,
    });

    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    await userEvent.selectOptions(screen.getByLabelText(/rows per page/i), '25');

    expect(screen.getByDisplayValue('25')).toBeInTheDocument();
  });

  it('navigates to page 1 when page 1 button is clicked', async () => {
    (useContractsPaged as jest.Mock).mockReturnValue({
      data: { ...makePageResponse([activeContract], 3), totalElements: 30 },
      isLoading: false,
      isError: false,
    });

    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    // Go to page 2 first
    await userEvent.click(screen.getByRole('button', { name: /go to next page/i }));
    // Then click page 1
    await userEvent.click(screen.getByRole('button', { name: /go to page 1/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /go to previous page/i })).toBeDisabled();
    });
  });

  it('navigates to previous page when previous page button is clicked', async () => {
    (useContractsPaged as jest.Mock).mockReturnValue({
      data: { ...makePageResponse([activeContract], 3), totalElements: 30 },
      isLoading: false,
      isError: false,
    });

    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    await userEvent.click(screen.getByRole('button', { name: /go to next page/i }));
    await userEvent.click(screen.getByRole('button', { name: /go to previous page/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /go to previous page/i })).toBeDisabled();
    });
  });

  it('navigates to last page when last page button is clicked', async () => {
    (useContractsPaged as jest.Mock).mockReturnValue({
      data: { ...makePageResponse([activeContract], 3), totalElements: 30 },
      isLoading: false,
      isError: false,
    });

    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    // totalPages=3, so click "Go to page 3"
    await userEvent.click(screen.getByRole('button', { name: /go to page 3/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /go to next page/i })).toBeDisabled();
    });
  });
});
