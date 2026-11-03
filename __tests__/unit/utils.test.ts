import { cn, getContractStatusVariant } from '@/lib/utils';
import { formatExpiresIn, getExpiringSoonDays } from '@/lib/statusConfig';

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
