import { cn, getContractStatusVariant } from '@/lib/utils';
import {
  computeNoticeDeadline,
  formatExpiresIn,
  formatNoticeIn,
  getExpiringSoonDays,
  getNoticeDeadlineDays,
} from '@/lib/statusConfig';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('ignores falsy values', () => {
    expect(cn('foo', false && 'bar', undefined, 'baz')).toBe('foo baz');
  });

  it('deduplicates Tailwind classes', () => {
    const result = cn('px-2', 'px-4');
    expect(result).toBe('px-4');
  });
});

describe('getContractStatusVariant', () => {
  it('returns "success" for ACTIVE', () => {
    expect(getContractStatusVariant('ACTIVE')).toBe('success');
  });

  it('returns "destructive" for EXPIRED', () => {
    expect(getContractStatusVariant('EXPIRED')).toBe('destructive');
  });

  it('returns "secondary" for CANCELLED', () => {
    expect(getContractStatusVariant('CANCELLED')).toBe('secondary');
  });

  it('returns "default" for unknown status', () => {
    expect(getContractStatusVariant('UNKNOWN')).toBe('default');
  });
});

describe('getExpiringSoonDays', () => {
  it('returns the days left for an ACTIVE contract ending within 30 days', () => {
    expect(getExpiringSoonDays({ status: 'ACTIVE', daysUntilExpiry: 12 })).toBe(12);
  });

  it('includes both ends of the window (today and day 30)', () => {
    expect(getExpiringSoonDays({ status: 'ACTIVE', daysUntilExpiry: 0 })).toBe(0);
    expect(getExpiringSoonDays({ status: 'ACTIVE', daysUntilExpiry: 30 })).toBe(30);
  });

  it('returns null outside the window', () => {
    expect(getExpiringSoonDays({ status: 'ACTIVE', daysUntilExpiry: 31 })).toBeNull();
    expect(getExpiringSoonDays({ status: 'ACTIVE', daysUntilExpiry: -1 })).toBeNull();
  });

  it('returns null when the days are unknown', () => {
    expect(getExpiringSoonDays({ status: 'ACTIVE' })).toBeNull();
    expect(getExpiringSoonDays({ status: 'ACTIVE', daysUntilExpiry: null })).toBeNull();
  });

  it('returns null for contracts that are not ACTIVE', () => {
    expect(getExpiringSoonDays({ status: 'DRAFT', daysUntilExpiry: 10 })).toBeNull();
    expect(getExpiringSoonDays({ status: 'CANCELLED', daysUntilExpiry: 10 })).toBeNull();
  });
});

describe('formatExpiresIn', () => {
  it('says "oggi" on the last day', () => {
    expect(formatExpiresIn(0)).toBe('Scade oggi');
  });

  it('uses the singular for one day', () => {
    expect(formatExpiresIn(1)).toBe('Scade tra 1 giorno');
  });

  it('uses the plural otherwise', () => {
    expect(formatExpiresIn(12)).toBe('Scade tra 12 giorni');
  });
});

describe('tacit renewal helpers', () => {
  it('computes the last day to give notice like the backend: end date minus notice days', () => {
    expect(computeNoticeDeadline('2026-12-31', 90)).toEqual(new Date(2026, 9, 2));
    expect(computeNoticeDeadline('2026-03-01', 1)).toEqual(new Date(2026, 1, 28));
    expect(computeNoticeDeadline('2026-12-31', 0)).toEqual(new Date(2026, 11, 31));
  });

  it('has no deadline without an end date or a notice period', () => {
    expect(computeNoticeDeadline(undefined, 90)).toBeNull();
    expect(computeNoticeDeadline('', 90)).toBeNull();
    expect(computeNoticeDeadline('2026-12-31', undefined)).toBeNull();
    expect(computeNoticeDeadline('2026-12-31', null)).toBeNull();
  });

  it('flags an ACTIVE contract within 30 days of its notice deadline', () => {
    expect(getNoticeDeadlineDays({ status: 'ACTIVE', daysUntilNoticeDeadline: 12 })).toBe(12);
    expect(getNoticeDeadlineDays({ status: 'ACTIVE', daysUntilNoticeDeadline: 0 })).toBe(0);
    expect(getNoticeDeadlineDays({ status: 'ACTIVE', daysUntilNoticeDeadline: 31 })).toBeNull();
    expect(getNoticeDeadlineDays({ status: 'ACTIVE', daysUntilNoticeDeadline: -1 })).toBeNull();
    expect(getNoticeDeadlineDays({ status: 'CANCELLED', daysUntilNoticeDeadline: 5 })).toBeNull();
  });

  it('says how long is left to give notice', () => {
    expect(formatNoticeIn(0)).toBe('Ultimo giorno per disdire: oggi');
    expect(formatNoticeIn(1)).toBe('Disdici entro 1 giorno');
    expect(formatNoticeIn(12)).toBe('Disdici entro 12 giorni');
  });
});
