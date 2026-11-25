import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextActionCard } from '@/components/contracts/NextActionCard';
import type { Contract } from '@/types';

/** The cancellation buttons on a contract's first card: only while the user can still cancel. */
describe('NextActionCard: cancellation', () => {
  const open = {
    id: 'c1', status: 'ACTIVE', endDate: '2026-12-31', contractNumber: 'NRT-123',
    autoRenew: true, noticeDays: 30, renewalMonths: 12, noticeDeadline: '2026-12-01', daysUntilNoticeDeadline: 6,
  } as unknown as Contract;

  it('offers the letter and, to an administrator, recording it as sent', async () => {
    const prepare = jest.fn();
    const markSent = jest.fn();
    render(<NextActionCard contract={open} onPrepareCancellation={prepare} onMarkCancellationSent={markSent} />);

    await userEvent.click(screen.getByRole('button', { name: 'Prepara la disdetta' }));
    await userEvent.click(screen.getByRole('button', { name: 'Segna disdetta inviata' }));

    expect(prepare).toHaveBeenCalled();
    expect(markSent).toHaveBeenCalled();
  });

  it('offers only the letter when the user cannot change the contract', () => {
    render(<NextActionCard contract={open} onPrepareCancellation={() => {}} />);

    expect(screen.getByRole('button', { name: 'Prepara la disdetta' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Segna disdetta inviata' })).not.toBeInTheDocument();
  });

  it('takes the user to the invoices when one waits to be matched', async () => {
    const openInvoices = jest.fn();
    const quiet = { ...open, autoRenew: false, noticeDeadline: null, daysUntilNoticeDeadline: null, daysUntilExpiry: 200 } as unknown as Contract;
    render(
      <NextActionCard
        contract={quiet}
        invoices={[{ id: 'i1', invoiceNumber: 'NCS-2026-11', matchStatus: 'SUGGESTED', ibanChanged: false, sepaBatchId: null } as never]}
        onOpenInvoices={openInvoices}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Apri le fatture' }));

    expect(openInvoices).toHaveBeenCalled();
  });

  it('offers nothing once the last day to cancel has passed', () => {
    render(
      <NextActionCard
        contract={{ ...open, daysUntilNoticeDeadline: -3 }}
        onPrepareCancellation={() => {}}
        onMarkCancellationSent={() => {}}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Prepara la disdetta' })).not.toBeInTheDocument();
  });
});
