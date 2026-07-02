import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createWrapper } from '../mocks/wrapper';

// ─── Module mocks ────────────────────────────────────────────────────────────

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));

const mockInstantiate = jest.fn();
jest.mock('@/services/contractTemplates.service', () => ({
  contractTemplatesService: { instantiate: mockInstantiate },
}));

jest.mock('@/hooks/queries/contracts.queryKeys', () => ({
  contractsQueryKeys: { list: () => ['contracts'] },
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

// Mock useMutation to call mutationFn + callbacks synchronously in tests.
// React Query's internal state machine can silently swallow errors in JSDOM;
// this bypass ensures mutationFn and onSuccess/onError are always exercised.
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useMutation: (options: {
      mutationFn: (args: unknown) => Promise<unknown>;
      onSuccess?: (data: unknown, vars: unknown, ctx: undefined) => Promise<void> | void;
      onError?: (err: unknown, vars: unknown, ctx: undefined) => void;
    }) => ({
      mutateAsync: async (args: unknown) => {
        try {
          const result = await options.mutationFn(args);
          await options.onSuccess?.(result, args, undefined);
          return result;
        } catch (err) {
          options.onError?.(err, args, undefined);
          // Don't re-throw — real React Query swallows rejections via onError
        }
      },
      isPending: false,
      mutate: jest.fn(),
      isError: false,
      isSuccess: false,
      data: undefined,
      error: null,
    }),
  };
});

// ─── Imports after mocks ─────────────────────────────────────────────────────

import { toast } from 'sonner';
import { useBusinessAreas } from '@/hooks/useBusinessAreas';
import { useManagers } from '@/hooks/useManagers';
import InstantiateTemplateDialog from '@/components/contract-templates/InstantiateTemplateDialog';

const baseTemplate = { id: 3, name: 'NDA Standard', autoRenew: false } as never;
const onOpenChange = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useBusinessAreas as jest.Mock).mockReturnValue({ data: [{ id: 1, name: 'Eng', description: '' }], isLoading: false, isError: false });
  (useManagers as jest.Mock).mockReturnValue({ data: [{ id: 1, firstName: 'Marco', lastName: 'Rossi' }], isLoading: false, isError: false });
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fillAndSubmit() {
  fireEvent.change(screen.getByPlaceholderText('Inserisci il nome del cliente'), { target: { value: 'Acme Corp' } });
  fireEvent.change(screen.getByPlaceholderText('es. CTR-2026-001'), { target: { value: 'CTR-2024-001' } });
  const startDate = screen.queryByTestId('inst-startDate');
  if (startDate) fireEvent.change(startDate, { target: { value: '2024-01-01' } });
  const form = document.querySelector('form');
  if (form) fireEvent.submit(form);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('InstantiateTemplateDialog', () => {
  it('renders the dialog when open=true', () => {
    render(
      <InstantiateTemplateDialog template={baseTemplate} open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/crea contratto da template/i)).toBeInTheDocument();
  });

  it('does not render dialog content when open=false', () => {
    render(
      <InstantiateTemplateDialog template={baseTemplate} open={false} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the template name in the description', () => {
    render(
      <InstantiateTemplateDialog template={baseTemplate} open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByText('NDA Standard')).toBeInTheDocument();
  });

  it('shows customerName and contractNumber inputs', () => {
    render(
      <InstantiateTemplateDialog template={baseTemplate} open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByPlaceholderText('Inserisci il nome del cliente')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('es. CTR-2026-001')).toBeInTheDocument();
  });

  it('calls onOpenChange(false) when Annulla is clicked', async () => {
    render(
      <InstantiateTemplateDialog template={baseTemplate} open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    );
    await userEvent.click(screen.getByRole('button', { name: /annulla/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('submits the form and shows success toast', async () => {
    const contract = { id: 99, customerName: 'Acme' };
    mockInstantiate.mockResolvedValueOnce(contract);
    render(
      <InstantiateTemplateDialog template={baseTemplate} open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    );
    fillAndSubmit();
    await waitFor(() =>
      expect(mockInstantiate).toHaveBeenCalledWith(
        3,
        expect.objectContaining({ customerName: 'Acme Corp', contractNumber: 'CTR-2024-001', startDate: '2024-01-01' })
      )
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Contratto creato con successo!', expect.any(Object))
    );
  });

  it('navigates to the new contract when the success toast action is clicked', async () => {
    const contract = { id: 99, customerName: 'Acme' };
    mockInstantiate.mockResolvedValueOnce(contract);
    render(
      <InstantiateTemplateDialog template={baseTemplate} open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    );
    fillAndSubmit();
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    const [, options] = (toast.success as jest.Mock).mock.calls[0];
    options.action.onClick();
    expect(mockPush).toHaveBeenCalledWith('/contracts/99');
  });

  it('shows error toast when instantiate fails', async () => {
    mockInstantiate.mockRejectedValueOnce(new Error('fail'));
    render(
      <InstantiateTemplateDialog template={baseTemplate} open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    );
    fillAndSubmit();
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Creazione del contratto non riuscita')
    );
  });

  it('shows validation error when contractNumber has lowercase', async () => {
    render(
      <InstantiateTemplateDialog template={baseTemplate} open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    );
    fireEvent.change(screen.getByPlaceholderText('Inserisci il nome del cliente'), { target: { value: 'Acme' } });
    fireEvent.change(screen.getByPlaceholderText('es. CTR-2026-001'), { target: { value: 'ctr-001' } });
    const startDate = screen.queryByTestId('inst-startDate');
    if (startDate) fireEvent.change(startDate, { target: { value: '2024-01-01' } });
    const form = document.querySelector('form');
    if (form) fireEvent.submit(form);
    await waitFor(() => expect(screen.getByText(/solo lettere maiuscole/i)).toBeInTheDocument());
    expect(mockInstantiate).not.toHaveBeenCalled();
  });
});
