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
}));

jest.mock('@/hooks/useExpiringContracts', () => ({
  useExpiringContracts: jest.fn(),
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

  it('does NOT redirect when ADMIN has at least one manager', async () => {
    mockAdmin(1);
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/managers') return Promise.resolve({ data: [{ id: 1, firstName: 'Marco', lastName: 'Rossi', email: 'a@b.com', phoneNumber: '123', department: 'IT' }] });
      return Promise.resolve({ data: [] });
    });

    render(<DashboardPage />, { wrapper: createWrapper() });

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/managers'));
    expect(mockPush).not.toHaveBeenCalledWith('/onboarding');
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
