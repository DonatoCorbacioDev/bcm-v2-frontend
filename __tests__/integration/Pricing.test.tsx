import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { Pricing } from '@/components/landing/Pricing';

/**
 * The price list is a promise to customers: it must match what the backend
 * enforces (15 / 200 contracts, Pro checkout switched off) and promise
 * nothing hidden, undecided or absolute.
 */
describe('Pricing', () => {
  const card = (name: string) => screen.getByRole('heading', { level: 3, name }).closest('div')!.parentElement!;

  it('offers two plans: Free available now, Pro not for sale yet with no price', () => {
    render(<Pricing />);

    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Free', 'Pro']);
    expect(within(card('Free')).getByText('Gratuito')).toBeInTheDocument();
    expect(within(card('Free')).getByText('Fino a 15 contratti')).toBeInTheDocument();
    expect(within(card('Pro')).getByText('Prezzo in definizione')).toBeInTheDocument();
    expect(within(card('Pro')).getByText('Non ancora acquistabile')).toBeInTheDocument();
    expect(within(card('Pro')).getByText('Fino a 200 contratti')).toBeInTheDocument();
  });

  it('asks about Pro by email instead of selling it, and invites larger needs to write', () => {
    render(<Pricing />);

    expect(screen.getByRole('link', { name: 'Richiedi informazioni' }).getAttribute('href')).toMatch(/^mailto:/);
    expect(screen.getByRole('link', { name: 'Scrivici per parlarne' }).getAttribute('href')).toMatch(/^mailto:/);
    expect(screen.getByRole('link', { name: 'Inizia gratis' })).toHaveAttribute('href', '/register-org');
  });

  it.each([/€/, /per sempre/i, /enterprise/i, /\bAI\b|intelligenza artificiale/i, /frode|antifrode/i, /GDPR/i, /illimitat/i])(
    'promises nothing hidden, undecided or absolute (%s)',
    (forbidden) => {
      const { container } = render(<Pricing />);

      expect(container.textContent).not.toMatch(forbidden);
    }
  );
});
