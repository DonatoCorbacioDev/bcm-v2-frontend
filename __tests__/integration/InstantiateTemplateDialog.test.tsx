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

jest.mock('@/hooks/useCounterparties', () => ({
  useCounterparties: jest.fn(),
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
import { useCounterparties } from '@/hooks/useCounterparties';
import { useAuthStore } from '@/store/authStore';
import InstantiateTemplateDialog from '@/components/contract-templates/InstantiateTemplateDialog';

const baseTemplate = { id: 3, name: 'NDA Standard', autoRenew: false } as never;
const fullTemplate = {
  id: 4,
  name: 'Full Template',
  autoRenew: true,
  defaultStatus: 'ACTIVE',
  defaultDurationDays: 60,
  businessAreaId: 1,
  defaultManagerId: 1,
} as never;
const onOpenChange = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useBusinessAreas as jest.Mock).mockReturnValue({ data: [{ id: 1, name: 'Eng', description: '' }], isLoading: false, isError: false });
  (useManagers as jest.Mock).mockReturnValue({ data: [{ id: 1, firstName: 'Marco', lastName: 'Rossi' }], isLoading: false, isError: false });
  (useCounterparties as jest.Mock).mockReturnValue({ data: [{ id: 1, name: 'Acme Corp', type: 'CUSTOMER' }], isLoading: false, isError: false });
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

// The counterparty field is a Radix Select (bound to an ID, not free text),
// so picking a value means opening it and clicking the option -- fireEvent
// can't type into it directly the way it can the plain text inputs below.
// Plain fireEvent.click (not userEvent.click) is required here: this Select
// lives inside an open Radix Dialog, and userEvent's realistic pointer/focus
// emulation makes the Dialog's and the Select's focus-scopes fight over
// focus in a loop under jsdom (RangeError: Maximum call stack size
// exceeded). fireEvent.click skips that focus emulation entirely.
async function selectCounterparty(name = 'Acme Corp') {
  fireEvent.click(screen.getByRole('combobox', { name: /controparte/i }));
  fireEvent.click(await screen.findByRole('option', { name }));
}

async function fillAndSubmit() {
  await selectCounterparty();
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

  it('renders without a template (template=null)', () => {
    render(
      <InstantiateTemplateDialog template={null} open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/area di business/i)).toBeInTheDocument();
  });

  it('shows the default duration hint and pre-fills overrides for a fully populated template', () => {
    render(
      <InstantiateTemplateDialog template={fullTemplate} open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByText(/durata predefinita 60 giorni/i)).toBeInTheDocument();
    expect(screen.getByText(/calcolata se vuota/i)).toBeInTheDocument();
    expect(screen.getAllByText('Eng').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Marco Rossi').length).toBeGreaterThan(0);
  });

  it('shows validation errors for counterpartyId and startDate when submitted empty', async () => {
    render(
      <InstantiateTemplateDialog template={baseTemplate} open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    );
    const form = document.querySelector('form');
    fireEvent.submit(form!);
    expect(await screen.findByText(/la controparte è obbligatoria/i)).toBeInTheDocument();
    expect(screen.getByText(/la data di inizio è obbligatoria/i)).toBeInTheDocument();
    expect(mockInstantiate).not.toHaveBeenCalled();
  });

  it('shows counterparty select and contractNumber input', () => {
    render(
      <InstantiateTemplateDialog template={baseTemplate} open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByRole('combobox', { name: /controparte/i })).toBeInTheDocument();
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
    const contract = { id: 99, counterparty: { id: 1, name: 'Acme Corp', type: 'CUSTOMER' } };
    mockInstantiate.mockResolvedValueOnce(contract);
    render(
      <InstantiateTemplateDialog template={baseTemplate} open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    );
    await fillAndSubmit();
    await waitFor(() =>
      expect(mockInstantiate).toHaveBeenCalledWith(
        3,
        expect.objectContaining({ counterpartyId: 1, contractNumber: 'CTR-2024-001', startDate: '2024-01-01' })
      )
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Contratto creato', expect.any(Object))
    );
  });

  it('navigates to the new contract when the success toast action is clicked', async () => {
    const contract = { id: 99, counterparty: { id: 1, name: 'Acme Corp', type: 'CUSTOMER' } };
    mockInstantiate.mockResolvedValueOnce(contract);
    render(
      <InstantiateTemplateDialog template={baseTemplate} open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    );
    await fillAndSubmit();
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
    await fillAndSubmit();
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Creazione del contratto non riuscita')
    );
  });

  it('shows a blocking banner and disables submit when the template has no default area and none exist', () => {
    (useBusinessAreas as jest.Mock).mockReturnValue({ data: [], isLoading: false, isError: false, isSuccess: true });
    render(
      <InstantiateTemplateDialog template={baseTemplate} open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/serve prima crearne una|contatta un amministratore/i);
    expect(screen.getByRole('button', { name: /crea contratto/i })).toBeDisabled();
  });

  it('shows the admin-specific banner message and action link when the caller is an ADMIN', () => {
    useAuthStore.setState({
      user: { id: 1, username: 'admin', managerId: 0, role: 'ADMIN', roleId: 1, verified: true, createdAt: '' },
    });
    (useBusinessAreas as jest.Mock).mockReturnValue({ data: [], isLoading: false, isError: false, isSuccess: true });
    try {
      render(
        <InstantiateTemplateDialog template={baseTemplate} open={true} onOpenChange={onOpenChange} />,
        { wrapper: createWrapper() }
      );
      expect(screen.getByRole('alert')).toHaveTextContent(/serve prima crearne una/i);
      expect(screen.getByRole('link', { name: /crea un'area di business/i })).toBeInTheDocument();
    } finally {
      useAuthStore.setState({ user: null });
    }
  });

  it('does NOT show the banner when the template already has a default area, even if none exist org-wide', () => {
    (useBusinessAreas as jest.Mock).mockReturnValue({ data: [], isLoading: false, isError: false, isSuccess: true });
    render(
      <InstantiateTemplateDialog template={fullTemplate} open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crea contratto/i })).not.toBeDisabled();
  });

  it('shows validation error when contractNumber has lowercase', async () => {
    render(
      <InstantiateTemplateDialog template={baseTemplate} open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    );
    await selectCounterparty();
    fireEvent.change(screen.getByPlaceholderText('es. CTR-2026-001'), { target: { value: 'ctr-001' } });
    const startDate = screen.queryByTestId('inst-startDate');
    if (startDate) fireEvent.change(startDate, { target: { value: '2024-01-01' } });
    const form = document.querySelector('form');
    if (form) fireEvent.submit(form);
    expect(await screen.findByText(/solo lettere maiuscole/i)).toBeInTheDocument();
    expect(mockInstantiate).not.toHaveBeenCalled();
  });
});
