import { contractCalendarEntries, isoDay, monthGrid } from '@/lib/contractCalendar';
import type { Contract } from '@/types';

const contract = (over: Partial<Contract>): Contract =>
  ({ id: 'c', counterpartyId: 'cp', contractNumber: 'NRT-1', projectName: 'Progetto', endDate: '2027-01-31', status: 'ACTIVE', ...over }) as Contract;

describe('contractCalendarEntries', () => {
  it('a tacit renewal gives the last day to cancel and the renewal day; any other contract its end date', () => {
    const entries = contractCalendarEntries([
      contract({ id: 'a', contractNumber: 'NRT-2', autoRenew: true, noticeDeadline: '2026-12-01', endDate: '2027-01-30' }),
      contract({ id: 'b', contractNumber: 'NRT-3', endDate: '2026-12-07' }),
    ]);

    expect(entries.map((e) => `${e.date} ${e.kind} ${e.contractNumber}`)).toEqual([
      '2026-12-01 notice NRT-2',
      '2026-12-07 expiry NRT-3',
      '2027-01-30 renewal NRT-2',
    ]);
  });

  it('leaves out contracts that are not active, and a renewal without a known deadline falls back to the end date', () => {
    const entries = contractCalendarEntries([
      contract({ id: 'x', status: 'EXPIRED' }),
      contract({ id: 'y', status: 'DRAFT' }),
      contract({ id: 'z', autoRenew: true, noticeDeadline: null, endDate: '2026-12-20' }),
    ]);

    expect(entries).toEqual([expect.objectContaining({ contractId: 'z', kind: 'expiry', date: '2026-12-20' })]);
  });
});

describe('monthGrid', () => {
  it('starts on Monday and covers the whole month (December 2026: 30 Nov to 3 Jan)', () => {
    const weeks = monthGrid(2026, 11);

    expect(isoDay(weeks[0][0])).toBe('2026-11-30');
    expect(weeks.at(-1)!.map(isoDay)).toContain('2026-12-31');
    expect(isoDay(weeks.at(-1)![6])).toBe('2027-01-03');
    expect(weeks.every((w) => w.length === 7)).toBe(true);
  });

  it('adds no week made only of the next month (February 2027 fits in four weeks)', () => {
    const weeks = monthGrid(2027, 1);

    expect(weeks).toHaveLength(4);
    expect(isoDay(weeks[0][0])).toBe('2027-02-01');
  });
});
