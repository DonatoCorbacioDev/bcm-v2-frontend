import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createWrapper } from '../mocks/wrapper';

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

jest.mock('qrcode', () => ({
  __esModule: true,
  default: { toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,fake') },
}));

jest.mock('@/services/twoFactorAuth.service', () => ({
  twoFactorAuthService: {
    getStatus: jest.fn(),
    setup: jest.fn(),
    confirm: jest.fn(),
    disable: jest.fn(),
  },
}));

import { toast } from 'sonner';
import QRCode from 'qrcode';
import { twoFactorAuthService } from '@/services/twoFactorAuth.service';
import TwoFactorAuthCard from '@/components/profile/TwoFactorAuthCard';

const mockGetStatus = twoFactorAuthService.getStatus as jest.Mock;
const mockSetup = twoFactorAuthService.setup as jest.Mock;
const mockConfirm = twoFactorAuthService.confirm as jest.Mock;
const mockDisable = twoFactorAuthService.disable as jest.Mock;

Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: jest.fn().mockResolvedValue(undefined) },
  configurable: true,
});

function renderCard() {
  return render(<TwoFactorAuthCard />, { wrapper: createWrapper() });
}

beforeEach(() => jest.clearAllMocks());

describe('TwoFactorAuthCard', () => {
  it('shows "Non attiva" and an "Attiva 2FA" button when 2FA is disabled', async () => {
    mockGetStatus.mockResolvedValue(false);
    renderCard();

    await waitFor(() => expect(screen.getByText(/non attiva/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /attiva 2fa/i })).toBeInTheDocument();
  });

  it('shows "Attiva" badge and a "Disattiva" button when 2FA is enabled', async () => {
    mockGetStatus.mockResolvedValue(true);
    renderCard();

    await waitFor(() => expect(screen.getByText(/^attiva$/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /disattiva/i })).toBeInTheDocument();
  });

  it('starts setup, shows the QR code and manual key, then confirms and shows recovery codes', async () => {
    mockGetStatus.mockResolvedValue(false);
    mockSetup.mockResolvedValue({ secret: 'ABCD1234', otpAuthUri: 'otpauth://totp/BCM:admin?secret=ABCD1234' });
    mockConfirm.mockResolvedValue(['AAAA-1111', 'BBBB-2222', 'CCCC-3333']);

    renderCard();
    await waitFor(() => expect(screen.getByRole('button', { name: /attiva 2fa/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /attiva 2fa/i }));

    await waitFor(() => expect(screen.getByText('ABCD1234')).toBeInTheDocument());
    expect(await screen.findByAltText(/qr code/i)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/codice di verifica/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /conferma e attiva/i }));

    await waitFor(() => expect(mockConfirm).toHaveBeenCalledWith('123456'));
    expect(await screen.findByText('AAAA-1111')).toBeInTheDocument();
    expect(screen.getByText('BBBB-2222')).toBeInTheDocument();
    expect(screen.getByText('CCCC-3333')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /ho salvato i codici/i }));
    expect(screen.getByRole('button', { name: /disattiva/i })).toBeInTheDocument();
  });

  it('shows an error toast when confirming with an invalid code', async () => {
    mockGetStatus.mockResolvedValue(false);
    mockSetup.mockResolvedValue({ secret: 'ABCD1234', otpAuthUri: 'otpauth://totp/BCM:admin?secret=ABCD1234' });
    mockConfirm.mockRejectedValue(new Error('invalid code'));

    renderCard();
    await waitFor(() => expect(screen.getByRole('button', { name: /attiva 2fa/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /attiva 2fa/i }));

    await waitFor(() => expect(screen.getByLabelText(/codice di verifica/i)).toBeInTheDocument());
    await userEvent.type(screen.getByLabelText(/codice di verifica/i), '000000');
    await userEvent.click(screen.getByRole('button', { name: /conferma e attiva/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Codice non valido'));
  });

  it('disables 2FA after confirming with a valid code', async () => {
    mockGetStatus.mockResolvedValue(true);
    mockDisable.mockResolvedValue(undefined);

    renderCard();
    await waitFor(() => expect(screen.getByRole('button', { name: /disattiva/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /disattiva/i }));

    const input = screen.getByPlaceholderText('123456');
    await userEvent.type(input, '654321');
    await userEvent.click(screen.getByRole('button', { name: /conferma disattivazione/i }));

    await waitFor(() => expect(mockDisable).toHaveBeenCalledWith('654321'));
    expect(toast.success).toHaveBeenCalledWith('Autenticazione a due fattori disattivata');
  });

  it('shows an error toast when starting setup fails', async () => {
    mockGetStatus.mockResolvedValue(false);
    mockSetup.mockRejectedValue(new Error('network error'));

    renderCard();
    await waitFor(() => expect(screen.getByRole('button', { name: /attiva 2fa/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /attiva 2fa/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Avvio della configurazione 2FA non riuscito')
    );
  });

  it('shows an error toast when disabling with an invalid code', async () => {
    mockGetStatus.mockResolvedValue(true);
    mockDisable.mockRejectedValue(new Error('invalid code'));

    renderCard();
    await waitFor(() => expect(screen.getByRole('button', { name: /disattiva/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /disattiva/i }));

    await userEvent.type(screen.getByPlaceholderText('123456'), '000000');
    await userEvent.click(screen.getByRole('button', { name: /conferma disattivazione/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Codice non valido'));
  });

  it('cancels disabling and returns to the idle step', async () => {
    mockGetStatus.mockResolvedValue(true);

    renderCard();
    await waitFor(() => expect(screen.getByRole('button', { name: /disattiva/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /disattiva/i }));

    await userEvent.type(screen.getByPlaceholderText('123456'), '000000');
    await userEvent.click(screen.getByRole('button', { name: /annulla/i }));

    expect(screen.getByRole('button', { name: /disattiva/i })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('123456')).not.toBeInTheDocument();
  });

  it('copies recovery codes to the clipboard', async () => {
    mockGetStatus.mockResolvedValue(false);
    mockSetup.mockResolvedValue({ secret: 'ABCD1234', otpAuthUri: 'otpauth://totp/BCM:admin?secret=ABCD1234' });
    mockConfirm.mockResolvedValue(['AAAA-1111', 'BBBB-2222']);

    renderCard();
    await waitFor(() => expect(screen.getByRole('button', { name: /attiva 2fa/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /attiva 2fa/i }));

    await userEvent.type(screen.getByLabelText(/codice di verifica/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /conferma e attiva/i }));

    await userEvent.click(await screen.findByRole('button', { name: /copia tutti/i }));

    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('AAAA-1111\nBBBB-2222')
    );
    expect(toast.success).toHaveBeenCalledWith('Codici copiati negli appunti');
  });

  it('shows an error toast when copying recovery codes fails', async () => {
    mockGetStatus.mockResolvedValue(false);
    mockSetup.mockResolvedValue({ secret: 'ABCD1234', otpAuthUri: 'otpauth://totp/BCM:admin?secret=ABCD1234' });
    mockConfirm.mockResolvedValue(['AAAA-1111']);
    (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(new Error('denied'));

    renderCard();
    await waitFor(() => expect(screen.getByRole('button', { name: /attiva 2fa/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /attiva 2fa/i }));

    await userEvent.type(screen.getByLabelText(/codice di verifica/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /conferma e attiva/i }));

    await userEvent.click(await screen.findByRole('button', { name: /copia tutti/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Copia negli appunti non riuscita'));
  });

  it('shows a "Preparazione..." label while setup is pending', async () => {
    mockGetStatus.mockResolvedValue(false);
    let resolveSetup: (value: { secret: string; otpAuthUri: string }) => void;
    mockSetup.mockReturnValue(new Promise((resolve) => { resolveSetup = resolve; }));

    renderCard();
    await waitFor(() => expect(screen.getByRole('button', { name: /attiva 2fa/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /attiva 2fa/i }));

    expect(await screen.findByRole('button', { name: /preparazione/i })).toBeInTheDocument();
    resolveSetup!({ secret: 'ABCD1234', otpAuthUri: 'otpauth://totp/BCM:admin?secret=ABCD1234' });
    await waitFor(() => expect(screen.getByText('ABCD1234')).toBeInTheDocument());
  });

  it('shows a "Verifica..." label while confirming a code is pending', async () => {
    mockGetStatus.mockResolvedValue(false);
    mockSetup.mockResolvedValue({ secret: 'ABCD1234', otpAuthUri: 'otpauth://totp/BCM:admin?secret=ABCD1234' });
    let resolveConfirm: (value: string[]) => void;
    mockConfirm.mockReturnValue(new Promise((resolve) => { resolveConfirm = resolve; }));

    renderCard();
    await waitFor(() => expect(screen.getByRole('button', { name: /attiva 2fa/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /attiva 2fa/i }));
    await userEvent.type(await screen.findByLabelText(/codice di verifica/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /conferma e attiva/i }));

    expect(await screen.findByRole('button', { name: /verifica\.\.\./i })).toBeInTheDocument();
    resolveConfirm!(['AAAA-1111']);
    await waitFor(() => expect(screen.getByText('AAAA-1111')).toBeInTheDocument());
  });

  it('shows a "Disattivazione..." label while disabling is pending', async () => {
    mockGetStatus.mockResolvedValue(true);
    let resolveDisable: (value: void) => void;
    mockDisable.mockReturnValue(new Promise((resolve) => { resolveDisable = resolve; }));

    renderCard();
    await waitFor(() => expect(screen.getByRole('button', { name: /disattiva/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /disattiva/i }));
    await userEvent.type(screen.getByPlaceholderText('123456'), '654321');
    await userEvent.click(screen.getByRole('button', { name: /conferma disattivazione/i }));

    expect(await screen.findByRole('button', { name: /disattivazione\.\.\./i })).toBeInTheDocument();
    resolveDisable!(undefined);
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Autenticazione a due fattori disattivata'));
  });

  it('does not set the QR code data URL if the component unmounts before it resolves', async () => {
    mockGetStatus.mockResolvedValue(false);
    mockSetup.mockResolvedValue({ secret: 'ABCD1234', otpAuthUri: 'otpauth://totp/BCM:admin?secret=ABCD1234' });
    let resolveQr: (value: string) => void;
    (QRCode.toDataURL as jest.Mock).mockReturnValue(new Promise((resolve) => { resolveQr = resolve; }));

    const { unmount } = renderCard();
    await waitFor(() => expect(screen.getByRole('button', { name: /attiva 2fa/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /attiva 2fa/i }));
    await waitFor(() => expect(screen.getByText('ABCD1234')).toBeInTheDocument());

    unmount();
    resolveQr!('data:image/png;base64,fake');
  });
});
