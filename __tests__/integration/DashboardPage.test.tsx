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
  const shared = { get: jest.fn().mockResolvedValue({ data: [{ id: 1, name: 'IT' }] }) };
  return { __esModule: true, api: shared, default: shared };
});

import DashboardPage from '@/app/(dashboard)/dashboard/page';
import { useHomeAttention } from '@/hooks/useHomeAttention';
import { useAuthStore } from '@/store/authStore';

const item = (overrides: Partial<HomeAttentionItem>): HomeAttentionItem => ({
  type: 'EXPIRY',
  contractId: 1,
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
    selector({ user: { id: 4, username: 'demo', role: 'MANAGER' } }));
});

describe('Home', () => {
  it('says what to do, by when and who follows it, each linked to where it gets done', () => {
    showing(home([
      item({ type: 'IBAN_CHANGED', contractId: 8, counterpartyName: 'Ferri & Associati S.r.l.', invoiceId: 31, invoiceNumber: 'FA-2026-11', dueDate: '2026-11-01', daysLeft: -3 }),
      item({ type: 'NOTICE_DEADLINE', contractId: 9, projectName: 'Manutenzione impianti', counterpartyName: 'Rossi Impianti S.r.l.', dueDate: '2026-11-24', daysLeft: 20, renewalMonths: 12 }),
      item({}),
      item({ type: 'INVOICE_TO_MATCH', contractId: 7, counterpartyName: 'Nuvola Cloud Services S.r.l.', invoiceId: 30, invoiceNumber: '2026/118', invoiceAmount: 4800, dueDate: '2026-11-01', daysLeft: -3 }),
    ]));

    render(<DashboardPage />, { wrapper: createWrapper() });

    const rows = within(screen.getByRole('region', { name: 'Da fare' })).getAllByRole('link');
    expect(rows.map((r) => r.getAttribute('href'))).toEqual([
      '/contracts/8?tab=invoices', '/contracts/9', '/contracts/1', '/contracts/7?tab=invoices',
    ]);
    expect(rows[0]).toHaveTextContent('IBAN cambiato: verifica prima di pagare');
    expect(rows[0]).toHaveTextContent('La fattura FA-2026-11 di Ferri & Associati S.r.l.');
    expect(rows[1]).toHaveTextContent('Disdici entro il 24 novembre se non vuoi rinnovarlo (tra 20 giorni)');
    expect(rows[1]).toHaveTextContent('dopo si rinnova per altri 12 mesi');
    expect(rows[2]).toHaveTextContent('Scade il 16 novembre (tra 12 giorni)');
    expect(rows[2]).toHaveTextContent('Responsabile: Marco Bellini');
    expect(rows[3]).toHaveTextContent('Fattura 2026/118 da abbinare');
    expect(rows[3]).toHaveTextContent('4.800,00');
  });

  it('shows the counters of that same list', () => {
    showing(home([item({}), item({ type: 'INVOICE_TO_MATCH', invoiceId: 30, invoiceNumber: '1' })]));

    render(<DashboardPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Da fare entro 30 giorni').closest('div')!.parentElement).toHaveTextContent('1');
    expect(screen.getByText('Fatture da abbinare').closest('div')!.parentElement).toHaveTextContent('1');
    expect(screen.getByText('Avvisi IBAN').closest('div')!.parentElement).toHaveTextContent('0');
  });

  it('reassures when there is nothing to do', () => {
    showing(home([]));

    render(<DashboardPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Niente da fare nei prossimi 30 giorni.')).toBeInTheDocument();
  });

  it('asks to check a tacit renewal with incomplete terms', () => {
    showing(home([item({ type: 'RENEWAL_TO_CHECK' })]));

    render(<DashboardPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Verifica il rinnovo')).toBeInTheDocument();
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
