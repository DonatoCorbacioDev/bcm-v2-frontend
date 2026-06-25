import React from 'react';
import { render, screen } from '@testing-library/react';
import Logo, { LogoMark } from '@/components/layout/Logo';

describe('LogoMark', () => {
  it('renders an svg with the given className', () => {
    const { container } = render(<LogoMark className="h-12 w-12" />);
    expect(container.querySelector('svg')).toHaveClass('h-12 w-12');
  });
});

describe('Logo', () => {
  it('shows the BCM wordmark by default', () => {
    render(<Logo />);
    expect(screen.getByText('BCM')).toBeInTheDocument();
  });

  it('hides the wordmark when showWordmark is false', () => {
    render(<Logo showWordmark={false} />);
    expect(screen.queryByText('BCM')).not.toBeInTheDocument();
  });

  it('falls back to default classes when none are provided', () => {
    const { container } = render(<Logo />);
    expect(container.querySelector('span')).toHaveClass('inline-flex');
    expect(container.querySelector('svg')).toHaveClass('h-8 w-8');
  });

  it('applies custom className and iconClassName when provided', () => {
    const { container } = render(<Logo className="custom-wrapper" iconClassName="h-4 w-4" />);
    expect(container.querySelector('span')).toHaveClass('custom-wrapper');
    expect(container.querySelector('svg')).toHaveClass('h-4 w-4');
  });
});
