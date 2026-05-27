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

// ─── Imports that reference mocked modules ───────────────────────────────────

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('Sidebar', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
  });

  it('renders all navigation links', () => {
    render(<Sidebar isOpen={false} onClose={onClose} />);
    expect(screen.getAllByRole('link', { name: /dashboard/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /contracts/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /financial values/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /financial types/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /business areas/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /managers/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /users/i })[0]).toBeInTheDocument();
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
