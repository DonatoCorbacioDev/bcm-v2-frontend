import { formatMoney, formatNumber } from '@/lib/formatMoney';

// Intl puts a no-break space between amount and symbol.
const nbsp = (s: string) => s.replace(/ /g, ' ');

describe('formatMoney', () => {
  it('groups thousands even for 4-digit amounts, like Italian accounting', () => {
    expect(formatMoney(4800)).toBe(nbsp('4.800,00 €'));
    expect(formatMoney(38000)).toBe(nbsp('38.000,00 €'));
  });

  it('keeps small amounts and negatives readable', () => {
    expect(formatMoney(0)).toBe(nbsp('0,00 €'));
    expect(formatMoney(999.5)).toBe(nbsp('999,50 €'));
    expect(formatMoney(-1234.5)).toBe(nbsp('-1.234,50 €'));
  });

  it('rounds to whole euros for totals and KPIs', () => {
    expect(formatMoney(148800, { decimals: 0 })).toBe(nbsp('148.800 €'));
    expect(formatMoney(1234.56, { decimals: 0 })).toBe(nbsp('1.235 €'));
  });

  it('formats another ISO currency with its own symbol', () => {
    expect(formatMoney(4800, { currency: 'USD' })).toBe(nbsp('4.800,00 USD'));
  });

  it('falls back to "amount code" for a currency that is not ISO 4217', () => {
    expect(formatMoney(4800, { currency: 'XXXX' })).toBe('4.800,00 XXXX');
  });
});

describe('formatNumber', () => {
  it('formats a plain amount without symbol', () => {
    expect(formatNumber(4800)).toBe('4.800,00');
    expect(formatNumber(12.3456, 3)).toBe('12,346');
  });
});
