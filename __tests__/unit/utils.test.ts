import { cn, getContractStatusVariant } from '@/lib/utils';

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
