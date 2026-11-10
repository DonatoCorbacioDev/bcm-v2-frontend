import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createWrapper } from '../mocks/wrapper';

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
import api from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import { uid } from "../mocks/ids";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockUser = (role: string) => {
  (useAuthStore as unknown as jest.Mock).mockImplementation((selector) =>
    selector({ user: { id: uid(1), username: 'user', role }, isAuthenticated: true })
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

  // The menu is deliberately short (Home, Contratti, Controparti, Impostazioni):
  // every other page is reached from Impostazioni or from the page it belongs to.
  const navLinks = () =>
    screen.getAllByRole('link').filter((link) => link.closest('nav')).map((link) => link.textContent);

  it('shows ADMIN the four main entries, Impostazioni included', () => {
    render(<Sidebar collapsed={false} />, { wrapper: createWrapper() });
    expect(navLinks()).toEqual(['Home', 'Contratti', 'Controparti', 'Impostazioni']);
    expect(screen.getByRole('link', { name: 'Impostazioni' })).toHaveAttribute('href', '/settings');
  });

  it('shows only public links when user is not yet loaded', () => {
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ user: null, isAuthenticated: false })
    );
    render(<Sidebar collapsed={false} />, { wrapper: createWrapper() });
    expect(navLinks()).toEqual(['Home', 'Contratti', 'Controparti']);
  });

  it('shows MANAGER the three main entries, without Impostazioni', () => {
    mockUser('MANAGER');
    render(<Sidebar collapsed={false} />, { wrapper: createWrapper() });
    expect(navLinks()).toEqual(['Home', 'Contratti', 'Controparti']);
    expect(screen.queryByText('AMMINISTRAZIONE')).not.toBeInTheDocument();
  });

  it('keeps Contratti highlighted on a contract detail page', () => {
    (usePathname as jest.Mock).mockReturnValue(`/contracts/${uid(12)}`);
    render(<Sidebar collapsed={false} />, { wrapper: createWrapper() });
    expect(screen.getByRole('link', { name: 'Contratti' })).toHaveAttribute('aria-current', 'page');
  });

  it.each(['/users', '/organization', '/financial-values', '/audit-logs'])(
    'keeps Impostazioni highlighted on %s, reached from it',
    (pathname) => {
      (usePathname as jest.Mock).mockReturnValue(pathname);
      render(<Sidebar collapsed={false} />, { wrapper: createWrapper() });
      expect(screen.getByRole('link', { name: 'Impostazioni' })).toHaveAttribute('aria-current', 'page');
      expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
    }
  );

  it('marks the active route with aria-current="page"', () => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    render(<Sidebar collapsed={false} />, { wrapper: createWrapper() });
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
  });

  it('does not mark inactive routes with aria-current', () => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    render(<Sidebar collapsed={false} />, { wrapper: createWrapper() });
    expect(screen.getByRole('link', { name: /contratti$/i })).not.toHaveAttribute('aria-current');
  });

  it('marks /contracts as active when on contracts page', () => {
    (usePathname as jest.Mock).mockReturnValue('/contracts');
    render(<Sidebar collapsed={false} />, { wrapper: createWrapper() });
    expect(screen.getByRole('link', { name: /contratti$/i })).toHaveAttribute('aria-current', 'page');
  });

  it('renders the logout button in the footer', () => {
    render(<Sidebar collapsed={false} />, { wrapper: createWrapper() });
    expect(screen.getByRole('button', { name: /esci/i })).toBeInTheDocument();
  });

  it('calls logout when the logout button is clicked', async () => {
    render(<Sidebar collapsed={false} />, { wrapper: createWrapper() });
    await userEvent.click(screen.getByRole('button', { name: /esci/i }));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('shows section group labels when not collapsed', () => {
    render(<Sidebar collapsed={false} />, { wrapper: createWrapper() });
    expect(screen.getByText('GENERALE')).toBeInTheDocument();
    expect(screen.getByText('AMMINISTRAZIONE')).toBeInTheDocument();
  });

  it('hides section group labels when collapsed', () => {
    render(<Sidebar collapsed={true} />, { wrapper: createWrapper() });
    expect(screen.queryByText('GENERALE')).not.toBeInTheDocument();
    expect(screen.queryByText('AMMINISTRAZIONE')).not.toBeInTheDocument();
  });

  it('shows the organization name and a known subscription tier label', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: { id: uid(1), name: 'Acme S.r.l.', slug: 'acme', subscriptionTier: 'PRO', iban: null, bic: null, createdAt: '2025-01-01' },
    });
    render(<Sidebar collapsed={false} />, { wrapper: createWrapper() });

    expect(await screen.findByText('Acme S.r.l.')).toBeInTheDocument();
    expect(screen.getByText('Piano Pro')).toBeInTheDocument();
  });

  it('falls back to the raw tier value when it has no known label', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: { id: uid(1), name: 'Acme S.r.l.', slug: 'acme', subscriptionTier: 'CUSTOM_TIER', iban: null, bic: null, createdAt: '2025-01-01' },
    });
    render(<Sidebar collapsed={false} />, { wrapper: createWrapper() });

    expect(await screen.findByText('Piano CUSTOM_TIER')).toBeInTheDocument();
  });

  it('falls back to a placeholder name while the organization is loading', () => {
    (api.get as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<Sidebar collapsed={false} />, { wrapper: createWrapper() });

    expect(screen.getByText('Organizzazione', { selector: 'p' })).toBeInTheDocument();
  });
});
