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

  it('renders email and password fields and the sign in button', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows error message returned by the server on invalid credentials', async () => {
    mockPost.mockRejectedValueOnce({
      response: { status: 401, data: { message: 'Invalid credentials' } },
    });

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('shows fallback error message when server returns no message body', async () => {
    mockPost.mockRejectedValueOnce({
      response: { status: 401, data: {} },
    });

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/login failed/i)).toBeInTheDocument();
    });
  });

  it('shows fallback error message on network error with no response body', async () => {
    mockPost.mockRejectedValueOnce({ code: 'ECONNABORTED' });

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/login failed/i)).toBeInTheDocument();
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

    await userEvent.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/auth/login', {
        username: 'admin@example.com',
        password: 'password123',
      });
    });
  });
});
