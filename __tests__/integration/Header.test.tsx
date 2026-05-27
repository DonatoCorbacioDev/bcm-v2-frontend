import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ─── Module mocks ────────────────────────────────────────────────────────────

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/',
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
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

// ─── Imports that reference mocked modules ───────────────────────────────────

import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('Header', () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ username: 'testuser', role: 'ADMIN' });
    (useAuth as jest.Mock).mockReturnValue({ logout: mockLogout });
  });

  it('renders the BCM brand name', () => {
    render(<Header onMenuClick={jest.fn()} />);
    expect(screen.getByText('BCM')).toBeInTheDocument();
  });

  it('renders the logout button', () => {
    render(<Header onMenuClick={jest.fn()} />);
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('renders the mobile menu toggle button', () => {
    render(<Header onMenuClick={jest.fn()} />);
    expect(screen.getByRole('button', { name: /toggle navigation menu/i })).toBeInTheDocument();
  });

  it('calls onMenuClick when the menu button is clicked', async () => {
    const onMenuClick = jest.fn();
    render(<Header onMenuClick={onMenuClick} />);
    await userEvent.click(screen.getByRole('button', { name: /toggle navigation menu/i }));
    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });

  it('shows the logged-in username', () => {
    render(<Header onMenuClick={jest.fn()} />);
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('falls back to "User" when no user is set', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue(null);
    render(<Header onMenuClick={jest.fn()} />);
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('calls logout and redirects to /login', async () => {
    render(<Header onMenuClick={jest.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /logout/i }));
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('sets aria-expanded=true on the menu button when menu is open', () => {
    render(<Header onMenuClick={jest.fn()} isMenuOpen={true} />);
    expect(screen.getByRole('button', { name: /toggle navigation menu/i })).toHaveAttribute('aria-expanded', 'true');
  });

  it('sets aria-expanded=false on the menu button when menu is closed', () => {
    render(<Header onMenuClick={jest.fn()} isMenuOpen={false} />);
    expect(screen.getByRole('button', { name: /toggle navigation menu/i })).toHaveAttribute('aria-expanded', 'false');
  });
});
