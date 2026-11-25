import React from 'react';
import { render, screen } from '@testing-library/react';
import { DeadlineRunway } from '@/components/dashboard/DeadlineRunway';
import type { HomeAttentionItem } from '@/types';

const base = {
  contractId: 'c', contractNumber: 'NRT-1', counterpartyName: 'Fornitore S.r.l.', projectName: null, dueDate: null, daysLeft: null,
  managerName: null, renewalMonths: null, invoiceId: null, invoiceNumber: null, invoiceAmount: null,
} as const;

/** The next 30 days on one line: BCM's signature on the Home. */
describe('DeadlineRunway', () => {
  const items: HomeAttentionItem[] = [
    { ...base, type: 'EXPIRY', contractId: 'a', projectName: 'Audit di conformità', dueDate: '2026-12-07', daysLeft: 12 },
    { ...base, type: 'NOTICE_DEADLINE', contractId: 'b', projectName: 'Licenza software', dueDate: '2026-12-01', daysLeft: 6, renewalMonths: 12 },
    { ...base, type: 'IBAN_CHANGED', contractId: 'c', invoiceNumber: 'FA-1' },
    { ...base, type: 'NOTICE_DEADLINE', contractId: 'd', projectName: 'Troppo lontano', dueDate: '2027-03-01', daysLeft: 96 },
  ];

  it('lists the dated deadlines in the window, nearest first, saying which kind and when', () => {
    render(<DeadlineRunway items={items} windowDays={30} today={new Date(2026, 10, 25)} />);

    const rows = screen.getAllByRole('listitem').map((li) => li.textContent ?? '');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatch(/Licenza software.*Disdetta entro il 1° dicembre, tra 6 giorni/);
    expect(rows[1]).toMatch(/Audit di conformità.*Scade il 7 dicembre, tra 12 giorni/);
    expect(screen.queryByText('Troppo lontano')).not.toBeInTheDocument();
  });

  it('shows nothing when no deadline falls in the window', () => {
    const { container } = render(<DeadlineRunway items={[items[2], items[3]]} windowDays={30} today={new Date(2026, 10, 25)} />);

    expect(container).toBeEmptyDOMElement();
  });
});
