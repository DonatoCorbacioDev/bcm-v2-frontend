import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createWrapper } from '../mocks/wrapper';

// ─── Module mocks ────────────────────────────────────────────────────────────

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const mockMutateAsync = jest.fn();
jest.mock('@/hooks/useUpsertContractTemplate', () => ({
  useUpsertContractTemplate: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}));

jest.mock('@/hooks/useBusinessAreas', () => ({
  useBusinessAreas: jest.fn(),
}));

jest.mock('@/hooks/useManagers', () => ({
  useManagers: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    defaults: { headers: { common: {} } },
  },
}));

// ─── Imports after mocks ─────────────────────────────────────────────────────

import { toast } from 'sonner';
import { useBusinessAreas } from '@/hooks/useBusinessAreas';
import { useManagers } from '@/hooks/useManagers';
import ContractTemplateForm from '@/components/contract-templates/ContractTemplateForm';

const onClose = jest.fn();
const defaultBA = { data: [], isLoading: false, isError: false };
const defaultMgr = { data: [], isLoading: false, isError: false };

beforeEach(() => {
  jest.clearAllMocks();
  (useBusinessAreas as jest.Mock).mockReturnValue(defaultBA);
  (useManagers as jest.Mock).mockReturnValue(defaultMgr);
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fillAndSubmit(container: HTMLElement, name: string) {
  fireEvent.change(screen.getByPlaceholderText('es. NDA Standard'), { target: { value: name } });
  // Number inputs produce NaN when empty (valueAsNumber: true); provide valid values to pass Zod
  const durationInput = screen.queryByPlaceholderText('es. 365');
  if (durationInput) fireEvent.change(durationInput, { target: { value: '365' } });
  const notifInput = screen.queryByPlaceholderText('es. 30');
  if (notifInput) fireEvent.change(notifInput, { target: { value: '30' } });
  fireEvent.submit(container.querySelector('form')!);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ContractTemplateForm', () => {
  it('renders the form in create mode', () => {
    render(<ContractTemplateForm onClose={onClose} />, { wrapper: createWrapper() });
    expect(screen.getByPlaceholderText('es. NDA Standard')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crea template/i })).toBeInTheDocument();
  });

  it('shows loading state when reference data is loading', () => {
    (useBusinessAreas as jest.Mock).mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<ContractTemplateForm onClose={onClose} />, { wrapper: createWrapper() });
    expect(screen.getByText(/caricamento dati del form/i)).toBeInTheDocument();
  });

  it('shows error state when reference data fails', () => {
    (useBusinessAreas as jest.Mock).mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<ContractTemplateForm onClose={onClose} />, { wrapper: createWrapper() });
    expect(screen.getByText(/impossibile caricare aree di business/i)).toBeInTheDocument();
  });

  it('pre-fills name when editing an existing template', () => {
    const template = { id: 5, name: 'NDA Standard', autoRenew: true, description: 'desc' } as never;
    render(<ContractTemplateForm onClose={onClose} template={template} />, { wrapper: createWrapper() });
    expect((screen.getByPlaceholderText('es. NDA Standard') as HTMLInputElement).value).toBe('NDA Standard');
    expect(screen.getByRole('button', { name: /aggiorna template/i })).toBeInTheDocument();
  });

  it('calls create mutation on submit and shows success toast', async () => {
    mockMutateAsync.mockResolvedValueOnce({ id: 1 });
    const { container } = render(<ContractTemplateForm onClose={onClose} />, { wrapper: createWrapper() });
    fillAndSubmit(container, 'Nuovo Template');
    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled());
    const callArg = mockMutateAsync.mock.calls[0][0];
    expect(callArg.mode).toBe('create');
    expect(callArg.payload.name).toBe('Nuovo Template');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Template creato con successo!'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('calls update mutation when editing an existing template', async () => {
    const template = { id: 5, name: 'Old Name', autoRenew: false } as never;
    mockMutateAsync.mockResolvedValueOnce({ id: 5 });
    const { container } = render(<ContractTemplateForm onClose={onClose} template={template} />, { wrapper: createWrapper() });
    fillAndSubmit(container, 'Updated Name');
    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled());
    const callArg = mockMutateAsync.mock.calls[0][0];
    expect(callArg.mode).toBe('update');
    expect(callArg.id).toBe(5);
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Template aggiornato con successo!'));
  });

  it('shows validation error when name is too short', async () => {
    const { container } = render(<ContractTemplateForm onClose={onClose} />, { wrapper: createWrapper() });
    fillAndSubmit(container, 'A');
    await waitFor(() =>
      expect(screen.getByText(/almeno 2 caratteri/i)).toBeInTheDocument()
    );
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('shows error toast when mutation throws', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('API error'));
    const { container } = render(<ContractTemplateForm onClose={onClose} />, { wrapper: createWrapper() });
    fillAndSubmit(container, 'Valido Nome');
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Annulla is clicked', async () => {
    render(<ContractTemplateForm onClose={onClose} />, { wrapper: createWrapper() });
    await userEvent.click(screen.getByRole('button', { name: /annulla/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
