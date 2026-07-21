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

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

// ─── Imports that reference mocked modules ───────────────────────────────────

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useContractsPaged } from '@/hooks/useContractsPaged';
import { contractsService } from '@/services/contracts.service';
import { useAuthStore } from '@/store/authStore';

const mockAuthAs = (role: string) => {
  (useAuthStore as unknown as jest.Mock).mockImplementation((selector) => {
    const state = { user: { id: 1, username: 'user', role }, isAuthenticated: true };
    return selector ? selector(state) : state;
  });
};

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
    localStorage.clear();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
    });
    // Default: ADMIN user, two contracts, one page, loaded
    mockAuthAs('ADMIN');
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

    expect(screen.getByText(/impossibile caricare i contratti/i)).toBeInTheDocument();
  });

  it('shows empty state with a create prompt when no contracts exist', () => {
    (useContractsPaged as jest.Mock).mockReturnValue({
      data: makePageResponse([]),
      isLoading: false,
      isError: false,
    });

    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByText(/nessun contratto trovato/i)).toBeInTheDocument();
    expect(screen.getByText(/crea il tuo primo contratto/i)).toBeInTheDocument();
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

    const searchInput = screen.getByPlaceholderText(/cerca contratti/i);
    await userEvent.type(searchInput, 'xyz-no-match');

    expect(screen.getByText(/modifica i criteri di ricerca/i)).toBeInTheDocument();
  });

  // ── Data rendering ────────────────────────────────────────────────────────

  it('renders contract rows with number, customer name and status', () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByText('CNT-001')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Attivo')).toBeInTheDocument();

    expect(screen.getByText('CNT-002')).toBeInTheDocument();
    expect(screen.getByText('Beta Ltd')).toBeInTheDocument();
    expect(screen.getByText('Scaduto')).toBeInTheDocument();
  });

  it('falls back to the raw status value when it is not a known status', () => {
    const unknownStatusContract = { ...activeContract, status: 'ON_HOLD' as Contract['status'] };
    (useContractsPaged as jest.Mock).mockReturnValue({
      data: makePageResponse([unknownStatusContract]),
      isLoading: false,
      isError: false,
    });
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    expect(screen.getByText('ON_HOLD')).toBeInTheDocument();
  });

  it('shows total contract count in the toolbar', () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByText(/2 contratti/i)).toBeInTheDocument();
  });

  it('shows singular "contract" when there is exactly one', () => {
    (useContractsPaged as jest.Mock).mockReturnValue({
      data: makePageResponse([activeContract]),
      isLoading: false,
      isError: false,
    });

    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByText('1 contratto')).toBeInTheDocument();
  });

  // ── Actions ───────────────────────────────────────────────────────────────

  it('navigates to the contract detail page when View is clicked', async () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    const viewButton = within(rows[1]).getByRole('button', { name: /visualizza/i });
    await userEvent.click(viewButton);

    expect(mockPush).toHaveBeenCalledWith('/contracts/1');
  });

  it('calls onEditClick with the correct contract when Edit is clicked', async () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    const editButton = within(rows[1]).getByRole('button', { name: /modifica/i });
    await userEvent.click(editButton);

    expect(onEditClick).toHaveBeenCalledTimes(1);
    expect(onEditClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, contractNumber: 'CNT-001' })
    );
  });

  it('opens the delete confirmation dialog when Delete is clicked', async () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    const deleteButton = within(rows[1]).getByRole('button', { name: /elimina/i });
    await userEvent.click(deleteButton);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/sei sicuro/i)).toBeInTheDocument();
    expect(within(dialog).getByText('CNT-001')).toBeInTheDocument();
  });

  it('closes the delete dialog when Cancel is clicked', async () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /elimina/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /annulla/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  // ── Filters ───────────────────────────────────────────────────────────────

  it('renders the status filter select with all options', async () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const trigger = screen.getByRole('combobox', { name: /filtra per stato/i });
    expect(trigger).toHaveTextContent('Tutti');

    await userEvent.click(trigger);
    expect(await screen.findByRole('option', { name: /attivo/i })).toBeInTheDocument();
  });

  it('shows the Clear button when status filter is active', async () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    // Initially no Clear button
    expect(screen.queryByRole('button', { name: /pulisci/i })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('combobox', { name: /filtra per stato/i }));
    await userEvent.click(await screen.findByRole('option', { name: /^attivo$/i }));

    expect(screen.getByRole('button', { name: /pulisci/i })).toBeInTheDocument();
  });

  it('hides the Clear button after filters are reset', async () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    await userEvent.click(screen.getByRole('combobox', { name: /filtra per stato/i }));
    await userEvent.click(await screen.findByRole('option', { name: /^attivo$/i }));
    expect(screen.getByRole('button', { name: /pulisci/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /pulisci/i }));
    expect(screen.queryByRole('button', { name: /pulisci/i })).not.toBeInTheDocument();
  });

  // ── Role-based visibility ─────────────────────────────────────────────────

  it('shows Edit and Delete buttons for ADMIN', () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    const rows = screen.getAllByRole('row');
    expect(within(rows[1]).getByRole('button', { name: /modifica/i })).toBeInTheDocument();
    expect(within(rows[1]).getByRole('button', { name: /elimina/i })).toBeInTheDocument();
  });

  it('hides Edit and Delete buttons when user is not yet loaded', () => {
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = { user: null, isAuthenticated: false };
      return selector ? selector(state) : state;
    });
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    const rows = screen.getAllByRole('row');
    expect(within(rows[1]).queryByRole('button', { name: /modifica/i })).not.toBeInTheDocument();
    expect(within(rows[1]).queryByRole('button', { name: /elimina/i })).not.toBeInTheDocument();
  });

  it('hides Edit and Delete buttons for MANAGER', () => {
    mockAuthAs('MANAGER');
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    const rows = screen.getAllByRole('row');
    expect(within(rows[1]).queryByRole('button', { name: /modifica/i })).not.toBeInTheDocument();
    expect(within(rows[1]).queryByRole('button', { name: /elimina/i })).not.toBeInTheDocument();
    expect(within(rows[1]).getByRole('button', { name: /visualizza/i })).toBeInTheDocument();
  });

  // ── Pagination ────────────────────────────────────────────────────────────

  it('hides pagination controls when there is only one page', () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.queryByRole('button', { name: /pagina successiva/i })).not.toBeInTheDocument();
  });

  it('shows pagination controls when there are multiple pages', () => {
    (useContractsPaged as jest.Mock).mockReturnValue({
      data: makePageResponse([activeContract, expiredContract], 3),
      isLoading: false,
      isError: false,
    });

    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByRole('button', { name: /pagina successiva/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pagina precedente/i })).toBeInTheDocument();
    // On page 1, Prev should be disabled; Next should be enabled
    expect(screen.getByRole('button', { name: /pagina precedente/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /pagina successiva/i })).not.toBeDisabled();
  });

  it('disables Next button on the last page', async () => {
    (useContractsPaged as jest.Mock).mockReturnValue({
      data: { ...makePageResponse([activeContract], 2), totalElements: 20 },
      isLoading: false,
      isError: false,
    });

    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    // Click Next to go to page 2 (last page since totalPages = 2)
    await userEvent.click(screen.getByRole('button', { name: /pagina successiva/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pagina successiva/i })).toBeDisabled();
    });
  });

  it('confirms delete and shows success toast', async () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /elimina/i }));
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /^elimina$/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Contratto eliminato con successo!');
    });
  });

  it('shows error toast when delete fails', async () => {
    (contractsService.delete as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /elimina/i }));
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /^elimina$/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Eliminazione del contratto non riuscita');
    });
  });

  // ── Numbered pagination — ellipsis branches ──────────────────────────────

  it('shows near-start ellipsis pattern for large page counts', async () => {
    (useContractsPaged as jest.Mock).mockReturnValue({
      data: { ...makePageResponse([activeContract], 10), totalElements: 100 },
      isLoading: false,
      isError: false,
    });

    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    // page=0, total=10 → [0,1,2,3,4,"ellipsis-end",9] → pages 1–5 and 10 visible
    expect(screen.getByRole('button', { name: 'Vai a pagina 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Vai a pagina 5' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Vai a pagina 10' })).toBeInTheDocument();
    expect(screen.getByText('…')).toBeInTheDocument();
  });

  it('shows middle double-ellipsis pattern when on a middle page', async () => {
    (useContractsPaged as jest.Mock).mockReturnValue({
      data: { ...makePageResponse([activeContract], 10), totalElements: 100 },
      isLoading: false,
      isError: false,
    });

    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    // Click page 5 (index 4) → current=4 → middle: [0,"…",3,4,5,"…",9]
    await userEvent.click(screen.getByRole('button', { name: 'Vai a pagina 5' }));

    await waitFor(() => {
      expect(screen.getAllByText('…')).toHaveLength(2);
      expect(screen.getByRole('button', { name: 'Vai a pagina 4' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Vai a pagina 6' })).toBeInTheDocument();
    });
  });

  it('shows near-end ellipsis pattern when on the last pages', async () => {
    (useContractsPaged as jest.Mock).mockReturnValue({
      data: { ...makePageResponse([activeContract], 10), totalElements: 100 },
      isLoading: false,
      isError: false,
    });

    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    // Click page 10 (index 9) → current=9 → near-end: [0,"…",5,6,7,8,9]
    await userEvent.click(screen.getByRole('button', { name: 'Vai a pagina 10' }));

    await waitFor(() => {
      expect(screen.getByText('…')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Vai a pagina 7' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /pagina successiva/i })).toBeDisabled();
    });
  });

  it('changes righe per pagina and resets to first page', async () => {
    (useContractsPaged as jest.Mock).mockReturnValue({
      data: makePageResponse([activeContract, expiredContract], 3),
      isLoading: false,
      isError: false,
    });

    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    await userEvent.click(screen.getByRole('combobox', { name: /righe per pagina/i }));
    await userEvent.click(await screen.findByRole('option', { name: '25' }));

    expect(screen.getByRole('combobox', { name: /righe per pagina/i })).toHaveTextContent('25');
  });

  it('navigates to page 1 when page 1 button is clicked', async () => {
    (useContractsPaged as jest.Mock).mockReturnValue({
      data: { ...makePageResponse([activeContract], 3), totalElements: 30 },
      isLoading: false,
      isError: false,
    });

    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    // Go to page 2 first
    await userEvent.click(screen.getByRole('button', { name: /pagina successiva/i }));
    // Then click page 1
    await userEvent.click(screen.getByRole('button', { name: /vai a pagina 1/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pagina precedente/i })).toBeDisabled();
    });
  });

  it('navigates to previous page when previous page button is clicked', async () => {
    (useContractsPaged as jest.Mock).mockReturnValue({
      data: { ...makePageResponse([activeContract], 3), totalElements: 30 },
      isLoading: false,
      isError: false,
    });

    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    await userEvent.click(screen.getByRole('button', { name: /pagina successiva/i }));
    await userEvent.click(screen.getByRole('button', { name: /pagina precedente/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pagina precedente/i })).toBeDisabled();
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
    await userEvent.click(screen.getByRole('button', { name: /vai a pagina 3/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pagina successiva/i })).toBeDisabled();
    });
  });

  // ── Sorting (client-side, current page only) ─────────────────────────────

  it('sorts ascending then descending when a column header is clicked twice', async () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const getCustomerOrder = () =>
      screen.getAllByRole('row').slice(1).map((row) => within(row).getByText(/corp|ltd/i).textContent);

    const header = screen.getByRole('button', { name: /cliente/i });
    await userEvent.click(header);
    expect(getCustomerOrder()).toEqual(['Acme Corp', 'Beta Ltd']);
    expect(header.closest('th')).toHaveAttribute('aria-sort', 'ascending');

    await userEvent.click(header);
    expect(getCustomerOrder()).toEqual(['Beta Ltd', 'Acme Corp']);
    expect(header.closest('th')).toHaveAttribute('aria-sort', 'descending');

    await userEvent.click(header);
    expect(getCustomerOrder()).toEqual(['Acme Corp', 'Beta Ltd']);
    expect(header.closest('th')).toHaveAttribute('aria-sort', 'ascending');
  });

  it('resets to ascending when switching to a different column', async () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const customerHeader = screen.getByRole('button', { name: /cliente/i });
    await userEvent.click(customerHeader);
    await userEvent.click(customerHeader);
    expect(customerHeader.closest('th')).toHaveAttribute('aria-sort', 'descending');

    const numberHeader = screen.getByRole('button', { name: /^numero/i });
    await userEvent.click(numberHeader);
    expect(numberHeader.closest('th')).toHaveAttribute('aria-sort', 'ascending');
    expect(customerHeader.closest('th')).toHaveAttribute('aria-sort', 'none');
  });

  // ── Bulk actions ───────────────────────────────────────────────────────────

  it('does not show row checkboxes for non-admin users', () => {
    mockAuthAs('MANAGER');
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('shows the bulk action bar with a count when rows are selected', async () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('checkbox'));

    expect(screen.getByText('1 contratto selezionato')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /elimina selezionati/i })).toBeInTheDocument();
  });

  it('selects and deselects all rows with the header checkbox', async () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const headerCheckbox = screen.getByRole('checkbox', { name: /seleziona tutti/i });
    await userEvent.click(headerCheckbox);
    expect(screen.getByText('2 contratti selezionati')).toBeInTheDocument();

    await userEvent.click(headerCheckbox);
    expect(screen.queryByText(/selezionat/i)).not.toBeInTheDocument();
  });

  it('bulk-deletes selected contracts and shows a success toast', async () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('checkbox'));
    await userEvent.click(within(rows[2]).getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: /elimina selezionati/i }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('2')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: /^elimina$/i }));

    await waitFor(() => {
      expect(contractsService.delete).toHaveBeenCalledWith(1);
      expect(contractsService.delete).toHaveBeenCalledWith(2);
      expect(toast.success).toHaveBeenCalledWith('2 contratti eliminati con successo!');
    });
  });

  it('reports partial failure when some bulk deletes fail', async () => {
    (contractsService.delete as jest.Mock)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('fail'));

    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('checkbox'));
    await userEvent.click(within(rows[2]).getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: /elimina selezionati/i }));

    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /^elimina$/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('1 eliminati, 1 non riusciti');
    });
  });

  it('uses singular wording when bulk-deleting exactly one contract', async () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: /elimina selezionati/i }));

    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /^elimina$/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('1 contratto eliminato con successo!');
    });
  });

  it('reports total failure when every bulk delete fails', async () => {
    (contractsService.delete as jest.Mock).mockRejectedValue(new Error('fail'));

    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('checkbox'));
    await userEvent.click(within(rows[2]).getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: /elimina selezionati/i }));

    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /^elimina$/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Eliminazione dei contratti selezionati non riuscita');
    });
  });

  it('cancels the bulk delete dialog without deleting anything', async () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: /elimina selezionati/i }));

    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /^annulla$/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(contractsService.delete).not.toHaveBeenCalled();
    expect(screen.getByText('1 contratto selezionato')).toBeInTheDocument();
  });

  it('deselects a single row without affecting the others', async () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('checkbox'));
    await userEvent.click(within(rows[2]).getByRole('checkbox'));
    expect(screen.getByText('2 contratti selezionati')).toBeInTheDocument();

    await userEvent.click(within(rows[1]).getByRole('checkbox'));
    expect(screen.getByText('1 contratto selezionato')).toBeInTheDocument();
  });

  it('clears the selection when filters change', async () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('checkbox'));
    expect(screen.getByText('1 contratto selezionato')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('combobox', { name: /filtra per stato/i }));
    await userEvent.click(await screen.findByRole('option', { name: /^attivo$/i }));

    expect(screen.queryByText(/selezionat/i)).not.toBeInTheDocument();
  });

  // ── Saved views ───────────────────────────────────────────────────────────

  it('shows a placeholder when no views are saved', () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByText('Viste salvate')).toBeInTheDocument();
  });

  it('saves the current filters as a named view and persists it to localStorage', async () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    await userEvent.click(screen.getByRole('button', { name: /salva vista corrente/i }));
    const dialog = screen.getByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText(/nome vista/i), 'La mia vista');
    await userEvent.click(within(dialog).getByRole('button', { name: /^salva$/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(screen.getByText('La mia vista')).toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem('bcm-contract-views-1') ?? '[]');
    expect(stored).toEqual([
      expect.objectContaining({ name: 'La mia vista', statusFilter: 'ALL' }),
    ]);
  });

  it('disables the Save button until a name is entered', async () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    await userEvent.click(screen.getByRole('button', { name: /salva vista corrente/i }));
    const dialog = screen.getByRole('dialog');

    expect(within(dialog).getByRole('button', { name: /^salva$/i })).toBeDisabled();
    await userEvent.type(within(dialog).getByLabelText(/nome vista/i), 'X');
    expect(within(dialog).getByRole('button', { name: /^salva$/i })).not.toBeDisabled();
  });

  it('deletes the active saved view', async () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    await userEvent.click(screen.getByRole('button', { name: /salva vista corrente/i }));
    const dialog = screen.getByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText(/nome vista/i), 'Temporanea');
    await userEvent.click(within(dialog).getByRole('button', { name: /^salva$/i }));

    expect(screen.getByText('Temporanea')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /elimina vista corrente/i }));

    expect(screen.queryByText('Temporanea')).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('bcm-contract-views-1') ?? '[]')).toEqual([]);
  });

  it('loads previously saved views for the current user on mount (without dropping them on a new save)', async () => {
    localStorage.setItem(
      'bcm-contract-views-1',
      JSON.stringify([{ name: 'Esistente', searchQuery: '', statusFilter: 'ACTIVE', pageSize: 10, sortKey: null, sortDirection: 'asc' }])
    );

    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    await userEvent.click(screen.getByRole('button', { name: /salva vista corrente/i }));
    const dialog = screen.getByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText(/nome vista/i), 'Nuova');
    await userEvent.click(within(dialog).getByRole('button', { name: /^salva$/i }));

    const stored = JSON.parse(localStorage.getItem('bcm-contract-views-1') ?? '[]');
    expect(stored.map((v: { name: string }) => v.name)).toEqual(['Esistente', 'Nuova']);
  });

  it('does not load saved views belonging to a different user', () => {
    localStorage.setItem(
      'bcm-contract-views-2',
      JSON.stringify([{ name: 'Di un altro utente', searchQuery: '', statusFilter: 'ALL', pageSize: 10, sortKey: null, sortDirection: 'asc' }])
    );

    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.queryByText('Di un altro utente')).not.toBeInTheDocument();
  });

  it('shows a corrupt saved-views entry as an empty list instead of crashing', () => {
    localStorage.setItem('bcm-contract-views-1', '{not valid json');

    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByText('Viste salvate')).toBeInTheDocument();
  });

  it('cancels the save-view dialog without persisting anything', async () => {
    render(<ContractTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    await userEvent.click(screen.getByRole('button', { name: /salva vista corrente/i }));
    const dialog = screen.getByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText(/nome vista/i), 'Mai salvata');
    await userEvent.click(within(dialog).getByRole('button', { name: /^annulla$/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(screen.queryByText('Mai salvata')).not.toBeInTheDocument();
    expect(localStorage.getItem('bcm-contract-views-1')).toBeNull();
  });
});
