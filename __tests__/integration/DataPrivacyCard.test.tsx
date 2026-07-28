import React from 'react';
import { render, screen } from '@testing-library/react';
import DataPrivacyCard from '@/components/profile/DataPrivacyCard';

describe('DataPrivacyCard', () => {
  it('links to the full privacy policy', () => {
    render(<DataPrivacyCard />);

    expect(screen.getByRole('link', { name: /informativa privacy completa/i }))
      .toHaveAttribute('href', '/privacy');
  });

  it('provides a mailto link to request a data export', () => {
    render(<DataPrivacyCard />);

    const link = screen.getByRole('link', { name: /richiedi esportazione dati/i });
    expect(link.getAttribute('href')).toContain('mailto:donatocorbacio92@gmail.com');
    expect(link.getAttribute('href')).toContain(encodeURIComponent('Richiesta esportazione dati - BCM'));
  });

  it('provides a mailto link to request account deletion', () => {
    render(<DataPrivacyCard />);

    const link = screen.getByRole('link', { name: /richiedi cancellazione account/i });
    expect(link.getAttribute('href')).toContain('mailto:donatocorbacio92@gmail.com');
    expect(link.getAttribute('href')).toContain(encodeURIComponent('Richiesta cancellazione account - BCM'));
  });
});
