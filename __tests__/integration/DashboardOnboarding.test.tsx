import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { createWrapper } from '../mocks/wrapper';

// ─── Module mocks ────────────────────────────────────────────────────────────

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/hooks/useDashboardStats', () => ({
  useDashboardStats: jest.fn(),
  useInvoicingSummary: () => ({ data: undefined }),
}));

jest.mock('@/hooks/useExpiringContracts', () => ({
  useExpiringContracts: jest.fn(),
}));

// The home list has its own tests (DashboardPage.test); here only the redirect matters.
jest.mock('@/hooks/useHomeAttention', () => ({
  useHomeAttention: () => ({
    data: { dueSoonCount: 0, invoicesToMatchCount: 0, ibanAlertsCount: 0, windowDays: 30, items: [] },
    isLoading: false,
    isError: false,
  }),
}));

jest.mock('@/lib/api', () => {
  const shared = { get: jest.fn() };
  return { __esModule: true, api: shared, default: shared };
});

// ─── Imports after mocks ─────────────────────────────────────────────────────

import { useAuthStore } from '@/store/authStore';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useExpiringContracts } from '@/hooks/useExpiringContracts';
import { api } from '@/lib/api';
import DashboardPage from '@/app/(dashboard)/dashboard/page';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mockAdmin(id = 1) {
  (useAuthStore as unknown as jest.Mock).mockImplementation((selector) =>
    selector({ user: { id, role: 'ADMIN', username: 'admin@test.com' } })
  );
}

function mockManager() {
  (useAuthStore as unknown as jest.Mock).mockImplementation((selector) =>
    selector({ user: { id: 99, role: 'MANAGER', username: 'mgr@test.com' } })
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('DashboardPage — onboarding redirect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (useDashboardStats as jest.Mock).mockReturnValue({ data: null, isLoading: true, isError: false });
    (useExpiringContracts as jest.Mock).mockReturnValue({ data: [], isLoading: false, isError: false });
  });

  it('redirects ADMIN with empty org to /onboarding', async () => {
    mockAdmin(1);
    (api.get as jest.Mock).mockResolvedValue({ data: [] }); // empty BA + managers

    render(<DashboardPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding');
    });
  });

  it('does NOT redirect when ADMIN has at least one business area', async () => {
    mockAdmin(1);
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/business-areas') return Promise.resolve({ data: [{ id: 1, name: 'IT', description: 'Desc' }] });
      return Promise.resolve({ data: [] });
    });

    render(<DashboardPage />, { wrapper: createWrapper() });

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/business-areas'));
    expect(mockPush).not.toHaveBeenCalledWith('/onboarding');
  });

  it('does NOT send the user back to the wizard on a stale empty list just after it created the first area', async () => {
    mockAdmin(1);
    // The cache still holds the list seen before the wizard (empty, stale);
    // the refetch on mount returns the area the wizard just created.
    const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query');
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(['reference', 'business-areas'], []);
    // The wizard's manager step leaves the managers in the cache as well.
    client.setQueryData(['reference', 'managers'], [{ id: 1, firstName: 'Lucia', lastName: 'Verdi', email: 'l@v.it' }]);
    await client.invalidateQueries({ queryKey: ['reference', 'business-areas'] });
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/business-areas') return Promise.resolve({ data: [{ id: 1, name: 'Acquisti', description: '' }] });
      return Promise.resolve({ data: [] });
    });

    render(
      <QueryClientProvider client={client}><DashboardPage /></QueryClientProvider>,
    );

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/business-areas'));
    await waitFor(() => expect(client.getQueryData(['reference', 'business-areas'])).toHaveLength(1));
    expect(mockPush).not.toHaveBeenCalledWith('/onboarding');
  });

  it('still redirects when ADMIN has a manager but no business area (registration always creates one manager)', async () => {
    mockAdmin(1);
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/managers') return Promise.resolve({ data: [{ id: 1, firstName: 'Marco', lastName: 'Rossi', email: 'a@b.com', phoneNumber: '123', department: 'IT' }] });
      return Promise.resolve({ data: [] });
    });

    render(<DashboardPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding');
    });
  });

  it('does NOT redirect when the wizard was previously dismissed', async () => {
    mockAdmin(1);
    localStorage.setItem('bcm-setup-skip-1', '1');
    (api.get as jest.Mock).mockResolvedValue({ data: [] });

    render(<DashboardPage />, { wrapper: createWrapper() });

    await waitFor(() => expect(api.get).toHaveBeenCalled());
    expect(mockPush).not.toHaveBeenCalledWith('/onboarding');
  });

  it('does NOT redirect for MANAGER role even with empty org', async () => {
    mockManager();
    (api.get as jest.Mock).mockResolvedValue({ data: [] });

    render(<DashboardPage />, { wrapper: createWrapper() });

    // Give React time to settle; no redirect should happen
    await new Promise((r) => setTimeout(r, 50));
    expect(mockPush).not.toHaveBeenCalledWith('/onboarding');
  });
});
