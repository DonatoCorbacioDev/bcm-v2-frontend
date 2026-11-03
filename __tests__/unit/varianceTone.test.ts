import { budgetUsageTone, expectedBudgetPercent, invoicingVarianceTone, invoicingVarianceVariant } from '@/lib/varianceTone';

const GREEN = { bar: 'bg-[var(--status-green-fg)]', text: 'text-[var(--status-green-fg)]' };
const AMBER = { bar: 'bg-[var(--status-amber-fg)]', text: 'text-[var(--status-amber-fg)]' };
const RED = { bar: 'bg-[var(--status-red-fg)]', text: 'text-[var(--status-red-fg)]' };

describe('budgetUsageTone', () => {
  describe('COST budgets (higher usage is worse)', () => {
    it('is red when over 100% used', () => {
      expect(budgetUsageTone(101, 'COST')).toEqual({ bar: 'bg-[var(--status-red-fg)]', text: 'text-[var(--status-red-fg)]' });
    });

    it("is green up to 100% of a closed year's budget", () => {
      expect(budgetUsageTone(0, 'COST')).toEqual(GREEN);
      expect(budgetUsageTone(85, 'COST')).toEqual(GREEN);
      expect(budgetUsageTone(100, 'COST')).toEqual(GREEN);
    });

    it("is amber when spending ahead of the year's pace", () => {
      expect(budgetUsageTone(60, 'COST', 50)).toEqual(AMBER);
    });

    it('is green when spending at or behind the pace', () => {
      expect(budgetUsageTone(50, 'COST', 50)).toEqual(GREEN);
      expect(budgetUsageTone(26, 'COST', 84)).toEqual(GREEN);
    });

    it('stays red over the yearly budget whatever the pace', () => {
      expect(budgetUsageTone(101, 'COST', 50)).toEqual(RED);
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

describe("budgetUsageTone — REVENUE against the year's pace", () => {
  // 3 Nov: ~84% of the year gone.
  it('is green once on pace', () => {
    expect(budgetUsageTone(84, 'REVENUE', 84)).toEqual(GREEN);
  });

  it('is amber within 80% of the pace', () => {
    expect(budgetUsageTone(70, 'REVENUE', 84)).toEqual(AMBER);
  });

  it('is red well behind the pace', () => {
    expect(budgetUsageTone(18, 'REVENUE', 84)).toEqual(RED);
  });

  it('is never red in a year that has not started', () => {
    expect(budgetUsageTone(0, 'REVENUE', 0)).toEqual(GREEN);
  });
});

describe('expectedBudgetPercent', () => {
  const today = new Date(2026, 10, 3); // 3 Nov 2026, local time

  it('is 100 for a past year', () => {
    expect(expectedBudgetPercent(2025, today)).toBe(100);
  });

  it('is 0 for a future year', () => {
    expect(expectedBudgetPercent(2027, today)).toBe(0);
  });

  it('is the share of the current year gone, counting today', () => {
    // 3 Nov 2026 is day 307 of 365.
    expect(expectedBudgetPercent(2026, today)).toBeCloseTo((307 / 365) * 100, 5);
  });

  it('counts the first day and reaches 100 on the last day', () => {
    expect(expectedBudgetPercent(2026, new Date(2026, 0, 1))).toBeCloseTo((1 / 365) * 100, 5);
    expect(expectedBudgetPercent(2026, new Date(2026, 11, 31))).toBeCloseTo(100, 5);
  });

  it('defaults to the real current date', () => {
    expect(expectedBudgetPercent(new Date().getFullYear() - 1)).toBe(100);
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
