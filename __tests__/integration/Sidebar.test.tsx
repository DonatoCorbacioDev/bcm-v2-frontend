import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ─── Module mocks ────────────────────────────────────────────────────────────

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    defaults: { headers: { common: {} } },
  },
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// ─── Imports that reference mocked modules ───────────────────────────────────

import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/layout/Sidebar';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockUser = (role: string) => {
  (useAuthStore as unknown as jest.Mock).mockImplementation((selector) =>
    selector({ user: { id: 1, username: 'user', role }, isAuthenticated: true })
  );
};

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('Sidebar', () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    (useAuth as jest.Mock).mockReturnValue({ logout: mockLogout });
    mockUser('ADMIN');
  });

  it('renders all navigation links for ADMIN', () => {
    render(<Sidebar collapsed={false} />);
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /contratti/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /valori finanziari/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /tipi finanziari/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /aree di business/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /responsabili/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /utenti/i })).toBeInTheDocument();
  });

  it('shows only public links when user is not yet loaded', () => {
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ user: null, isAuthenticated: false })
    );
    render(<Sidebar collapsed={false} />);
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /tipi finanziari/i })).not.toBeInTheDocument();
  });

  it('hides admin-only links for MANAGER role', () => {
    mockUser('MANAGER');
    render(<Sidebar collapsed={false} />);
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /contratti/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /valori finanziari/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /tipi finanziari/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /aree di business/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /responsabili/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^utenti$/i })).not.toBeInTheDocument();
  });

  it('marks the active route with aria-current="page"', () => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    render(<Sidebar collapsed={false} />);
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('aria-current', 'page');
  });

  it('does not mark inactive routes with aria-current', () => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    render(<Sidebar collapsed={false} />);
    expect(screen.getByRole('link', { name: /contratti$/i })).not.toHaveAttribute('aria-current');
  });

  it('marks /contracts as active when on contracts page', () => {
    (usePathname as jest.Mock).mockReturnValue('/contracts');
    render(<Sidebar collapsed={false} />);
    expect(screen.getByRole('link', { name: /contratti$/i })).toHaveAttribute('aria-current', 'page');
  });

  it('renders the logout button in the footer', () => {
    render(<Sidebar collapsed={false} />);
    expect(screen.getByRole('button', { name: /esci/i })).toBeInTheDocument();
  });

  it('calls logout when the logout button is clicked', async () => {
    render(<Sidebar collapsed={false} />);
    await userEvent.click(screen.getByRole('button', { name: /esci/i }));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('shows section group labels when not collapsed', () => {
    render(<Sidebar collapsed={false} />);
    expect(screen.getByText('GENERALE')).toBeInTheDocument();
    expect(screen.getByText('AMMINISTRAZIONE')).toBeInTheDocument();
  });

  it('hides section group labels when collapsed', () => {
    render(<Sidebar collapsed={true} />);
    expect(screen.queryByText('GENERALE')).not.toBeInTheDocument();
    expect(screen.queryByText('AMMINISTRAZIONE')).not.toBeInTheDocument();
  });
});
