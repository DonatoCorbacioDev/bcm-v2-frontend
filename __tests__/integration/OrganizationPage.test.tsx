import React from 'react';
import { render, screen } from '@testing-library/react';
import { createWrapper } from '../mocks/wrapper';

const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/services/organization.service', () => ({
  organizationService: {
    getMine: jest.fn(),
    getUsage: jest.fn(),
    update: jest.fn(),
    startProCheckout: jest.fn(),
  },
}));

jest.mock('@/lib/externalRedirect', () => ({
  redirectToExternal: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: Object.assign(jest.fn(), { success: jest.fn(), error: jest.fn() }),
}));

import userEvent from '@testing-library/user-event';
import { waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { organizationService } from '@/services/organization.service';
import { redirectToExternal } from '@/lib/externalRedirect';
import OrganizationPage from '@/app/(dashboard)/organization/page';

const mockAuthAs = (role: string | null) => {
  (useAuthStore as unknown as jest.Mock).mockImplementation((selector) => {
    const state = { user: role ? { id: 1, username: 'user', role } : null };
    return selector ? selector(state) : state;
  });
};

const organization = {
  id: 1, name: 'Acme', slug: 'acme', subscriptionTier: 'FREE',
  iban: null, bic: null, createdAt: '2024-01-01',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthAs('ADMIN');
});

describe('OrganizationPage', () => {
  it('redirects a non-admin to /dashboard and renders nothing', () => {
    mockAuthAs('MANAGER');
    (organizationService.getMine as jest.Mock).mockResolvedValue(organization);
    (organizationService.getUsage as jest.Mock).mockResolvedValue({ contractsUsed: 0, contractsLimit: 15 });

    const { container } = render(<OrganizationPage />, { wrapper: createWrapper() });

    expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the plan badge and contract usage for a limited tier', async () => {
    (organizationService.getMine as jest.Mock).mockResolvedValue(organization);
    (organizationService.getUsage as jest.Mock).mockResolvedValue({ contractsUsed: 8, contractsLimit: 15 });

    render(<OrganizationPage />, { wrapper: createWrapper() });

    expect(await screen.findByText('Free')).toBeInTheDocument();
    expect(await screen.findByText('8 / 15')).toBeInTheDocument();
  });

  it('shows "(illimitati)" when the tier has no contract limit', async () => {
    (organizationService.getMine as jest.Mock).mockResolvedValue({ ...organization, subscriptionTier: 'ENTERPRISE' });
    (organizationService.getUsage as jest.Mock).mockResolvedValue({ contractsUsed: 300, contractsLimit: null });

    render(<OrganizationPage />, { wrapper: createWrapper() });

    expect(await screen.findByText('300 (illimitati)')).toBeInTheDocument();
  });

  it('does not show the usage row while it is still loading', () => {
    (organizationService.getMine as jest.Mock).mockResolvedValue(organization);
    (organizationService.getUsage as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(<OrganizationPage />, { wrapper: createWrapper() });

    expect(screen.queryByText(/^\d+ \/ \d+$/)).not.toBeInTheDocument();
  });

  describe('upgrade to PRO', () => {
    beforeEach(() => {
      (organizationService.getUsage as jest.Mock).mockResolvedValue({ contractsUsed: 8, contractsLimit: 15 });
    });

    afterEach(() => {
      window.history.replaceState({}, '', '/');
    });

    it('redirects to the Stripe checkout URL when a FREE org clicks "Passa a PRO"', async () => {
      (organizationService.getMine as jest.Mock).mockResolvedValue(organization);
      (organizationService.startProCheckout as jest.Mock).mockResolvedValue('https://checkout.stripe.com/c/pay/cs_test_1');

      render(<OrganizationPage />, { wrapper: createWrapper() });
      await userEvent.click(await screen.findByRole('button', { name: 'Passa a PRO' }));

      await waitFor(() =>
        expect(redirectToExternal).toHaveBeenCalledWith('https://checkout.stripe.com/c/pay/cs_test_1'),
      );
    });

    it('shows an error toast and does not redirect when checkout cannot start', async () => {
      (organizationService.getMine as jest.Mock).mockResolvedValue(organization);
      (organizationService.startProCheckout as jest.Mock).mockRejectedValue(new Error('503'));

      render(<OrganizationPage />, { wrapper: createWrapper() });
      await userEvent.click(await screen.findByRole('button', { name: 'Passa a PRO' }));

      await waitFor(() => expect(toast.error).toHaveBeenCalled());
      expect(redirectToExternal).not.toHaveBeenCalled();
    });

    it('does not offer the upgrade to an org already on a paid plan', async () => {
      (organizationService.getMine as jest.Mock).mockResolvedValue({ ...organization, subscriptionTier: 'PRO' });

      render(<OrganizationPage />, { wrapper: createWrapper() });

      expect(await screen.findByText('8 / 15')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Passa a PRO' })).not.toBeInTheDocument();
    });

    it('confirms a completed payment on return from Stripe and cleans the URL', async () => {
      window.history.replaceState({}, '', '/organization?checkout=success');
      (organizationService.getMine as jest.Mock).mockResolvedValue(organization);

      render(<OrganizationPage />, { wrapper: createWrapper() });

      await waitFor(() => expect(toast.success).toHaveBeenCalled());
      expect(mockReplace).toHaveBeenCalledWith('/organization');
    });

    it('tells the user nothing was charged when they cancel on Stripe', async () => {
      window.history.replaceState({}, '', '/organization?checkout=cancel');
      (organizationService.getMine as jest.Mock).mockResolvedValue(organization);

      render(<OrganizationPage />, { wrapper: createWrapper() });

      await waitFor(() => expect(toast).toHaveBeenCalledWith('Pagamento annullato, nessun addebito effettuato'));
      expect(mockReplace).toHaveBeenCalledWith('/organization');
    });
  });
});
