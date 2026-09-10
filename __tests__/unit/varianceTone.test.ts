import { budgetUsageTone, invoicingVarianceTone, invoicingVarianceVariant } from '@/lib/varianceTone';

describe('budgetUsageTone', () => {
  describe('COST budgets (higher usage is worse)', () => {
    it('is red when over 100% used', () => {
      expect(budgetUsageTone(101, 'COST')).toEqual({ bar: 'bg-[var(--status-red-fg)]', text: 'text-[var(--status-red-fg)]' });
    });

    it('is amber between 80% and 100% used', () => {
      expect(budgetUsageTone(80, 'COST')).toEqual({ bar: 'bg-[var(--status-amber-fg)]', text: 'text-[var(--status-amber-fg)]' });
      expect(budgetUsageTone(100, 'COST')).toEqual({ bar: 'bg-[var(--status-amber-fg)]', text: 'text-[var(--status-amber-fg)]' });
    });

    it('is green under 80% used', () => {
      expect(budgetUsageTone(0, 'COST')).toEqual({ bar: 'bg-[var(--status-green-fg)]', text: 'text-[var(--status-green-fg)]' });
      expect(budgetUsageTone(79, 'COST')).toEqual({ bar: 'bg-[var(--status-green-fg)]', text: 'text-[var(--status-green-fg)]' });
    });
  });

  describe('REVENUE budgets (higher achievement is better)', () => {
    it('is green at or above 100% achieved, including well over target', () => {
      expect(budgetUsageTone(100, 'REVENUE')).toEqual({ bar: 'bg-[var(--status-green-fg)]', text: 'text-[var(--status-green-fg)]' });
      expect(budgetUsageTone(127, 'REVENUE')).toEqual({ bar: 'bg-[var(--status-green-fg)]', text: 'text-[var(--status-green-fg)]' });
    });

    it('is amber between 80% and 100% achieved', () => {
      expect(budgetUsageTone(80, 'REVENUE')).toEqual({ bar: 'bg-[var(--status-amber-fg)]', text: 'text-[var(--status-amber-fg)]' });
      expect(budgetUsageTone(99, 'REVENUE')).toEqual({ bar: 'bg-[var(--status-amber-fg)]', text: 'text-[var(--status-amber-fg)]' });
    });

    it('is red under 80% achieved', () => {
      expect(budgetUsageTone(0, 'REVENUE')).toEqual({ bar: 'bg-[var(--status-red-fg)]', text: 'text-[var(--status-red-fg)]' });
      expect(budgetUsageTone(79, 'REVENUE')).toEqual({ bar: 'bg-[var(--status-red-fg)]', text: 'text-[var(--status-red-fg)]' });
    });
  });
});

describe('invoicingVarianceTone', () => {
  it('is green when at or above -10% (including any positive variance)', () => {
    expect(invoicingVarianceTone(-10)).toEqual({ bar: 'bg-[var(--status-green-fg)]', text: 'text-[var(--status-green-fg)]' });
    expect(invoicingVarianceTone(50)).toEqual({ bar: 'bg-[var(--status-green-fg)]', text: 'text-[var(--status-green-fg)]' });
  });

  it('is amber between -30% and -10%', () => {
    expect(invoicingVarianceTone(-30)).toEqual({ bar: 'bg-[var(--status-amber-fg)]', text: 'text-[var(--status-amber-fg)]' });
    expect(invoicingVarianceTone(-11)).toEqual({ bar: 'bg-[var(--status-amber-fg)]', text: 'text-[var(--status-amber-fg)]' });
  });

  it('is red below -30%', () => {
    expect(invoicingVarianceTone(-31)).toEqual({ bar: 'bg-[var(--status-red-fg)]', text: 'text-[var(--status-red-fg)]' });
  });
});

describe('invoicingVarianceVariant', () => {
  it('mirrors invoicingVarianceTone thresholds as KPICard variants', () => {
    expect(invoicingVarianceVariant(10)).toBe('success');
    expect(invoicingVarianceVariant(-10)).toBe('success');
    expect(invoicingVarianceVariant(-11)).toBe('warning');
    expect(invoicingVarianceVariant(-30)).toBe('warning');
    expect(invoicingVarianceVariant(-31)).toBe('danger');
  });
});
