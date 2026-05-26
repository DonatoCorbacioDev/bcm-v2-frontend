import React from 'react';
import { render, screen } from '@testing-library/react';
import KPICard from '@/components/dashboard/KPICard';

describe('KPICard', () => {
  it('renders the title and value', () => {
    render(<KPICard title="Total Contracts" value={42} />);

    expect(screen.getByText('Total Contracts')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders zero value correctly', () => {
    render(<KPICard title="Active" value={0} />);

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders the icon when provided', () => {
    render(<KPICard title="Expiring" value={3} icon={<span data-testid="icon">⚠️</span>} />);

    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders without icon when not provided', () => {
    const { container } = render(<KPICard title="Total" value={10} />);

    // Icon wrapper div is absent — only one child div inside the flex container
    const flexContainer = container.querySelector('.flex');
    expect(flexContainer?.children).toHaveLength(1);
  });

  it('applies the default variant styles', () => {
    const { container } = render(<KPICard title="Default" value={1} />);

    expect(container.firstChild).toHaveClass('border-blue-200');
  });

  it('applies success variant styles', () => {
    const { container } = render(<KPICard title="Active" value={5} variant="success" />);

    expect(container.firstChild).toHaveClass('border-green-200');
  });

  it('applies warning variant styles', () => {
    const { container } = render(<KPICard title="Expiring" value={2} variant="warning" />);

    expect(container.firstChild).toHaveClass('border-yellow-200');
  });

  it('applies danger variant styles', () => {
    const { container } = render(<KPICard title="Expired" value={7} variant="danger" />);

    expect(container.firstChild).toHaveClass('border-red-200');
  });
});
