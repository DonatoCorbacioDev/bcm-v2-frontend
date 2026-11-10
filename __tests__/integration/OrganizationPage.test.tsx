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
    openBillingPortal: jest.fn(),
    exportAll: jest.fn(),
    requestDeletion: jest.fn(),
    confirmDeletion: jest.fn(),
    cancelDeletion: jest.fn(),
  },
}));

jest.mock('@/lib/download', () => ({
  downloadBlob: jest.fn(),
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
import { downloadBlob } from '@/lib/download';
import { AxiosError, AxiosHeaders } from 'axios';
import OrganizationPage from '@/app/(dashboard)/organization/page';
import { uid } from "../mocks/ids";

const mockAuthAs = (role: string | null) => {
  (useAuthStore as unknown as jest.Mock).mockImplementation((selector) => {
    const state = { user: role ? { id: uid(1), username: 'user', role } : null };
    return selector ? selector(state) : state;
  });
};

const organization = {
  id: uid(1), name: 'Acme', slug: 'acme', subscriptionTier: 'FREE',
  iban: null, bic: null, createdAt: '2024-01-01', billingPortalAvailable: false,
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

    it('offers a FREE org to ask about Pro, without starting a payment (Pro is not for sale yet)', async () => {
      (organizationService.getMine as jest.Mock).mockResolvedValue(organization);

      render(<OrganizationPage />, { wrapper: createWrapper() });

      const ask = await screen.findByRole('link', { name: 'Richiedi informazioni sul Pro' });
      expect(ask.getAttribute('href')).toMatch(/^mailto:/);
      expect(screen.queryByRole('button', { name: 'Passa a PRO' })).not.toBeInTheDocument();
      expect(organizationService.startProCheckout).not.toHaveBeenCalled();
    });

    it('does not offer the upgrade to an org already on a paid plan', async () => {
      (organizationService.getMine as jest.Mock).mockResolvedValue({ ...organization, subscriptionTier: 'PRO' });

      render(<OrganizationPage />, { wrapper: createWrapper() });

      expect(await screen.findByText('8 / 15')).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Richiedi informazioni sul Pro' })).not.toBeInTheDocument();
    });

    it('lets a Stripe-subscribed org open the Customer Portal', async () => {
      (organizationService.getMine as jest.Mock).mockResolvedValue({
        ...organization, subscriptionTier: 'PRO', billingPortalAvailable: true,
      });
      (organizationService.openBillingPortal as jest.Mock).mockResolvedValue('https://billing.stripe.com/p/session/test_1');

      render(<OrganizationPage />, { wrapper: createWrapper() });
      await userEvent.click(await screen.findByRole('button', { name: 'Gestisci abbonamento' }));

      await waitFor(() =>
        expect(redirectToExternal).toHaveBeenCalledWith('https://billing.stripe.com/p/session/test_1'),
      );
    });

    it('does not offer the portal for a paid plan granted by hand (no Stripe customer)', async () => {
      (organizationService.getMine as jest.Mock).mockResolvedValue({
        ...organization, subscriptionTier: 'PRO', billingPortalAvailable: false,
      });

      render(<OrganizationPage />, { wrapper: createWrapper() });

      expect(await screen.findByText('8 / 15')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Gestisci abbonamento' })).not.toBeInTheDocument();
    });

    it('shows an error toast and does not redirect when the portal cannot open', async () => {
      (organizationService.getMine as jest.Mock).mockResolvedValue({
        ...organization, subscriptionTier: 'PRO', billingPortalAvailable: true,
      });
      (organizationService.openBillingPortal as jest.Mock).mockRejectedValue(new Error('502'));

      render(<OrganizationPage />, { wrapper: createWrapper() });
      await userEvent.click(await screen.findByRole('button', { name: 'Gestisci abbonamento' }));

      await waitFor(() => expect(toast.error).toHaveBeenCalled());
      expect(redirectToExternal).not.toHaveBeenCalled();
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

  describe('data export', () => {
    beforeEach(() => {
      (organizationService.getMine as jest.Mock).mockResolvedValue(organization);
      (organizationService.getUsage as jest.Mock).mockResolvedValue({ contractsUsed: 0, contractsLimit: 15 });
    });

    it('downloads the archive under the name the server chose', async () => {
      const blob = new Blob(['zip']);
      (organizationService.exportAll as jest.Mock).mockResolvedValue({
        blob, filename: 'bcm-export-acme-2026-10-29.zip',
      });
      render(<OrganizationPage />, { wrapper: createWrapper() });

      await userEvent.click(await screen.findByRole('button', { name: 'Esporta tutti i dati' }));

      await waitFor(() => expect(downloadBlob).toHaveBeenCalledWith(blob, 'bcm-export-acme-2026-10-29.zip'));
      expect(toast.success).toHaveBeenCalledWith('Archivio scaricato');
    });

    it('disables the button while the archive is being prepared', async () => {
      (organizationService.exportAll as jest.Mock).mockReturnValue(new Promise(() => {}));
      render(<OrganizationPage />, { wrapper: createWrapper() });

      await userEvent.click(await screen.findByRole('button', { name: 'Esporta tutti i dati' }));

      expect(await screen.findByRole('button', { name: "Preparazione dell'archivio..." })).toBeDisabled();
    });

    it('explains a rate-limited export instead of a generic error', async () => {
      const tooMany = new AxiosError('Too Many Requests', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 429, statusText: 'Too Many Requests', data: {}, headers: {},
        config: { headers: new AxiosHeaders() },
      });
      (organizationService.exportAll as jest.Mock).mockRejectedValue(tooMany);
      render(<OrganizationPage />, { wrapper: createWrapper() });

      await userEvent.click(await screen.findByRole('button', { name: 'Esporta tutti i dati' }));

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('Troppe esportazioni ravvicinate, riprova tra un minuto'));
      expect(downloadBlob).not.toHaveBeenCalled();
    });

    it('shows a generic error when the export fails', async () => {
      (organizationService.exportAll as jest.Mock).mockRejectedValue(new Error('network'));
      render(<OrganizationPage />, { wrapper: createWrapper() });

      await userEvent.click(await screen.findByRole('button', { name: 'Esporta tutti i dati' }));

      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Esportazione non riuscita, riprova più tardi'));
    });
  });

  describe('deletion', () => {
    it('offers the danger zone at the bottom of the page', async () => {
      (organizationService.getMine as jest.Mock).mockResolvedValue({ ...organization, deletionScheduledFor: null });
      (organizationService.getUsage as jest.Mock).mockResolvedValue({ contractsUsed: 0, contractsLimit: 15 });
      render(<OrganizationPage />, { wrapper: createWrapper() });

      expect(await screen.findByText('Zona pericolosa')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancella organizzazione' })).toBeInTheDocument();
    });

    it('shows the scheduled date and the cancel button instead once confirmed', async () => {
      (organizationService.getMine as jest.Mock).mockResolvedValue({
        ...organization, deletionScheduledFor: '2026-12-03T02:00:00',
      });
      (organizationService.getUsage as jest.Mock).mockResolvedValue({ contractsUsed: 0, contractsLimit: 15 });
      render(<OrganizationPage />, { wrapper: createWrapper() });

      expect(await screen.findByRole('button', { name: 'Annulla la cancellazione' })).toBeInTheDocument();
      expect(screen.queryByText('Zona pericolosa')).not.toBeInTheDocument();
    });
  });
});
