import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { createWrapper } from '../mocks/wrapper';

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/services/organization.service', () => ({
  organizationService: { getMine: jest.fn() },
}));

import { useAuthStore } from '@/store/authStore';
import { organizationService } from '@/services/organization.service';
import { DeletionScheduledBanner } from '@/components/organization/DeletionScheduledBanner';

const mockAuthAs = (role: string) => {
  (useAuthStore as unknown as jest.Mock).mockImplementation((selector) =>
    selector({ user: { id: 1, username: 'u', role } }));
};

const organization = (deletionScheduledFor: string | null) => ({
  id: 1, name: 'Acme', slug: 'acme', subscriptionTier: 'FREE', iban: null, bic: null,
  createdAt: '2024-01-01', billingPortalAvailable: false, deletionScheduledFor,
});

beforeEach(() => jest.clearAllMocks());

describe('DeletionScheduledBanner', () => {
  it('warns an admin on every page with the date and a link to cancel', async () => {
    mockAuthAs('ADMIN');
    (organizationService.getMine as jest.Mock).mockResolvedValue(organization('2026-12-03T02:00:00'));

    render(<DeletionScheduledBanner />, { wrapper: createWrapper() });

    expect(await screen.findByRole('region', { name: 'Cancellazione programmata' })).toHaveTextContent('saranno cancellati il 3 dicembre 2026');
    expect(screen.getByRole('link', { name: 'Annulla o esporta i dati' }))
      .toHaveAttribute('href', '/organization#cancellazione');
  });

  it('shows nothing when no deletion is scheduled', async () => {
    mockAuthAs('ADMIN');
    (organizationService.getMine as jest.Mock).mockResolvedValue(organization(null));

    const { container } = render(<DeletionScheduledBanner />, { wrapper: createWrapper() });

    await waitFor(() => expect(organizationService.getMine).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('shows nothing and asks nothing while nobody is signed in', () => {
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector) => selector({ user: null }));

    const { container } = render(<DeletionScheduledBanner />, { wrapper: createWrapper() });

    expect(container).toBeEmptyDOMElement();
    expect(organizationService.getMine).not.toHaveBeenCalled();
  });

  it('never asks a manager for the organization (admin-only endpoint)', () => {
    mockAuthAs('MANAGER');

    const { container } = render(<DeletionScheduledBanner />, { wrapper: createWrapper() });

    expect(container).toBeEmptyDOMElement();
    expect(organizationService.getMine).not.toHaveBeenCalled();
  });
});
