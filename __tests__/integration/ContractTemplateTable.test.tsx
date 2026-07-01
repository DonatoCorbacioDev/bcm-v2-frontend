import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ContractTemplate } from '@/types';
import { createWrapper } from '../mocks/wrapper';

// ─── Module mocks ────────────────────────────────────────────────────────────

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

jest.mock('@/hooks/useContractTemplates', () => ({
  useContractTemplates: jest.fn(),
}));

jest.mock('@/services/contractTemplates.service', () => ({
  contractTemplatesService: { delete: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/components/contract-templates/InstantiateTemplateDialog', () => ({
  __esModule: true,
  default: () => null,
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
import { useContractTemplates } from '@/hooks/useContractTemplates';
import { contractTemplatesService } from '@/services/contractTemplates.service';
import { useAuthStore } from '@/store/authStore';
import ContractTemplateTable from '@/components/contract-templates/ContractTemplateTable';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const template1: ContractTemplate = {
  id: 1,
  name: 'NDA Standard',
  description: 'Accordo di riservatezza',
  defaultStatus: 'ACTIVE',
  defaultDurationDays: 365,
  autoRenew: false,
  notificationDays: 30,
  businessAreaId: null,
  defaultManagerId: null,
  createdAt: '2024-01-01T00:00:00Z',
};

const template2: ContractTemplate = {
  id: 2,
  name: 'Contratto di fornitura',
  description: null,
  defaultStatus: 'DRAFT',
  defaultDurationDays: null,
  autoRenew: true,
  notificationDays: null,
  businessAreaId: null,
  defaultManagerId: null,
  createdAt: '2024-01-01T00:00:00Z',
};

function setup(role = 'ADMIN', templates: ContractTemplate[] = [template1, template2]) {
  (useContractTemplates as jest.Mock).mockReturnValue({ data: templates, isLoading: false, isError: false });
  (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: { id: 1, username: 'admin', role } });
  return render(<ContractTemplateTable onEditClick={jest.fn()} />, { wrapper: createWrapper() });
}

beforeEach(() => jest.clearAllMocks());

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ContractTemplateTable', () => {
  it('shows a skeleton while loading', () => {
    (useContractTemplates as jest.Mock).mockReturnValue({ data: undefined, isLoading: true, isError: false });
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: null });
    const { container } = render(<ContractTemplateTable onEditClick={jest.fn()} />, { wrapper: createWrapper() });
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows an error message when loading fails', () => {
    (useContractTemplates as jest.Mock).mockReturnValue({ data: undefined, isLoading: false, isError: true });
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: null });
    render(<ContractTemplateTable onEditClick={jest.fn()} />, { wrapper: createWrapper() });
    expect(screen.getByText(/impossibile caricare i template/i)).toBeInTheDocument();
  });

  it('renders template names in the table', () => {
    setup();
    expect(screen.getByText('NDA Standard')).toBeInTheDocument();
    expect(screen.getByText('Contratto di fornitura')).toBeInTheDocument();
  });

  it('shows status badge for templates with a status', () => {
    setup();
    expect(screen.getByText('Attivo')).toBeInTheDocument();
    expect(screen.getByText('Bozza')).toBeInTheDocument();
  });

  it('shows the template count', () => {
    setup();
    expect(screen.getByText('2 template')).toBeInTheDocument();
  });

  it('filters templates by search input', async () => {
    setup();
    const input = screen.getByRole('textbox', { name: /cerca template/i });
    await userEvent.type(input, 'NDA');
    expect(screen.getByText('NDA Standard')).toBeInTheDocument();
    expect(screen.queryByText('Contratto di fornitura')).not.toBeInTheDocument();
    expect(screen.getByText('1 template')).toBeInTheDocument();
  });

  it('shows empty-state when no results match search', async () => {
    setup();
    await userEvent.type(screen.getByRole('textbox', { name: /cerca template/i }), 'zzz');
    expect(screen.getByText('Nessun template trovato')).toBeInTheDocument();
    expect(screen.getByText(/modifica i criteri di ricerca/i)).toBeInTheDocument();
  });

  it('shows admin empty message when list is empty', () => {
    setup('ADMIN', []);
    expect(screen.getByText(/crea il primo template per iniziare/i)).toBeInTheDocument();
  });

  it('shows manager empty message when list is empty', () => {
    setup('MANAGER', []);
    expect(screen.getByText(/nessun template disponibile/i)).toBeInTheDocument();
  });

  it('shows Edit and Delete buttons for ADMIN', () => {
    setup('ADMIN');
    expect(screen.getAllByRole('button', { name: /modifica/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /elimina/i }).length).toBeGreaterThan(0);
  });

  it('hides Edit and Delete buttons for MANAGER', () => {
    setup('MANAGER');
    expect(screen.queryByRole('button', { name: /modifica/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /elimina/i })).not.toBeInTheDocument();
  });

  it('calls onEditClick when Modifica is clicked', async () => {
    const onEditClick = jest.fn();
    (useContractTemplates as jest.Mock).mockReturnValue({ data: [template1], isLoading: false, isError: false });
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: { id: 1, username: 'admin', role: 'ADMIN' } });
    render(<ContractTemplateTable onEditClick={onEditClick} />, { wrapper: createWrapper() });
    await userEvent.click(screen.getByRole('button', { name: /modifica/i }));
    expect(onEditClick).toHaveBeenCalledWith(template1);
  });

  it('opens delete confirmation dialog when Elimina is clicked', async () => {
    setup('ADMIN');
    await userEvent.click(screen.getAllByRole('button', { name: /elimina/i })[0]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/sei sicuro/i)).toBeInTheDocument();
  });

  it('closes delete dialog when Annulla is clicked', async () => {
    setup('ADMIN');
    await userEvent.click(screen.getAllByRole('button', { name: /elimina/i })[0]);
    await userEvent.click(screen.getByRole('button', { name: /annulla/i }));
    await waitFor(() => expect(screen.queryByText(/sei sicuro/i)).not.toBeInTheDocument());
  });

  it('calls delete service and shows success toast on confirm', async () => {
    setup('ADMIN');
    await userEvent.click(screen.getAllByRole('button', { name: /elimina/i })[0]);
    const dialog = screen.getByRole('dialog');
    const confirmBtn = within(dialog).getByRole('button', { name: /^elimina$/i });
    await userEvent.click(confirmBtn);
    await waitFor(() => expect(contractTemplatesService.delete).toHaveBeenCalledWith(template1.id));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Template eliminato con successo!'));
  });
});
