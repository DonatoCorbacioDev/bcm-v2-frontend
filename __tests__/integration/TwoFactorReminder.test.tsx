import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { createWrapper } from '../mocks/wrapper';

jest.mock('@/services/twoFactorAuth.service', () => ({
  twoFactorAuthService: { getStatus: jest.fn() },
}));

import { twoFactorAuthService } from '@/services/twoFactorAuth.service';
import { TwoFactorReminder } from '@/components/dashboard/TwoFactorReminder';

const mockGetStatus = twoFactorAuthService.getStatus as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('TwoFactorReminder', () => {
  it('asks an admin without 2FA to turn it on, linking to the profile', async () => {
    mockGetStatus.mockResolvedValue(false);
    render(<TwoFactorReminder isAdmin />, { wrapper: createWrapper() });

    expect(await screen.findByRole('link', { name: /attiva la 2fa/i })).toHaveAttribute('href', '/profile');
  });

  it('shows nothing to an admin who already has 2FA', async () => {
    mockGetStatus.mockResolvedValue(true);
    render(<TwoFactorReminder isAdmin />, { wrapper: createWrapper() });

    await waitFor(() => expect(mockGetStatus).toHaveBeenCalled());
    expect(screen.queryByRole('link', { name: /attiva la 2fa/i })).not.toBeInTheDocument();
  });

  it('shows nothing when the check fails', async () => {
    mockGetStatus.mockRejectedValue(new Error('network'));
    render(<TwoFactorReminder isAdmin />, { wrapper: createWrapper() });

    await waitFor(() => expect(mockGetStatus).toHaveBeenCalled());
    expect(screen.queryByRole('link', { name: /attiva la 2fa/i })).not.toBeInTheDocument();
  });

  it('never asks a manager, nor checks their status', () => {
    render(<TwoFactorReminder isAdmin={false} />, { wrapper: createWrapper() });

    expect(mockGetStatus).not.toHaveBeenCalled();
    expect(screen.queryByRole('link', { name: /attiva la 2fa/i })).not.toBeInTheDocument();
  });
});
