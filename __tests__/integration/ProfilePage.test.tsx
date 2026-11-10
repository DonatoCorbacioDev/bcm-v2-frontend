import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { createWrapper } from '../mocks/wrapper';

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(() => ({ user: { id: '00000000-0000-4000-8000-000000000007', username: 'marco', role: 'MANAGER' } })),
}));
jest.mock('@/services/calendarFeed.service', () => ({
  calendarFeedService: { getUrl: jest.fn().mockResolvedValue('https://example.test/feed.ics'), regenerate: jest.fn() },
}));
jest.mock('@/components/profile/TwoFactorAuthCard', () => ({
  __esModule: true,
  default: () => <div>two-factor form</div>,
}));
jest.mock('@/components/profile/DataPrivacyCard', () => ({
  __esModule: true,
  default: () => null,
}));

import api from '@/lib/api';
import { toast } from 'sonner';
import ProfilePage from '@/app/(dashboard)/profile/page';
import { uid } from "../mocks/ids";

const mockedApi = api as unknown as { get: jest.Mock; post: jest.Mock; patch: jest.Mock };

const profile = (demoAccount: boolean) => ({
  id: uid(7), username: demoAccount ? 'demo' : 'marco', role: 'MANAGER', verified: true, demoAccount,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ProfilePage — change password', () => {
  it('sends the current and the new password to the own-password endpoint, for any role', async () => {
    mockedApi.get.mockResolvedValue({ data: profile(false) });
    mockedApi.post.mockResolvedValue({});
    const user = userEvent.setup();
    render(<ProfilePage />, { wrapper: createWrapper() });

    await user.type(await screen.findByLabelText('Password attuale'), 'OldPass#2026');
    await user.type(screen.getByLabelText('Nuova password'), 'NewPass#2026');
    await user.type(screen.getByLabelText('Conferma password'), 'NewPass#2026');
    await user.click(screen.getByRole('button', { name: 'Aggiorna password' }));

    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith('/users/me/password', {
        currentPassword: 'OldPass#2026',
        newPassword: 'NewPass#2026',
      }),
    );
    expect(mockedApi.patch).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Password aggiornata');
  });

  it('shows the backend message when the current password is wrong', async () => {
    mockedApi.get.mockResolvedValue({ data: profile(false) });
    mockedApi.post.mockRejectedValue(
      new AxiosError('Bad Request', '400', undefined, undefined, {
        status: 400, statusText: 'Bad Request', headers: {}, config: { headers: new AxiosHeaders() },
        data: { message: 'La password attuale non è corretta' },
      }),
    );
    const user = userEvent.setup();
    render(<ProfilePage />, { wrapper: createWrapper() });

    await user.type(await screen.findByLabelText('Password attuale'), 'wrong');
    await user.type(screen.getByLabelText('Nuova password'), 'NewPass#2026');
    await user.type(screen.getByLabelText('Conferma password'), 'NewPass#2026');
    await user.click(screen.getByRole('button', { name: 'Aggiorna password' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('La password attuale non è corretta'));
  });

  it('asks for the current password before sending anything', async () => {
    mockedApi.get.mockResolvedValue({ data: profile(false) });
    const user = userEvent.setup();
    render(<ProfilePage />, { wrapper: createWrapper() });

    await user.type(await screen.findByLabelText('Nuova password'), 'NewPass#2026');
    await user.type(screen.getByLabelText('Conferma password'), 'NewPass#2026');
    await user.click(screen.getByRole('button', { name: 'Aggiorna password' }));

    expect(toast.error).toHaveBeenCalledWith('Inserisci la password attuale.');
    expect(mockedApi.post).not.toHaveBeenCalled();
  });
});

describe('ProfilePage — public demo account', () => {
  it('shows password and two-factor as disabled instead of their forms', async () => {
    mockedApi.get.mockResolvedValue({ data: profile(true) });
    render(<ProfilePage />, { wrapper: createWrapper() });

    expect(await screen.findAllByText(/Nella demo pubblica questa impostazione è disattivata/)).toHaveLength(2);
    expect(screen.queryByLabelText('Password attuale')).not.toBeInTheDocument();
    expect(screen.queryByText('two-factor form')).not.toBeInTheDocument();
  });
});
