import { addMonths, computeNoticeDeadline, validateNotice } from '@/lib/noticeDeadline';

describe('computeNoticeDeadline', () => {
  it('in days, matches the backend rule: end date minus the notice', () => {
    const r = computeNoticeDeadline({ endDate: '2027-03-15', notice: 90, unit: 'days', today: '2026-11-25' });

    expect(r.deadline).toBe('2026-12-15');
    expect(r.daysLeft).toBe(20);
    expect(r.passed).toBe(false);
    expect(r.renewed).toBeNull();
  });

  it('in months, counts calendar months, not 30-day blocks', () => {
    const r = computeNoticeDeadline({ endDate: '2027-03-15', notice: 3, unit: 'months', today: '2026-11-25' });

    expect(r.deadline).toBe('2026-12-15');
  });

  it('a month back from the 31st lands on the last day of a shorter month', () => {
    expect(computeNoticeDeadline({ endDate: '2027-03-31', notice: 1, unit: 'months', today: '2026-11-25' }).deadline).toBe('2027-02-28');
    expect(computeNoticeDeadline({ endDate: '2028-03-31', notice: 1, unit: 'months', today: '2026-11-25' }).deadline).toBe('2028-02-29');
  });

  it('counts days across a leap day', () => {
    expect(computeNoticeDeadline({ endDate: '2028-03-01', notice: 1, unit: 'days', today: '2026-11-25' }).deadline).toBe('2028-02-29');
  });

  it('a deadline today leaves 0 days and is still open', () => {
    const r = computeNoticeDeadline({ endDate: '2026-12-25', notice: 30, unit: 'days', today: '2026-11-25' });

    expect(r.daysLeft).toBe(0);
    expect(r.passed).toBe(false);
  });

  it('flags a deadline on a Saturday or a Sunday', () => {
    expect(computeNoticeDeadline({ endDate: '2027-01-30', notice: 30, unit: 'days', today: '2026-11-25' }).weekend).toBe(false); // 31/12/2026, Thursday
    expect(computeNoticeDeadline({ endDate: '2027-01-01', notice: 30, unit: 'days', today: '2026-11-25' }).weekend).toBe(false); // 02/12, Wednesday
    expect(computeNoticeDeadline({ endDate: '2027-01-05', notice: 30, unit: 'days', today: '2026-11-25' }).weekend).toBe(true); // 06/12, Sunday
  });

  it('a passed deadline with no renewal given says so', () => {
    const r = computeNoticeDeadline({ endDate: '2026-12-01', notice: 60, unit: 'days', today: '2026-11-25' });

    expect(r.deadline).toBe('2026-10-02');
    expect(r.daysLeft).toBe(-54);
    expect(r.passed).toBe(true);
    expect(r.renewed).toBeNull();
  });

  it('a passed deadline with a known renewal looks ahead to the next open one', () => {
    const r = computeNoticeDeadline({ endDate: '2026-12-01', notice: 60, unit: 'days', renewalMonths: 12, today: '2026-11-25' });

    expect(r.passed).toBe(false);
    expect(r.renewed).toEqual({ endDate: '2027-12-01', deadline: '2027-10-02', daysLeft: 311, weekend: true });
  });

  it('renewals keep a month-end contract on the month end', () => {
    const r = computeNoticeDeadline({ endDate: '2025-01-31', notice: 1, unit: 'months', renewalMonths: 1, today: '2026-11-25' });

    // Monthly renewals from 31 January 2025: the first still open ends on
    // 31 December 2026, with its notice a calendar month earlier, 30 November.
    expect(r.renewed?.endDate).toBe('2026-12-31');
    expect(r.renewed?.deadline).toBe('2026-11-30');
  });

  it('refuses what it cannot compute, in plain Italian', () => {
    expect(() => computeNoticeDeadline({ endDate: '', notice: 30, unit: 'days', today: '2026-11-25' })).toThrow('data di scadenza');
    expect(validateNotice({ endDate: '2027-02-30', notice: 30, unit: 'days' })).toMatch(/data di scadenza/);
    expect(validateNotice({ endDate: '2027-03-15', notice: 0, unit: 'days' })).toMatch(/preavviso/);
    expect(validateNotice({ endDate: '2027-03-15', notice: 1.5, unit: 'months' })).toMatch(/preavviso/);
    expect(validateNotice({ endDate: '2027-03-15', notice: 121, unit: 'months' })).toMatch(/120 mesi/);
    expect(validateNotice({ endDate: '2027-03-15', notice: 3651, unit: 'days' })).toMatch(/3650 giorni/);
    expect(validateNotice({ endDate: '2027-03-15', notice: 30, unit: 'days', renewalMonths: 0 })).toMatch(/rinnovo/);
    expect(validateNotice({ endDate: '2027-03-15', notice: 30, unit: 'days', renewalMonths: null })).toBeNull();
  });
});

describe('addMonths', () => {
  it('moves forward and back, clamping to the month end', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-28');
    expect(addMonths('2026-12-15', 2)).toBe('2027-02-15');
    expect(addMonths('2026-02-15', -14)).toBe('2024-12-15');
  });
});
