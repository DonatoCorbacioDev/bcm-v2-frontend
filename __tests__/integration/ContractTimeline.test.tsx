import React from 'react';
import { render, screen } from '@testing-library/react';
import { ContractTimeline } from '@/components/contracts/ContractTimeline';

/** The contract's year on one line, inside the app (the landing has a fixed sample). */
describe('ContractTimeline', () => {
  const props = { startDate: '2025-12-31', endDate: '2026-12-31', noticeDeadline: '2026-12-01', renewalMonths: 12 };

  it('says the period, the last day to cancel with the days left, and what happens otherwise', () => {
    render(<ContractTimeline {...props} today={new Date(2026, 10, 25)} />);

    expect(screen.getByText('31 dicembre 2025 – 31 dicembre 2026')).toBeInTheDocument();
    expect(screen.getByText('1 dicembre 2026, tra 6 giorni')).toBeInTheDocument();
    expect(screen.getByText('Si rinnova fino al 31 dicembre 2027')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAccessibleName(/Ultimo giorno per disdire il 1° dicembre 2026, tra 6 giorni/);
  });

  it('says when the deadline is today, and when it has passed', () => {
    const { rerender } = render(<ContractTimeline {...props} today={new Date(2026, 11, 1)} />);
    expect(screen.getByText('1 dicembre 2026, oggi')).toBeInTheDocument();

    rerender(<ContractTimeline {...props} today={new Date(2026, 11, 5)} />);
    expect(screen.getByText('1 dicembre 2026, passato')).toBeInTheDocument();
  });

  it('without a known renewal length, says only that it renews', () => {
    render(<ContractTimeline {...props} renewalMonths={null} today={new Date(2026, 10, 25)} />);

    expect(screen.getByText('Si rinnova automaticamente')).toBeInTheDocument();
  });
});
