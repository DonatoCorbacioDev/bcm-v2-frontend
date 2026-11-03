import React, { StrictMode } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { SessionGuard } from '@/components/providers/SessionGuard';
import DashboardLayout from '@/app/(dashboard)/layout';

const mockPush = jest.fn();
const mockRouter = { push: mockPush };
jest.mock('next/navigation', () => ({ useRouter: () => mockRouter }));
jest.mock('@/components/layout/Header', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/layout/Sidebar', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/layout/MobileSidebar', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/organization/DeletionScheduledBanner', () => ({ DeletionScheduledBanner: () => null }));

describe('shared session restoration', () => {
  beforeEach(() => {
    mockPush.mockClear();
    useAuthStore.setState({ isAuthenticated: true, accessToken: null, user: null });
  });
  afterEach(() => {
    jest.restoreAllMocks();
    useAuthStore.getState().clearAuth();
  });
  it('root guard and dashboard share one HTTP request even in StrictMode', async () => {
    let resolveRefresh!: (value: { data: { token: string } }) => void;
    const post = jest.spyOn(axios, 'post').mockImplementation(() => new Promise((resolve) => {
      resolveRefresh = resolve;
    }));
    render(<StrictMode><SessionGuard /><DashboardLayout>Protected content</DashboardLayout></StrictMode>);
    expect(screen.getByText(/verifica autenticazione/i)).toBeInTheDocument();
    expect(post).toHaveBeenCalledTimes(1);
    await act(async () => { resolveRefresh({ data: { token: 'restored' } }); });
    await waitFor(() => expect(screen.getByText('Protected content')).toBeInTheDocument());
    expect(useAuthStore.getState().accessToken).toBe('restored');
    expect(post).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });
  it('an expired cookie fails once and clears the session without recursive refresh', async () => {
    let rejectRefresh!: (reason: unknown) => void;
    const post = jest.spyOn(axios, 'post').mockImplementation(() => new Promise((_resolve, reject) => {
      rejectRefresh = reject;
    }));
    render(<StrictMode><SessionGuard /><DashboardLayout>Protected content</DashboardLayout></StrictMode>);
    await act(async () => { rejectRefresh({ response: { status: 401 } }); });
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/login'));
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(post).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });
});
