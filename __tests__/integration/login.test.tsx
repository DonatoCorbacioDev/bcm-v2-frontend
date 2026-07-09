import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/login',
}));

// Mocking the api module avoids the NEXT_PUBLIC_API_URL env requirement
// and lets us control responses without network calls.
// (MSW v2 has ESM compatibility issues with ts-jest/CJS.)
// __esModule: true is required so TypeScript's esModuleInterop doesn't wrap
// the mock in an extra { default: ... } layer, which would make api.post undefined.
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    defaults: { headers: { common: {} } },
  },
}));

import LoginPage from '@/app/(auth)/login/page';
import api from '@/lib/api';

const mockPost = api.post as jest.Mock;
const mockGet = api.get as jest.Mock;

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders username and password fields and the sign in button', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/nome utente/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /accedi/i })).toBeInTheDocument();
  });

  it('shows error message returned by the server on invalid credentials', async () => {
    mockPost.mockRejectedValueOnce({
      response: { status: 401, data: { message: 'Invalid credentials' } },
    });

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/nome utente/i), 'wrong@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await userEvent.click(screen.getByRole('button', { name: /accedi/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('shows fallback error message when server returns no message body', async () => {
    mockPost.mockRejectedValueOnce({
      response: { status: 401, data: {} },
    });

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/nome utente/i), 'wrong@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await userEvent.click(screen.getByRole('button', { name: /accedi/i }));

    await waitFor(() => {
      expect(screen.getByText(/accesso non riuscito/i)).toBeInTheDocument();
    });
  });

  it('shows fallback error message on network error with no response body', async () => {
    mockPost.mockRejectedValueOnce({ code: 'ECONNABORTED' });

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/nome utente/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password');
    await userEvent.click(screen.getByRole('button', { name: /accedi/i }));

    await waitFor(() => {
      expect(screen.getByText(/accesso non riuscito/i)).toBeInTheDocument();
    });
  });

  it('sends POST /auth/login with the typed credentials', async () => {
    mockPost.mockResolvedValueOnce({ data: { token: 'fake-jwt-token' } });
    mockGet.mockResolvedValueOnce({
      data: {
        id: 1,
        username: 'admin@example.com',
        managerId: 1,
        role: 'ADMIN',
        roleId: 1,
        verified: true,
        createdAt: '2024-01-01T00:00:00Z',
      },
    });

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/nome utente/i), 'admin@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /accedi/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/auth/login', {
        username: 'admin@example.com',
        password: 'password123',
      });
    });
  });

  it('shows the MFA code step when the account has 2FA enabled, and completes login with a valid code', async () => {
    mockPost.mockResolvedValueOnce({
      data: { token: null, mfaRequired: true, mfaToken: 'pending-token-123' },
    });

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/nome utente/i), 'totp@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /accedi/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/codice di verifica/i)).toBeInTheDocument();
    });

    mockPost.mockResolvedValueOnce({ data: { token: 'real-token', mfaRequired: false, mfaToken: null } });
    mockGet.mockResolvedValueOnce({
      data: { id: 1, username: 'totp@example.com', managerId: 1, role: 'ADMIN', roleId: 1, verified: true, createdAt: '2024-01-01T00:00:00Z' },
    });

    await userEvent.type(screen.getByLabelText(/codice di verifica/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /^verifica$/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/auth/2fa/verify', { mfaToken: 'pending-token-123', code: '123456' });
    });
  });

  it('shows an error and stays on the MFA step when the code is wrong', async () => {
    mockPost.mockResolvedValueOnce({
      data: { token: null, mfaRequired: true, mfaToken: 'pending-token-123' },
    });

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/nome utente/i), 'totp@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /accedi/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/codice di verifica/i)).toBeInTheDocument();
    });

    mockPost.mockRejectedValueOnce({ response: { data: { message: 'Invalid verification code' } } });

    await userEvent.type(screen.getByLabelText(/codice di verifica/i), '000000');
    await userEvent.click(screen.getByRole('button', { name: /^verifica$/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid verification code')).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/codice di verifica/i)).toBeInTheDocument();
  });

  it('"Torna al login" goes back to the username/password form', async () => {
    mockPost.mockResolvedValueOnce({
      data: { token: null, mfaRequired: true, mfaToken: 'pending-token-123' },
    });

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/nome utente/i), 'totp@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /accedi/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/codice di verifica/i)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /torna al login/i }));

    expect(screen.getByLabelText(/nome utente/i)).toBeInTheDocument();
  });
});
