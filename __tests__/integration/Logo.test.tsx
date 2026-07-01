import React from 'react';
import { render, screen } from '@testing-library/react';
import Logo, { LogoMark } from '@/components/layout/Logo';

describe('LogoMark', () => {
  it('renders an svg', () => {
    const { container } = render(<LogoMark />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies className to the svg element', () => {
    const { container } = render(<LogoMark className="h-12 w-12" />);
    expect(container.querySelector('svg')).toHaveClass('h-12 w-12');
  });

  it('renders with custom size', () => {
    const { container } = render(<LogoMark size={48} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '48');
    expect(svg).toHaveAttribute('height', '48');
  });
});

describe('Logo', () => {
  it('shows the wordmark by default', () => {
    render(<Logo />);
    expect(screen.getByText(/business contracts/i)).toBeInTheDocument();
  });

  it('hides the wordmark when showWordmark is false', () => {
    render(<Logo showWordmark={false} />);
    expect(screen.queryByText(/business contracts/i)).not.toBeInTheDocument();
  });

  it('renders the wrapper span with inline-flex', () => {
    const { container } = render(<Logo />);
    expect(container.querySelector('span')).toHaveClass('inline-flex');
  });

  it('applies custom className to wrapper', () => {
    const { container } = render(<Logo className="custom-wrapper" />);
    expect(container.querySelector('span')).toHaveClass('custom-wrapper');
  });

  it('applies iconClassName to the svg (backward compat)', () => {
    const { container } = render(<Logo iconClassName="h-4 w-4" />);
    expect(container.querySelector('svg')).toHaveClass('h-4 w-4');
  });
});
