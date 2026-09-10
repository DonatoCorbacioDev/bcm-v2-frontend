import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FinancialValueSummary from '@/components/financial-values/FinancialValueSummary';
import type { Budget, FinancialValue } from '@/types';

// Matches the component's own EUR_FORMATTER — computed rather than hardcoded
// so the assertions don't depend on the exact separators the host's ICU data
// produces for it-IT. The non-breaking space Intl inserts before "€" is
// normalized to a regular space to match Testing Library's own text
// normalization (which collapses it before comparing).
const eur = (n: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
    .format(n)
    .replace(/ /g, ' ');

function fv(overrides: Partial<FinancialValue>): FinancialValue {
  return {
    id: 1,
    month: 1,
    year: 2026,
    financialAmount: 0,
    financialTypeId: 1,
    businessAreaId: 1,
    contractId: 1,
    category: 'REVENUE',
    ...overrides,
  };
}

function budget(overrides: Partial<Budget>): Budget {
  return {
    id: 1,
    businessAreaId: 1,
    areaName: 'IT',
    category: 'REVENUE',
    year: 2026,
    targetAmount: 1000,
    actualAmount: 500,
    percentUsed: 50,
    ...overrides,
  };
}

describe('FinancialValueSummary', () => {
  it('sums revenue and cost for the selected year only', () => {
    const values = [
      fv({ id: 1, year: 2026, category: 'REVENUE', financialAmount: 1000 }),
      fv({ id: 2, year: 2026, category: 'COST', financialAmount: 400 }),
      fv({ id: 3, year: 2025, category: 'REVENUE', financialAmount: 9000 }), // different year, excluded
    ];
    render(<FinancialValueSummary financialValues={values} budgets={[]} year={2026} isAdmin={false} />);

    expect(screen.getByText('Ricavi 2026')).toBeInTheDocument();
    expect(screen.getByText(eur(1000))).toBeInTheDocument();
    expect(screen.getByText('Costi 2026')).toBeInTheDocument();
    expect(screen.getByText(eur(400))).toBeInTheDocument();
    expect(screen.getByText('Margine netto 2026')).toBeInTheDocument();
    expect(screen.getByText(eur(600))).toBeInTheDocument();
  });

  it('aggregates across all years when year is null', () => {
    const values = [
      fv({ id: 1, year: 2026, category: 'REVENUE', financialAmount: 1000 }),
      fv({ id: 2, year: 2025, category: 'REVENUE', financialAmount: 500 }),
      fv({ id: 3, year: 2026, category: 'COST', financialAmount: 200 }),
    ];
    render(<FinancialValueSummary financialValues={values} budgets={[]} year={null} isAdmin={false} />);

    expect(screen.getByText('Ricavi (tutti gli anni)')).toBeInTheDocument();
    expect(screen.getByText(eur(1500))).toBeInTheDocument();
    expect(screen.getByText('Costi (tutti gli anni)')).toBeInTheDocument();
    expect(screen.getByText(eur(200))).toBeInTheDocument();
  });

  it('shows a danger variant net margin when costs exceed revenue', () => {
    const values = [
      fv({ id: 1, category: 'REVENUE', financialAmount: 100 }),
      fv({ id: 2, category: 'COST', financialAmount: 300 }),
    ];
    render(
      <FinancialValueSummary financialValues={values} budgets={[]} year={2026} isAdmin={false} />
    );

    expect(screen.getByText(eur(-200))).toBeInTheDocument();
    const marginCard = screen.getByText('Margine netto 2026').closest('div')?.parentElement?.parentElement;
    expect(marginCard).toHaveClass('border-l-[var(--status-red-fg)]');
  });

  it('does not show the budget section when no year is selected', () => {
    render(
      <FinancialValueSummary
        financialValues={[]}
        budgets={[budget({ year: 2026 })]}
        year={null}
        isAdmin={false}
      />
    );

    expect(screen.queryByText(/Andamento rispetto al budget/)).not.toBeInTheDocument();
  });

  it('does not show the budget section when the selected year has no budgets', () => {
    render(
      <FinancialValueSummary
        financialValues={[]}
        budgets={[budget({ year: 2025 })]}
        year={2026}
        isAdmin={false}
      />
    );

    expect(screen.queryByText(/Andamento rispetto al budget/)).not.toBeInTheDocument();
  });

  it('shows budget rows scoped to the selected year, grouped under a Ricavi section', () => {
    const budgets = [
      budget({ id: 1, areaName: 'IT', category: 'REVENUE', year: 2026, percentUsed: 42 }),
      budget({ id: 2, areaName: 'Sales', category: 'COST', year: 2025, percentUsed: 99 }), // different year, excluded
    ];
    render(<FinancialValueSummary financialValues={[]} budgets={budgets} year={2026} isAdmin={false} />);

    expect(screen.getByText('Andamento rispetto al budget 2026')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ricavi' })).toBeInTheDocument();
    expect(screen.getByText('IT')).toBeInTheDocument();
    expect(screen.getByText('42%')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Costi' })).not.toBeInTheDocument();
    expect(screen.queryByText('Sales')).not.toBeInTheDocument();
  });

  it('groups a cost budget row under a Costi section, never mixed with Ricavi', () => {
    render(
      <FinancialValueSummary
        financialValues={[]}
        budgets={[budget({ category: 'COST', areaName: 'Marketing', percentUsed: 10 })]}
        year={2026}
        isAdmin={false}
      />
    );

    expect(screen.getByRole('heading', { name: 'Costi' })).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Ricavi' })).not.toBeInTheDocument();
  });

  it('sorts revenue budgets worst-first (lowest achievement on top)', () => {
    const budgets = [
      budget({ id: 1, areaName: 'On track', category: 'REVENUE', percentUsed: 95 }),
      budget({ id: 2, areaName: 'Behind', category: 'REVENUE', percentUsed: 20 }),
    ];
    render(<FinancialValueSummary financialValues={[]} budgets={budgets} year={2026} isAdmin={false} />);

    const names = screen.getAllByTitle(/On track|Behind/).map((el) => el.textContent);
    expect(names).toEqual(['Behind', 'On track']);
  });

  it('sorts cost budgets worst-first (highest overrun on top)', () => {
    const budgets = [
      budget({ id: 1, areaName: 'Under budget', category: 'COST', percentUsed: 30 }),
      budget({ id: 2, areaName: 'Over budget', category: 'COST', percentUsed: 140 }),
    ];
    render(<FinancialValueSummary financialValues={[]} budgets={budgets} year={2026} isAdmin={false} />);

    const names = screen.getAllByTitle(/Under budget|Over budget/).map((el) => el.textContent);
    expect(names).toEqual(['Over budget', 'Under budget']);
  });

  it('caps the progress bar width at 100% when a budget is over-used', () => {
    const { container } = render(
      <FinancialValueSummary
        financialValues={[]}
        budgets={[budget({ percentUsed: 150 })]}
        year={2026}
        isAdmin={false}
      />
    );

    expect(screen.getByText('150%')).toBeInTheDocument();
    const bar = container.querySelector('[style*="width"]');
    expect(bar).toHaveStyle({ width: '100%' });
  });

  it('uses the green tone for a revenue budget over 100% achieved (target exceeded is good news)', () => {
    const { container } = render(
      <FinancialValueSummary
        financialValues={[]}
        budgets={[budget({ category: 'REVENUE', percentUsed: 127 })]}
        year={2026}
        isAdmin={false}
      />
    );

    expect(screen.getByText('127%')).toHaveClass('text-[var(--status-green-fg)]');
    const bar = container.querySelector('[style*="width"]');
    expect(bar).toHaveClass('bg-[var(--status-green-fg)]');
  });

  it('uses the red tone for a cost budget over 100% used (over budget is bad news)', () => {
    const { container } = render(
      <FinancialValueSummary
        financialValues={[]}
        budgets={[budget({ category: 'COST', percentUsed: 127 })]}
        year={2026}
        isAdmin={false}
      />
    );

    expect(screen.getByText('127%')).toHaveClass('text-[var(--status-red-fg)]');
    const bar = container.querySelector('[style*="width"]');
    expect(bar).toHaveClass('bg-[var(--status-red-fg)]');
  });

  it('uses the amber tone for a budget between 80% and 100% used', () => {
    const { container } = render(
      <FinancialValueSummary
        financialValues={[]}
        budgets={[budget({ percentUsed: 85 })]}
        year={2026}
        isAdmin={false}
      />
    );

    expect(screen.getByText('85%')).toHaveClass('text-[var(--status-amber-fg)]');
    const bar = container.querySelector('[style*="width"]');
    expect(bar).toHaveClass('bg-[var(--status-amber-fg)]');
  });

  it('calls onAreaClick with the area id and name when a budget row is clicked', async () => {
    const onAreaClick = jest.fn();
    render(
      <FinancialValueSummary
        financialValues={[]}
        budgets={[budget({ id: 7, businessAreaId: 42, areaName: 'IT', percentUsed: 50 })]}
        year={2026}
        isAdmin={false}
        onAreaClick={onAreaClick}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /IT/ }));
    expect(onAreaClick).toHaveBeenCalledWith({ id: 42, name: 'IT' });
  });

  it('calls onAreaClick when Enter or Space is pressed on a budget row, but not on other keys', () => {
    const onAreaClick = jest.fn();
    render(
      <FinancialValueSummary
        financialValues={[]}
        budgets={[budget({ id: 7, businessAreaId: 42, areaName: 'IT', percentUsed: 50 })]}
        year={2026}
        isAdmin={false}
        onAreaClick={onAreaClick}
      />
    );

    const row = screen.getByRole('button', { name: /IT/ });
    fireEvent.keyDown(row, { key: 'Tab' });
    expect(onAreaClick).not.toHaveBeenCalled();

    fireEvent.keyDown(row, { key: 'Enter' });
    fireEvent.keyDown(row, { key: ' ' });
    expect(onAreaClick).toHaveBeenCalledTimes(2);
    expect(onAreaClick).toHaveBeenCalledWith({ id: 42, name: 'IT' });
  });

  it('is not rendered as a clickable button when onAreaClick is not provided', () => {
    render(
      <FinancialValueSummary
        financialValues={[]}
        budgets={[budget({ areaName: 'IT', percentUsed: 50 })]}
        year={2026}
        isAdmin={false}
      />
    );

    expect(screen.queryByRole('button', { name: /IT/ })).not.toBeInTheDocument();
  });

  it('highlights the selected area row', () => {
    render(
      <FinancialValueSummary
        financialValues={[]}
        budgets={[budget({ businessAreaId: 42, areaName: 'IT', percentUsed: 50 })]}
        year={2026}
        isAdmin={false}
        selectedAreaId={42}
        onAreaClick={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /IT/ })).toHaveClass('bg-muted');
  });

  it('shows the "Gestisci budget" link only for admins', () => {
    const budgets = [budget({})];
    const { rerender } = render(
      <FinancialValueSummary financialValues={[]} budgets={budgets} year={2026} isAdmin={true} />
    );
    expect(screen.getByRole('link', { name: 'Gestisci budget' })).toHaveAttribute('href', '/budgets');

    rerender(<FinancialValueSummary financialValues={[]} budgets={budgets} year={2026} isAdmin={false} />);
    expect(screen.queryByRole('link', { name: 'Gestisci budget' })).not.toBeInTheDocument();
  });
});
