import { renderHook, waitFor } from '@testing-library/react';

// ─── Module mocks ────────────────────────────────────────────────────────────

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

const mockApiPost = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { post: (...args: unknown[]) => mockApiPost(...args) },
}));

// ─── Imports that reference mocked modules ───────────────────────────────────

import { useAuthStore } from '@/store/authStore';
import { useSessionGuard } from '@/hooks/useSessionGuard';

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

describe('useSessionGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does nothing when not authenticated', () => {
    mockAuthState({ isAuthenticated: false, accessToken: null });
    renderHook(() => useSessionGuard());
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it('does nothing when an access token is already in memory', () => {
    mockAuthState({ isAuthenticated: true, accessToken: 'in-memory-token' });
    renderHook(() => useSessionGuard());
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it('restores the access token via /auth/refresh when authenticated but no token in memory', async () => {
    mockAuthState({ isAuthenticated: true, accessToken: null });
    mockApiPost.mockResolvedValue({ data: { token: 'restored-token' } });

    renderHook(() => useSessionGuard());

    await waitFor(() => expect(mockApiPost).toHaveBeenCalledWith('/auth/refresh'));
    await waitFor(() => expect(mockSetAccessToken).toHaveBeenCalledWith('restored-token'));
    expect(mockClearAuth).not.toHaveBeenCalled();
  });

  it('clears the stale auth state when the silent refresh fails', async () => {
    mockAuthState({ isAuthenticated: true, accessToken: null });
    mockApiPost.mockRejectedValue(new Error('no valid refresh cookie'));

    renderHook(() => useSessionGuard());

    await waitFor(() => expect(mockClearAuth).toHaveBeenCalledTimes(1));
    expect(mockSetAccessToken).not.toHaveBeenCalled();
  });

  it('ignores a refresh that resolves after unmount', async () => {
    mockAuthState({ isAuthenticated: true, accessToken: null });
    let resolveRefresh!: (value: { data: { token: string } }) => void;
    mockApiPost.mockReturnValue(new Promise((resolve) => { resolveRefresh = resolve; }));

    const { unmount } = renderHook(() => useSessionGuard());
    await waitFor(() => expect(mockApiPost).toHaveBeenCalled());
    unmount();
    resolveRefresh({ data: { token: 'too-late' } });

    await new Promise((r) => setTimeout(r, 0));
    expect(mockSetAccessToken).not.toHaveBeenCalled();
  });

  it('ignores a refresh that rejects after unmount', async () => {
    mockAuthState({ isAuthenticated: true, accessToken: null });
    let rejectRefresh!: (reason: Error) => void;
    mockApiPost.mockReturnValue(new Promise((_resolve, reject) => { rejectRefresh = reject; }));

    const { unmount } = renderHook(() => useSessionGuard());
    await waitFor(() => expect(mockApiPost).toHaveBeenCalled());
    unmount();
    rejectRefresh(new Error('too late'));

    await new Promise((r) => setTimeout(r, 0));
    expect(mockClearAuth).not.toHaveBeenCalled();
  });
});
