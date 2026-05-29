import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ─── Module mocks ────────────────────────────────────────────────────────────

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
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

// ─── Imports that reference mocked modules ───────────────────────────────────

import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Sidebar from '@/components/layout/Sidebar';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockUser = (role: string) => {
  (useAuthStore as unknown as jest.Mock).mockImplementation((selector) =>
    selector({ user: { id: 1, username: 'user', role }, isAuthenticated: true })
  );
};

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('Sidebar', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    mockUser('ADMIN');
  });

  it('renders all navigation links for ADMIN', () => {
    render(<Sidebar isOpen={false} onClose={onClose} />);
    expect(screen.getAllByRole('link', { name: /dashboard/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /contracts/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /financial values/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /financial types/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /business areas/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /managers/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /users/i })[0]).toBeInTheDocument();
  });

  it('shows only public links when user is not yet loaded', () => {
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ user: null, isAuthenticated: false })
    );
    render(<Sidebar isOpen={false} onClose={onClose} />);
    expect(screen.getAllByRole('link', { name: /dashboard/i })[0]).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /financial types/i })).not.toBeInTheDocument();
  });

  it('hides admin-only links for MANAGER role', () => {
    mockUser('MANAGER');
    render(<Sidebar isOpen={false} onClose={onClose} />);
    expect(screen.getAllByRole('link', { name: /dashboard/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /contracts/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /financial values/i })[0]).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /financial types/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /business areas/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^managers$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^users$/i })).not.toBeInTheDocument();
  });

  it('marks the active route with aria-current="page"', () => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    render(<Sidebar isOpen={false} onClose={onClose} />);
    const dashboardLinks = screen.getAllByRole('link', { name: /dashboard/i });
    dashboardLinks.forEach(link => {
      expect(link).toHaveAttribute('aria-current', 'page');
    });
  });

  it('does not mark inactive routes with aria-current', () => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    render(<Sidebar isOpen={false} onClose={onClose} />);
    const contractLinks = screen.getAllByRole('link', { name: /^Contracts$/i });
    contractLinks.forEach(link => {
      expect(link).not.toHaveAttribute('aria-current');
    });
  });

  it('marks /contracts as active when on contracts page', () => {
    (usePathname as jest.Mock).mockReturnValue('/contracts');
    render(<Sidebar isOpen={false} onClose={onClose} />);
    const contractLinks = screen.getAllByRole('link', { name: /^Contracts$/i });
    contractLinks.forEach(link => {
      expect(link).toHaveAttribute('aria-current', 'page');
    });
  });

  it('renders the close button', () => {
    render(<Sidebar isOpen={true} onClose={onClose} />);
    expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    render(<Sidebar isOpen={true} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: /close menu/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
