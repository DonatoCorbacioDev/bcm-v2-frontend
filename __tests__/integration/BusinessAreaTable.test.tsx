import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { BusinessArea } from '@/types';
import { createWrapper } from '../mocks/wrapper';

// ─── Module mocks ────────────────────────────────────────────────────────────

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/hooks/useBusinessAreas', () => ({
  useBusinessAreas: jest.fn(),
}));

jest.mock('@/services/businessAreas.service', () => ({
  businessAreasService: {
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
import { useBusinessAreas } from '@/hooks/useBusinessAreas';
import { businessAreasService } from '@/services/businessAreas.service';
import BusinessAreaTable from '@/components/business-areas/BusinessAreaTable';

// ─── Test fixtures ───────────────────────────────────────────────────────────

const area1: BusinessArea = {
  id: 1,
  name: 'Engineering',
  description: 'Software development and infrastructure',
};

const area2: BusinessArea = {
  id: 2,
  name: 'Sales',
  description: 'Customer acquisition and account management',
};

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('BusinessAreaTable', () => {
  const onEditClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useBusinessAreas as jest.Mock).mockReturnValue({
      data: [area1, area2],
      isLoading: false,
      isError: false,
    });
  });

  // ── States ────────────────────────────────────────────────────────────────

  it('shows skeleton while loading', () => {
    (useBusinessAreas as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(<BusinessAreaTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.queryByText('Engineering')).not.toBeInTheDocument();
  });

  it('shows error state when the API fails', () => {
    (useBusinessAreas as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(<BusinessAreaTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByText(/impossibile caricare le aree di business/i)).toBeInTheDocument();
  });

  it('shows empty state when no business areas exist', () => {
    (useBusinessAreas as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    render(<BusinessAreaTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByText(/nessuna area di business trovata/i)).toBeInTheDocument();
  });

  // ── Data rendering ────────────────────────────────────────────────────────

  it('renders business area rows with name', () => {
    render(<BusinessAreaTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
  });

  it('shows the area count', () => {
    render(<BusinessAreaTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByText(/2 \/ 2 aree/i)).toBeInTheDocument();
  });

  // ── Search ────────────────────────────────────────────────────────────────

  it('search input has an accessible label', () => {
    render(<BusinessAreaTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    expect(screen.getByRole('textbox', { name: /cerca aree di business/i })).toBeInTheDocument();
  });

  it('filters areas by name on search', async () => {
    render(<BusinessAreaTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    await userEvent.type(screen.getByRole('textbox', { name: /cerca aree di business/i }), 'Engineering');

    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.queryByText('Sales')).not.toBeInTheDocument();
  });

  it('shows "no business areas match" when search has no results', async () => {
    render(<BusinessAreaTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    await userEvent.type(screen.getByRole('textbox', { name: /cerca aree di business/i }), 'xyz-no-match');

    expect(screen.getByText(/nessuna area di business corrisponde alla ricerca/i)).toBeInTheDocument();
  });

  // ── Actions ───────────────────────────────────────────────────────────────

  it('calls onEditClick with the correct area when Edit is clicked', async () => {
    render(<BusinessAreaTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /modifica/i }));

    expect(onEditClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, name: 'Engineering' })
    );
  });

  it('opens the delete confirmation dialog when Delete is clicked', async () => {
    render(<BusinessAreaTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /elimina/i }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/sei sicuro/i)).toBeInTheDocument();
    expect(within(dialog).getByText('Engineering')).toBeInTheDocument();
  });

  it('closes the delete dialog when Cancel is clicked', async () => {
    render(<BusinessAreaTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /elimina/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /annulla/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('confirms delete and shows success toast', async () => {
    render(<BusinessAreaTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /elimina/i }));
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /^elimina$/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Area di business eliminata con successo!');
    });
  });

  it('shows error toast when delete fails', async () => {
    (businessAreasService.delete as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    render(<BusinessAreaTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    const rows = screen.getAllByRole('row');
    await userEvent.click(within(rows[1]).getByRole('button', { name: /elimina/i }));
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /^elimina$/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Eliminazione dell'area di business non riuscita");
    });
  });

  it('clears the search field when Clear is clicked', async () => {
    render(<BusinessAreaTable onEditClick={onEditClick} />, { wrapper: createWrapper() });

    await userEvent.type(screen.getByRole('textbox', { name: /cerca aree di business/i }), 'Eng');
    await userEvent.click(screen.getByRole('button', { name: /pulisci/i }));

    expect(screen.getByRole('textbox', { name: /cerca aree di business/i })).toHaveValue('');
  });
});
