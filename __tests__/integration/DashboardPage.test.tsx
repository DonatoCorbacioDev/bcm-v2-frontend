import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { createWrapper } from '../mocks/wrapper';
import type { HomeAttention, HomeAttentionItem } from '@/types';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/hooks/useHomeAttention', () => ({
  useHomeAttention: jest.fn(),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/lib/api', () => {
  const shared = { get: jest.fn().mockResolvedValue({ data: [{ id: '00000000-0000-4000-8000-000000000001', name: 'IT' }] }) };
  return { __esModule: true, api: shared, default: shared };
});

import DashboardPage from '@/app/(dashboard)/dashboard/page';
import { useHomeAttention } from '@/hooks/useHomeAttention';
import { useAuthStore } from '@/store/authStore';
import { uid } from "../mocks/ids";

const item = (overrides: Partial<HomeAttentionItem>): HomeAttentionItem => ({
  type: 'EXPIRY',
  contractId: uid(1),
  contractNumber: 'NRT-2024-004',
  counterpartyName: 'Vertice Legal S.r.l.',
  projectName: 'Audit di Conformità',
  dueDate: '2026-11-16',
  daysLeft: 12,
  managerName: 'Marco Bellini',
  renewalMonths: null,
  invoiceId: null,
  invoiceNumber: null,
  invoiceAmount: null,
  ...overrides,
});

const home = (items: HomeAttentionItem[], counts: Partial<HomeAttention> = {}): HomeAttention => ({
  dueSoonCount: items.filter((i) => !i.invoiceId).length,
  invoicesToMatchCount: items.filter((i) => i.type === 'INVOICE_TO_MATCH').length,
  ibanAlertsCount: items.filter((i) => i.type === 'IBAN_CHANGED').length,
  windowDays: 30,
  items,
  ...counts,
});

const showing = (data: HomeAttention | undefined, state: { isLoading?: boolean; isError?: boolean } = {}) =>
  (useHomeAttention as jest.Mock).mockReturnValue({ data, isLoading: false, isError: false, ...state });

beforeEach(() => {
  jest.clearAllMocks();
  (useAuthStore as unknown as jest.Mock).mockImplementation((selector) =>
    selector({ user: { id: uid(4), username: 'demo', role: 'MANAGER' } }));
});

describe('Home', () => {
  it('lists only what asks for an action now, each with its own button', () => {
    showing(home([
      item({ type: 'IBAN_CHANGED', contractId: uid(8), counterpartyName: 'Ferri & Associati S.r.l.', invoiceId: uid(31), invoiceNumber: 'FA-2026-11', dueDate: '2026-11-01', daysLeft: -3 }),
      item({ type: 'NOTICE_DEADLINE', contractId: uid(10), projectName: 'Licenza', counterpartyName: 'Gestio S.r.l.', dueDate: '2026-11-09', daysLeft: 5, renewalMonths: 12 }),
      item({ type: 'NOTICE_DEADLINE', contractId: uid(9), projectName: 'Manutenzione impianti', counterpartyName: 'Rossi Impianti S.r.l.', dueDate: '2026-11-24', daysLeft: 20, renewalMonths: 12 }),
      item({}),
      item({ type: 'INVOICE_TO_MATCH', contractId: uid(7), counterpartyName: 'Nuvola Cloud Services S.r.l.', invoiceId: uid(30), invoiceNumber: '2026/118', invoiceAmount: 4800, dueDate: '2026-11-01', daysLeft: -3 }),
    ]));

    render(<DashboardPage />, { wrapper: createWrapper() });

    const now = within(screen.getByRole('region', { name: 'Da fare adesso' }));
    const actions = now.getAllByRole('link');
    expect(actions.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Verifica', `/contracts/${uid(8)}?tab=invoices`],
      ['Prepara la disdetta', `/contracts/${uid(10)}`],
    ]);
    expect(now.getByText('IBAN cambiato: Ferri & Associati S.r.l.')).toBeInTheDocument();
    expect(now.getByText(/se non disdici si rinnova per altri 12 mesi/)).toBeInTheDocument();
    // Deadlines further away are on the timeline only, never listed twice.
    expect(now.queryByText(/Manutenzione impianti/)).not.toBeInTheDocument();

    const invoices = within(screen.getByRole('region', { name: /Fatture da abbinare/ }));
    expect(invoices.getByText('2026/118')).toBeInTheDocument();
    expect(invoices.getByRole('link', { name: 'Abbina' })).toHaveAttribute('href', `/contracts/${uid(7)}?tab=invoices`);
  });

  it('says it all in one sentence at the top', () => {
    showing(home([
      item({ type: 'IBAN_CHANGED', invoiceId: uid(31), daysLeft: null, dueDate: null }),
      item({ type: 'NOTICE_DEADLINE', dueDate: '2026-11-09', daysLeft: 5 }),
      item({ type: 'INVOICE_TO_MATCH', invoiceId: uid(30), invoiceNumber: '1' }),
      item({ type: 'INVOICE_TO_MATCH', invoiceId: uid(32), invoiceNumber: '2' }),
    ]));

    render(<DashboardPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Hai 1 IBAN da verificare, 1 contratto da disdire entro 14 giorni e 2 fatture da abbinare.')).toBeInTheDocument();
  });

  it('reassures when there is nothing to do', () => {
    showing(home([]));

    render(<DashboardPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Niente da fare nei prossimi 30 giorni.')).toBeInTheDocument();
  });

  it('asks to check a tacit renewal with incomplete terms', () => {
    showing(home([item({ type: 'RENEWAL_TO_CHECK' })]));

    render(<DashboardPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Completa il rinnovo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Completa i dati' })).toBeInTheDocument();
  });

  it('says when the list could not be loaded', () => {
    showing(undefined, { isError: true });

    render(<DashboardPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Impossibile caricare le attività')).toBeInTheDocument();
  });

  it('keeps the former charts and AI widgets off by default', () => {
    showing(home([]));

    render(<DashboardPage />, { wrapper: createWrapper() });

    expect(screen.queryByText('Azioni consigliate')).not.toBeInTheDocument();
  });
});
