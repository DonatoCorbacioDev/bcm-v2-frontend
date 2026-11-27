import { budgetUsageTone, expectedBudgetPercent, invoicingVarianceTone, invoicingVarianceVariant } from '@/lib/varianceTone';

const IN_LINE = { bar: 'bg-primary', text: 'text-[var(--status-green-fg)]' };
const AMBER = { bar: 'bg-[var(--status-amber-mark)]', text: 'text-[var(--status-amber-fg)]' };

// One meaning per colour: blue bar in line, amber off the pace, never red
// (red is for a date to act by or a payment to stop).
describe('budgetUsageTone', () => {
  describe('COST budgets (spending ahead of the pace is the warning)', () => {
    it("is in line up to 100% of a closed year's budget", () => {
      expect(budgetUsageTone(0, 'COST')).toEqual(IN_LINE);
      expect(budgetUsageTone(100, 'COST')).toEqual(IN_LINE);
    });

    it('is amber over the budget, whatever the pace, and never red', () => {
      expect(budgetUsageTone(101, 'COST')).toEqual(AMBER);
      expect(budgetUsageTone(101, 'COST', 50)).toEqual(AMBER);
    });

    it("is amber when spending ahead of the year's pace, in line at or behind it", () => {
      expect(budgetUsageTone(60, 'COST', 50)).toEqual(AMBER);
      expect(budgetUsageTone(50, 'COST', 50)).toEqual(IN_LINE);
      expect(budgetUsageTone(26, 'COST', 84)).toEqual(IN_LINE);
    });
  });

  describe('REVENUE budgets (falling behind the pace is the warning)', () => {
    it('is in line at or above the target, including well over it', () => {
      expect(budgetUsageTone(100, 'REVENUE')).toEqual(IN_LINE);
      expect(budgetUsageTone(127, 'REVENUE')).toEqual(IN_LINE);
    });

    it('is amber below the pace, and never red', () => {
      expect(budgetUsageTone(0, 'REVENUE')).toEqual(AMBER);
      expect(budgetUsageTone(99, 'REVENUE')).toEqual(AMBER);
      expect(budgetUsageTone(70, 'REVENUE', 84)).toEqual(AMBER);
      expect(budgetUsageTone(84, 'REVENUE', 84)).toEqual(IN_LINE);
    });
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
