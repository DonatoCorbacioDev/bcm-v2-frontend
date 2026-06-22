import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// ─── Module mocks ────────────────────────────────────────────────────────────

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

const mockApiPost = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { post: (...args: unknown[]) => mockApiPost(...args) },
}));

jest.mock('@/components/layout/Header', () => ({
  __esModule: true,
  default: () => <div>Header</div>,
}));

jest.mock('@/components/layout/Sidebar', () => ({
  __esModule: true,
  default: () => <div>Sidebar</div>,
}));

// ─── Imports that reference mocked modules ───────────────────────────────────

import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/app/(dashboard)/layout';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockSetAccessToken = jest.fn();
const mockClearAuth = jest.fn();

function mockAuthState(state: { isAuthenticated: boolean; accessToken: string | null }) {
  (useAuthStore as unknown as jest.Mock).mockImplementation((selector) =>
    selector({
      isAuthenticated: state.isAuthenticated,
      accessToken: state.accessToken,
      setAccessToken: mockSetAccessToken,
      clearAuth: mockClearAuth,
    })
  );
}

describe('DashboardLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to /login when not authenticated', () => {
    mockAuthState({ isAuthenticated: false, accessToken: null });
    render(<DashboardLayout>content</DashboardLayout>);
    expect(screen.getByText(/verifying authentication/i)).toBeInTheDocument();
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('renders children immediately when an access token is already in memory', () => {
    mockAuthState({ isAuthenticated: true, accessToken: 'in-memory-token' });
    render(<DashboardLayout>content</DashboardLayout>);
    expect(screen.getByText('content')).toBeInTheDocument();
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it('silently restores the session via /auth/refresh when accessToken is missing after reload', async () => {
    mockAuthState({ isAuthenticated: true, accessToken: null });
    mockApiPost.mockResolvedValue({ data: { token: 'restored-token' } });

    render(<DashboardLayout>content</DashboardLayout>);
    expect(screen.getByText(/verifying authentication/i)).toBeInTheDocument();

    await waitFor(() => expect(mockApiPost).toHaveBeenCalledWith('/auth/refresh'));
    await waitFor(() => expect(mockSetAccessToken).toHaveBeenCalledWith('restored-token'));
  });

  it('clears auth and redirects to /login when the silent refresh fails', async () => {
    mockAuthState({ isAuthenticated: true, accessToken: null });
    mockApiPost.mockRejectedValue(new Error('no valid refresh cookie'));

    render(<DashboardLayout>content</DashboardLayout>);

    await waitFor(() => expect(mockClearAuth).toHaveBeenCalled());
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
