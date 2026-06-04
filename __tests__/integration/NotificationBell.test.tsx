import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createWrapper } from '../mocks/wrapper';

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    patch: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    defaults: { headers: { common: {} } },
  },
}));

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));

import api from '@/lib/api';
import NotificationBell from '@/components/layout/NotificationBell';

const unread = { id: 1, title: 'New Contract', message: 'A new contract was added', read: false, createdAt: new Date().toISOString(), type: 'INFO' as const };
const read   = { id: 2, title: 'Reminder',     message: 'Contract expiring',         read: true,  createdAt: new Date(Date.now() - 3700000).toISOString(), type: 'WARNING' as const };
const error  = { id: 3, title: 'Error',         message: 'Something failed',          read: false, createdAt: new Date(Date.now() - 90000000).toISOString(), type: 'ERROR' as const };

beforeEach(() => jest.clearAllMocks());

describe('NotificationBell', () => {
  it('renders null when API returns an error', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('Not Found'));
    const { container } = render(<NotificationBell />, { wrapper: createWrapper() });
    await waitFor(() => expect(container.firstChild).toBeNull());
  });

  it('shows bell button when notifications load', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });
    render(<NotificationBell />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument());
  });

  it('shows unread badge with correct count', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [unread, read] });
    render(<NotificationBell />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());
  });

  it('shows 9+ when unread count exceeds 9', async () => {
    const manyUnread = Array.from({ length: 10 }, (_, i) => ({ ...unread, id: i + 1 }));
    (api.get as jest.Mock).mockResolvedValue({ data: manyUnread });
    render(<NotificationBell />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText('9+')).toBeInTheDocument());
  });

  it('opens dropdown on bell click', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [unread] });
    render(<NotificationBell />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /notifications/i }));
    expect(screen.getByText('New Contract')).toBeInTheDocument();
  });

  it('shows empty message when no notifications', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });
    render(<NotificationBell />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByRole('button')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByText(/no notifications/i)).toBeInTheDocument();
  });

  it('shows "Mark all read" button when there are unread notifications', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [unread] });
    render(<NotificationBell />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /notifications/i }));
    expect(screen.getByText(/mark all read/i)).toBeInTheDocument();
  });

  it('marks a single notification as read on check click', async () => {
    (api.patch as jest.Mock).mockResolvedValue({});
    (api.get as jest.Mock).mockResolvedValue({ data: [unread] });
    render(<NotificationBell />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /notifications/i }));
    await userEvent.click(screen.getByRole('button', { name: /mark as read/i }));
    expect(api.patch).toHaveBeenCalledWith('/notifications/1/read');
  });

  it('marks all notifications as read', async () => {
    (api.patch as jest.Mock).mockResolvedValue({});
    (api.get as jest.Mock).mockResolvedValue({ data: [unread, { ...unread, id: 5 }] });
    render(<NotificationBell />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /notifications/i }));
    await userEvent.click(screen.getByText(/mark all read/i));
    await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(2));
  });

  it('closes dropdown on outside click', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [unread] });
    render(<NotificationBell />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /notifications/i }));
    expect(screen.getByText('New Contract')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    await waitFor(() => expect(screen.queryByText('New Contract')).not.toBeInTheDocument());
  });

  it('renders different notification types (INFO, WARNING, ERROR) with timeAgo', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [unread, read, error] });
    render(<NotificationBell />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /notifications/i }));
    expect(screen.getByText('New Contract')).toBeInTheDocument();
    expect(screen.getByText('Reminder')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    // timeAgo branches: just now, h ago, d ago
    expect(screen.getByText('just now')).toBeInTheDocument();
    expect(screen.getByText('1h ago')).toBeInTheDocument();
    expect(screen.getByText('1d ago')).toBeInTheDocument();
  });
});
