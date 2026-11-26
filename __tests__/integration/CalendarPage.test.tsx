import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CalendarPage from '@/app/(dashboard)/calendar/page';
import type { Contract } from '@/types';

const contracts = [
  { id: 'a', counterpartyId: 'x', contractNumber: 'NRT-123', projectName: 'Licenza software gestionale', status: 'ACTIVE', autoRenew: true, noticeDeadline: '2026-12-01', endDate: '2027-01-30' },
  { id: 'b', counterpartyId: 'x', contractNumber: 'NRT-104', projectName: 'Audit di Conformità', status: 'ACTIVE', endDate: '2026-12-07' },
] as Contract[];

const searchPaged = jest.fn();
jest.mock('@/services/contracts.service', () => ({
  contractsService: { searchPaged: (...args: unknown[]) => searchPaged(...args) },
}));
jest.mock('@/services/calendarFeed.service', () => ({
  calendarFeedService: { getUrl: jest.fn().mockResolvedValue('https://bcm.example/api/v1/calendar/fake-feed-token.ics') },
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><CalendarPage /></QueryClientProvider>);
}

/** The month's deadlines, and the buttons that put them in the user's own calendar. */
describe('CalendarPage', () => {
  beforeEach(() => {
    searchPaged.mockResolvedValue({ content: contracts, totalElements: contracts.length, totalPages: 1, number: 0, size: 1000 });
    jest.useFakeTimers({ now: new Date(2026, 10, 25, 10), doNotFake: ['queueMicrotask', 'setImmediate', 'setTimeout', 'setInterval'] });
  });
  afterEach(() => jest.useRealTimers());

  it('opens on the current month and moves to the next, where the deadlines are, each linking to its contract', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText(/novembre 2026/i)).toBeInTheDocument();
    // The search both roles may use (GET /contracts is admin-only), active contracts only.
    expect(searchPaged).toHaveBeenCalledWith({ page: 0, size: 1000, status: 'ACTIVE' });
    await screen.findAllByRole('link', { name: /NRT-123/ });
    await user.click(screen.getByRole('button', { name: 'Mese successivo' }));
    expect(screen.getByText(/dicembre 2026/i)).toBeInTheDocument();

    const notice = screen.getAllByRole('link', { name: /Ultimo giorno per disdire: NRT-123/ })[0];
    expect(notice).toHaveAttribute('href', '/contracts/a');
    expect(screen.getAllByRole('link', { name: /Scadenza: NRT-104/ })[0]).toHaveAttribute('href', '/contracts/b');
  });

  it('offers to subscribe Google, Outlook and Apple calendars to the personal feed', async () => {
    renderPage();

    const section = screen.getByRole('region', { name: 'Le scadenze nel tuo calendario' });
    const google = await within(section).findByRole('link', { name: 'Google Calendar' });
    expect(google.getAttribute('href')).toContain('calendar.google.com/calendar/r?cid=webcal');
    expect(within(section).getByRole('link', { name: 'Apple Calendar' })).toHaveAttribute('href', 'webcal://bcm.example/api/v1/calendar/fake-feed-token.ics');
    expect(within(section).getByRole('link', { name: 'Outlook.com' }).getAttribute('href')).toContain('outlook.live.com');
  });
});
