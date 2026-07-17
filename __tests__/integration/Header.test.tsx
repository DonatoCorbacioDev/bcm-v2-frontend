import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ─── Module mocks ────────────────────────────────────────────────────────────

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: jest.fn(() => '/dashboard'),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/components/layout/NotificationBell', () => ({
  __esModule: true,
  default: () => null,
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

const defaultProps = {
  onMenuClick: jest.fn(),
  collapsed: false,
  onCollapseToggle: jest.fn(),
};

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ username: 'testuser', role: 'ADMIN' });
    (useAuth as jest.Mock).mockReturnValue({ logout: jest.fn() });
  });

  it('renders the page title for the current route', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders the mobile menu toggle button', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByRole('button', { name: /apri menu/i })).toBeInTheDocument();
  });

  it('calls onMenuClick when the mobile menu button is clicked', async () => {
    const onMenuClick = jest.fn();
    render(<Header {...defaultProps} onMenuClick={onMenuClick} />);
    await userEvent.click(screen.getByRole('button', { name: /apri menu/i }));
    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });

  it('renders the sidebar collapse toggle button', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByRole('button', { name: /comprimi menu/i })).toBeInTheDocument();
  });

  it('calls onCollapseToggle when the collapse button is clicked', async () => {
    const onCollapseToggle = jest.fn();
    render(<Header {...defaultProps} onCollapseToggle={onCollapseToggle} />);
    await userEvent.click(screen.getByRole('button', { name: /comprimi menu/i }));
    expect(onCollapseToggle).toHaveBeenCalledTimes(1);
  });

  it('shows "Espandi menu" label when sidebar is collapsed', () => {
    render(<Header {...defaultProps} collapsed={true} />);
    expect(screen.getByRole('button', { name: /espandi menu/i })).toBeInTheDocument();
  });

  it('shows the logged-in username', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('falls back to "Utente" when no user is set', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue(null);
    render(<Header {...defaultProps} />);
    expect(screen.getByText('Utente')).toBeInTheDocument();
  });

  it('sets aria-expanded=true on the mobile menu button when open', () => {
    render(<Header {...defaultProps} isMenuOpen={true} />);
    expect(screen.getByRole('button', { name: /apri menu/i })).toHaveAttribute('aria-expanded', 'true');
  });

  it('sets aria-expanded=false on the mobile menu button when closed', () => {
    render(<Header {...defaultProps} isMenuOpen={false} />);
    expect(screen.getByRole('button', { name: /apri menu/i })).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders the dark mode toggle button', () => {
    render(<Header {...defaultProps} />);
    expect(
      screen.getByRole('button', { name: /modalità (chiara|scura)/i })
    ).toBeInTheDocument();
  });

  it('toggles dark class on html element when dark mode button is clicked', async () => {
    render(<Header {...defaultProps} />);
    const toggle = screen.getByRole('button', { name: /modalità (chiara|scura)/i });
    const initialDark = document.documentElement.classList.contains('dark');
    await userEvent.click(toggle);
    expect(document.documentElement.classList.contains('dark')).toBe(!initialDark);
  });

  it('shows "Responsabile" role label for MANAGER users', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ username: 'manager1', role: 'MANAGER' });
    render(<Header {...defaultProps} />);
    expect(screen.getByText('Responsabile')).toBeInTheDocument();
  });

  it('shows "Amministratore" role label for ADMIN users', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ username: 'admin1', role: 'ADMIN' });
    render(<Header {...defaultProps} />);
    expect(screen.getByText('Amministratore')).toBeInTheDocument();
  });

  it('derives initials from a dotted username (e.g. mario.rossi → MR)', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ username: 'mario.rossi', role: 'ADMIN' });
    render(<Header {...defaultProps} />);
    expect(screen.getByText('MR')).toBeInTheDocument();
  });

  it('uses "Dettaglio contratto" title for /contracts/:id paths', () => {
    const { usePathname } = jest.requireMock('next/navigation');
    (usePathname as jest.Mock).mockReturnValueOnce('/contracts/42');
    render(<Header {...defaultProps} />);
    expect(screen.getByText('Dettaglio contratto')).toBeInTheDocument();
  });

  it('falls back to app name for unknown routes', () => {
    const { usePathname } = jest.requireMock('next/navigation');
    (usePathname as jest.Mock).mockReturnValueOnce('/unknown-page');
    render(<Header {...defaultProps} />);
    expect(screen.getByText('Business Contracts Manager')).toBeInTheDocument();
  });
});
