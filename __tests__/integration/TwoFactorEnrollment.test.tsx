import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createWrapper } from '../mocks/wrapper';

jest.mock('qrcode', () => ({
  __esModule: true,
  default: { toDataURL: jest.fn() },
}));

jest.mock('@/services/twoFactorAuth.service', () => ({
  twoFactorAuthService: { enrollSetup: jest.fn(), enrollConfirm: jest.fn() },
}));

import QRCode from 'qrcode';
import { twoFactorAuthService } from '@/services/twoFactorAuth.service';
import { TwoFactorEnrollment } from '@/components/auth/TwoFactorEnrollment';

const mockSetup = twoFactorAuthService.enrollSetup as jest.Mock;
const mockConfirm = twoFactorAuthService.enrollConfirm as jest.Mock;
const mockQr = QRCode.toDataURL as jest.Mock;

const writeText = jest.fn();
Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

function renderEnrollment(onComplete = jest.fn(), onCancel = jest.fn()) {
  render(<TwoFactorEnrollment setupToken="setup-1" onComplete={onComplete} onCancel={onCancel} />,
    { wrapper: createWrapper() });
  return { onComplete, onCancel };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockQr.mockResolvedValue('data:image/png;base64,fake');
  mockSetup.mockResolvedValue({ secret: 'JBSWY3DPEHPK3PXP', otpAuthUri: 'otpauth://totp/BCM:boss' });
});

describe('TwoFactorEnrollment', () => {
  it('shows the QR code and the manual key for the new secret', async () => {
    renderEnrollment();

    expect(await screen.findByRole('img', { name: /codice qr/i })).toHaveAttribute('src', 'data:image/png;base64,fake');
    expect(screen.getByText('JBSWY3DPEHPK3PXP')).toBeInTheDocument();
    expect(mockSetup).toHaveBeenCalledTimes(1);
  });

  it('still offers the manual key when the QR code cannot be drawn', async () => {
    mockQr.mockRejectedValue(new Error('canvas'));
    renderEnrollment();

    expect(await screen.findByText('JBSWY3DPEHPK3PXP')).toBeInTheDocument();
    await waitFor(() => expect(mockQr).toHaveBeenCalled());
    expect(screen.queryByRole('img', { name: /codice qr/i })).not.toBeInTheDocument();
  });

  it('says to sign in again when the setup token has expired', async () => {
    mockSetup.mockRejectedValue({ response: { data: { message: 'Sessione MFA non valida o scaduta' } } });
    const { onCancel } = renderEnrollment();

    expect(await screen.findByRole('alert')).toHaveTextContent('Sessione MFA non valida o scaduta');
    await userEvent.click(screen.getByRole('button', { name: 'Annulla' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('accepts digits only, and starts the session only after the recovery codes', async () => {
    mockConfirm.mockResolvedValue({ token: 'access', recoveryCodes: ['AAAA-BBBB', 'CCCC-DDDD'] });
    writeText.mockResolvedValue(undefined);
    const { onComplete } = renderEnrollment();

    const input = await screen.findByLabelText(/codice di verifica/i);
    await userEvent.type(input, '12a3456789');
    expect(input).toHaveValue('123456');
    await userEvent.click(screen.getByRole('button', { name: /attiva e accedi/i }));

    expect(await screen.findByRole('list', { name: /codici di recupero/i })).toHaveTextContent('AAAA-BBBB');
    expect(onComplete).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: /copia tutti/i }));
    expect(writeText).toHaveBeenCalledWith('AAAA-BBBB\nCCCC-DDDD');
    expect(await screen.findByRole('button', { name: /copiati/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /ho salvato i codici/i }));
    expect(onComplete).toHaveBeenCalledWith('access');
  });

  it('keeps the copy button as it was when the clipboard refuses', async () => {
    mockConfirm.mockResolvedValue({ token: 'access', recoveryCodes: ['AAAA-BBBB'] });
    writeText.mockRejectedValue(new Error('denied'));
    renderEnrollment();

    await userEvent.type(await screen.findByLabelText(/codice di verifica/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /attiva e accedi/i }));
    await userEvent.click(await screen.findByRole('button', { name: /copia tutti/i }));

    expect(screen.getByRole('button', { name: /copia tutti/i })).toBeInTheDocument();
  });
});
