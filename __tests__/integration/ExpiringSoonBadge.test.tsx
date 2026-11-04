import React from 'react';
import { render, screen } from '@testing-library/react';
import { ExpiringSoonBadge } from '@/components/contracts/ExpiringSoonBadge';

describe('ExpiringSoonBadge', () => {
  it('warns about the end date for an ordinary contract', () => {
    render(<ExpiringSoonBadge contract={{ status: 'ACTIVE', daysUntilExpiry: 12 }} showDays />);
    expect(screen.getByText('Scade tra 12 giorni')).toBeInTheDocument();
  });

  it('warns about the notice deadline, not the end date, for a tacit renewal', () => {
    render(
      <ExpiringSoonBadge
        contract={{ status: 'ACTIVE', daysUntilExpiry: 102, noticeDeadline: '2026-11-16', daysUntilNoticeDeadline: 12 }}
        showDays
      />);
    expect(screen.getByText('Disdici entro 12 giorni')).toBeInTheDocument();
  });

  it('uses a short label in tables, with the days in the tooltip', () => {
    render(
      <ExpiringSoonBadge
        contract={{ status: 'ACTIVE', daysUntilExpiry: 102, noticeDeadline: '2026-11-16', daysUntilNoticeDeadline: 12 }}
      />);
    expect(screen.getByText('Disdetta in scadenza')).toHaveAttribute('title', 'Disdici entro 12 giorni');
  });

  it('shows nothing once the notice deadline has passed: the contract will renew, not expire', () => {
    const { container } = render(
      <ExpiringSoonBadge
        contract={{ status: 'ACTIVE', daysUntilExpiry: 20, noticeDeadline: '2026-09-01', daysUntilNoticeDeadline: -70 }}
        showDays
      />);
    expect(container).toBeEmptyDOMElement();
  });
});
