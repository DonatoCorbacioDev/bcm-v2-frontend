import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LegalPageShell } from '@/components/legal/LegalPageShell';

describe('LegalPageShell', () => {
  it('renders the title, last-updated date, and children', () => {
    render(
      <LegalPageShell title="Privacy Policy" lastUpdated="1 Gennaio 2026">
        <p>Corpo della pagina</p>
      </LegalPageShell>,
    );

    expect(screen.getByRole('heading', { name: 'Privacy Policy' })).toBeInTheDocument();
    expect(screen.getByText(/1 Gennaio 2026/)).toBeInTheDocument();
    expect(screen.getByText('Corpo della pagina')).toBeInTheDocument();
  });

  it('toggles dark mode when the theme button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <LegalPageShell title="Privacy Policy" lastUpdated="1 Gennaio 2026">
        <p>Corpo</p>
      </LegalPageShell>,
    );

    expect(document.documentElement.classList.contains('dark')).toBe(false);

    await user.click(screen.getByRole('button', { name: /modalità scura/i }));

    expect(document.documentElement.classList.contains('dark')).toBe(true);

    await user.click(screen.getByRole('button', { name: /modalità chiara/i }));

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('links back to the home page', () => {
    render(
      <LegalPageShell title="Privacy Policy" lastUpdated="1 Gennaio 2026">
        <p>Corpo</p>
      </LegalPageShell>,
    );

    expect(screen.getByRole('link', { name: 'Home BCM' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /torna alla home/i })).toHaveAttribute('href', '/');
  });
});
