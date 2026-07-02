import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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
import MobileSidebar from '@/components/layout/MobileSidebar';

const mockLogout = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (usePathname as jest.Mock).mockReturnValue('/dashboard');
  (useAuth as jest.Mock).mockReturnValue({ logout: mockLogout });
  (useAuthStore as unknown as jest.Mock).mockImplementation((selector) =>
    selector({ user: { id: 1, username: 'admin', role: 'ADMIN' }, isAuthenticated: true })
  );
});

describe('MobileSidebar', () => {
  it('renders nav links when open', () => {
    render(<MobileSidebar isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /contratti$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /valori finanziari/i })).toBeInTheDocument();
  });

  it('shows admin-only links for ADMIN', () => {
    render(<MobileSidebar isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByRole('link', { name: /tipi finanziari/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /aree di business/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /responsabili/i })).toBeInTheDocument();
  });

  it('hides admin-only links when user is not yet loaded', () => {
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ user: null, isAuthenticated: false })
    );
    render(<MobileSidebar isOpen={true} onClose={jest.fn()} />);
    expect(screen.queryByRole('link', { name: /tipi finanziari/i })).not.toBeInTheDocument();
  });

  it('hides admin-only links for MANAGER', () => {
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ user: { id: 2, username: 'mgr', role: 'MANAGER' }, isAuthenticated: true })
    );
    render(<MobileSidebar isOpen={true} onClose={jest.fn()} />);
    expect(screen.queryByRole('link', { name: /tipi finanziari/i })).not.toBeInTheDocument();
  });

  it('is visually hidden when isOpen is false', () => {
    const { container } = render(<MobileSidebar isOpen={false} onClose={jest.fn()} />);
    const aside = container.querySelector('aside');
    expect(aside?.className).toContain('-translate-x-full');
  });

  it('is visible when isOpen is true', () => {
    const { container } = render(<MobileSidebar isOpen={true} onClose={jest.fn()} />);
    const aside = container.querySelector('aside');
    expect(aside?.className).toContain('translate-x-0');
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = jest.fn();
    render(<MobileSidebar isOpen={true} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: /chiudi menu/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls logout and onClose when Esci is clicked', async () => {
    const onClose = jest.fn();
    render(<MobileSidebar isOpen={true} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: /esci/i }));
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalled();
  });

  it('marks the active route with aria-current="page"', () => {
    (usePathname as jest.Mock).mockReturnValue('/contracts');
    render(<MobileSidebar isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByRole('link', { name: /contratti$/i })).toHaveAttribute('aria-current', 'page');
  });

  it('shows GENERALE and AMMINISTRAZIONE section labels', () => {
    render(<MobileSidebar isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByText('GENERALE')).toBeInTheDocument();
    expect(screen.getByText('AMMINISTRAZIONE')).toBeInTheDocument();
  });
});
