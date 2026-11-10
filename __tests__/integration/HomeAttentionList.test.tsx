import React from 'react';
import { render, screen } from '@testing-library/react';
import { HomeAttentionList } from '@/components/dashboard/HomeAttentionList';
import type { HomeAttentionItem } from '@/types';
import { uid } from "../mocks/ids";

const item = (over: Partial<HomeAttentionItem>): HomeAttentionItem => ({
  type: 'EXPIRY', contractId: uid(1), contractNumber: 'NRT-1', counterpartyName: 'Rossi Impianti S.r.l.',
  projectName: 'Manutenzione', dueDate: '2026-11-24', daysLeft: 5, managerName: 'Marco Bellini',
  renewalMonths: null, invoiceId: null, invoiceNumber: null, invoiceAmount: null, ...over,
});

const renderItems = (items: HomeAttentionItem[]) => render(<HomeAttentionList items={items} windowDays={30} />);

describe('HomeAttentionList — when', () => {
  it.each([
    [0, '(oggi)'],
    [1, '(domani)'],
    [12, '(tra 12 giorni)'],
  ])('says %s days left as %s', (daysLeft, text) => {
    renderItems([item({ daysLeft })]);
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it.each([[null], [-3]])('shows no "when" for %s days left', (daysLeft) => {
    renderItems([item({ daysLeft })]);
    expect(screen.queryByText(/\((oggi|domani|tra)/)).not.toBeInTheDocument();
  });
});

describe('HomeAttentionList — sentences with missing data', () => {
  it('reads well for an invoice without a number', () => {
    renderItems([
      item({ type: 'IBAN_CHANGED', invoiceId: uid(7), counterpartyName: null }),
      item({ type: 'INVOICE_TO_MATCH', invoiceId: uid(8), contractId: uid(2) }),
    ]);
    expect(screen.getByText('Una fattura di un fornitore chiede il pagamento su un conto diverso da quello verificato'))
      .toBeInTheDocument();
    expect(screen.getByText('Una fattura da abbinare')).toBeInTheDocument();
  });

  it('reads well without a due date', () => {
    renderItems([
      item({ type: 'NOTICE_DEADLINE', dueDate: null }),
      item({ type: 'EXPIRY', dueDate: null, contractId: uid(2) }),
    ]);
    expect(screen.getByText('Disdici se non vuoi rinnovarlo')).toBeInTheDocument();
    expect(screen.getByText('In scadenza')).toBeInTheDocument();
  });

  it('says what happens after the deadline, in the singular for one month', () => {
    renderItems([
      item({ type: 'NOTICE_DEADLINE', renewalMonths: 1 }),
      item({ type: 'NOTICE_DEADLINE', renewalMonths: 12, contractId: uid(2) }),
    ]);
    expect(screen.getByText('Manutenzione · Rossi Impianti S.r.l. — dopo si rinnova per un altro mese')).toBeInTheDocument();
    expect(screen.getByText('Manutenzione · Rossi Impianti S.r.l. — dopo si rinnova per altri 12 mesi')).toBeInTheDocument();
  });

  it('says when nobody follows the contract', () => {
    renderItems([item({ managerName: null })]);
    expect(screen.getByText(/Nessun responsabile/)).toBeInTheDocument();
  });
});
