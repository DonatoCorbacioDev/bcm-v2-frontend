import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createWrapper } from '../mocks/wrapper';

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

import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import MobileSidebar from '@/components/layout/MobileSidebar';

const mockLogout = jest.fn();

function renderMobileSidebar(props: { isOpen: boolean; onClose: () => void }) {
  return render(<MobileSidebar {...props} />, { wrapper: createWrapper() });
}

beforeEach(() => {
  jest.clearAllMocks();
  (usePathname as jest.Mock).mockReturnValue('/dashboard');
  (useAuth as jest.Mock).mockReturnValue({ logout: mockLogout });
  (useAuthStore as unknown as jest.Mock).mockImplementation((selector) =>
    selector({ user: { id: 1, username: 'admin', role: 'ADMIN' }, isAuthenticated: true })
  );
});

describe('MobileSidebar', () => {
  it('renders the same short menu as the desktop sidebar', () => {
    renderMobileSidebar({ isOpen: true, onClose: jest.fn() });
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contratti' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Controparti' })).toBeInTheDocument();
  });

  it('shows Impostazioni for ADMIN', () => {
    renderMobileSidebar({ isOpen: true, onClose: jest.fn() });
    expect(screen.getByRole('link', { name: 'Impostazioni' })).toHaveAttribute('href', '/settings');
  });

  it('hides admin-only links when user is not yet loaded', () => {
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ user: null, isAuthenticated: false })
    );
    renderMobileSidebar({ isOpen: true, onClose: jest.fn() });
    expect(screen.queryByRole('link', { name: 'Impostazioni' })).not.toBeInTheDocument();
  });

  it('hides admin-only links for MANAGER', () => {
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ user: { id: 2, username: 'mgr', role: 'MANAGER' }, isAuthenticated: true })
    );
    renderMobileSidebar({ isOpen: true, onClose: jest.fn() });
    expect(screen.queryByRole('link', { name: 'Impostazioni' })).not.toBeInTheDocument();
  });

  it('is visually hidden when isOpen is false', () => {
    const { container } = renderMobileSidebar({ isOpen: false, onClose: jest.fn() });
    const aside = container.querySelector('aside');
    expect(aside?.className).toContain('-translate-x-full');
  });

  it('is visible when isOpen is true', () => {
    const { container } = renderMobileSidebar({ isOpen: true, onClose: jest.fn() });
    const aside = container.querySelector('aside');
    expect(aside?.className).toContain('translate-x-0');
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = jest.fn();
    renderMobileSidebar({ isOpen: true, onClose });
    await userEvent.click(screen.getByRole('button', { name: /chiudi menu/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when a nav link is clicked', async () => {
    const onClose = jest.fn();
    renderMobileSidebar({ isOpen: true, onClose });
    await userEvent.click(screen.getByRole('link', { name: /contratti$/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls logout and onClose when Esci is clicked', async () => {
    const onClose = jest.fn();
    renderMobileSidebar({ isOpen: true, onClose });
    await userEvent.click(screen.getByRole('button', { name: /esci/i }));
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalled();
  });

  it('marks the active route with aria-current="page", sub-pages included', () => {
    (usePathname as jest.Mock).mockReturnValue('/contracts/12');
    renderMobileSidebar({ isOpen: true, onClose: jest.fn() });
    expect(screen.getByRole('link', { name: /contratti$/i })).toHaveAttribute('aria-current', 'page');
  });

  it('shows GENERALE and AMMINISTRAZIONE section labels', () => {
    renderMobileSidebar({ isOpen: true, onClose: jest.fn() });
    expect(screen.getByText('GENERALE')).toBeInTheDocument();
    expect(screen.getByText('AMMINISTRAZIONE')).toBeInTheDocument();
  });

  it('shows the organization name for ADMIN', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: { id: 1, name: 'Acme S.r.l.', slug: 'acme', subscriptionTier: 'PRO', iban: null, bic: null, createdAt: '2025-01-01' },
    });
    renderMobileSidebar({ isOpen: true, onClose: jest.fn() });
    expect(await screen.findByText('Acme S.r.l.')).toBeInTheDocument();
  });

  it('shows the Privacy and Trasparenza AI legal links', () => {
    renderMobileSidebar({ isOpen: true, onClose: jest.fn() });
    expect(screen.getByRole('link', { name: /privacy/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /trasparenza ai/i })).toBeInTheDocument();
  });

  it('calls onClose when a legal footer link is clicked', async () => {
    const onClose = jest.fn();
    renderMobileSidebar({ isOpen: true, onClose });
    await userEvent.click(screen.getByRole('link', { name: /privacy/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
