import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createWrapper } from '../mocks/wrapper';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
}));

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    defaults: { headers: { common: {} } },
  },
}));

const mockSetAuth = jest.fn();
jest.mock('@/store/authStore', () => ({
  useAuthStore: () => ({ setAuth: mockSetAuth }),
}));

import RegisterOrgPage from '@/app/(auth)/register-org/page';
import api from '@/lib/api';
import { ONEROUS_CLAUSES, TERMS_VERSION } from '@/lib/legal';

const mockPost = api.post as jest.Mock;
const mockGet = api.get as jest.Mock;

type User = ReturnType<typeof userEvent.setup>;

async function fillForm(user: User = userEvent.setup()) {
  await user.type(screen.getByLabelText('Nome organizzazione'), 'Acme Srl');
  await user.type(screen.getByLabelText('Nome'), 'Mario');
  await user.type(screen.getByLabelText('Cognome'), 'Rossi');
  await user.type(screen.getByLabelText('Email'), 'mario@acme.it');
  await user.type(screen.getByLabelText('Nome utente'), 'mario');
  await user.type(screen.getByLabelText('Password'), 'Secret#2026');
}

const declarations = () => [
  screen.getByRole('checkbox', { name: /accetto i termini di servizio/i }),
  screen.getByRole('checkbox', { name: /scopi imprenditoriali o professionali/i }),
  screen.getByRole('checkbox', { name: /artt\. 1341 e 1342/i }),
];

/** Step 1: fill the form, tick the three declarations, ask for the code. */
async function submitForm(user: User = userEvent.setup()) {
  await fillForm(user);
  for (const checkbox of declarations()) await user.click(checkbox);
  await user.click(screen.getByRole('button', { name: 'Continua' }));
}

const started = { registrationId: 'reg-1', expiresInMinutes: 15, resendCooldownSeconds: 0 };

describe('RegisterOrgPage', () => {
  beforeEach(() => jest.resetAllMocks());

  it('keeps registration disabled until all three declarations are checked, one by one', async () => {
    render(<RegisterOrgPage />, { wrapper: createWrapper() });
    await fillForm();
    const submit = screen.getByRole('button', { name: 'Continua' });

    for (const checkbox of declarations()) {
      expect(submit).toBeDisabled();
      await userEvent.click(checkbox);
    }

    expect(submit).toBeEnabled();
  });

  it('sends the declarations and the published Terms version, then asks for the emailed code', async () => {
    mockPost.mockResolvedValueOnce({ data: started });
    render(<RegisterOrgPage />, { wrapper: createWrapper() });

    await submitForm();

    expect(mockPost).toHaveBeenCalledWith('/organizations/register', expect.objectContaining({
      organizationName: 'Acme Srl',
      termsVersion: TERMS_VERSION,
      termsAccepted: true,
      professionalUse: true,
      onerousClausesApproved: true,
    }));
    expect(await screen.findByRole('heading', { name: 'Conferma la registrazione' })).toBeInTheDocument();
    expect(screen.getByText('mario@acme.it')).toBeInTheDocument();
    expect(screen.getByText(/artt\. 1341 e 1342/)).toHaveTextContent(ONEROUS_CLAUSES);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('confirms with the 6-digit code and lands on the dashboard', async () => {
    mockPost
      .mockResolvedValueOnce({ data: started })
      .mockResolvedValueOnce({ data: { token: 'access-token' } });
    mockGet.mockResolvedValue({ data: { id: 1, username: 'mario', role: 'ADMIN' } });
    render(<RegisterOrgPage />, { wrapper: createWrapper() });
    await submitForm();

    const sign = await screen.findByRole('button', { name: 'Firma e crea organizzazione' });
    const codeInput = screen.getByLabelText('Codice di conferma');
    await userEvent.type(codeInput, '12a3456789');
    expect(codeInput).toHaveValue('123456');
    await userEvent.click(sign);

    await waitFor(() => expect(mockPost).toHaveBeenLastCalledWith('/organizations/register/confirm', {
      registrationId: 'reg-1',
      code: '123456',
    }));
    await waitFor(() => expect(mockSetAuth).toHaveBeenCalled());
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('keeps the confirm button disabled until six digits are typed', async () => {
    mockPost.mockResolvedValueOnce({ data: started });
    render(<RegisterOrgPage />, { wrapper: createWrapper() });
    await submitForm();

    const sign = await screen.findByRole('button', { name: 'Firma e crea organizzazione' });
    await userEvent.type(screen.getByLabelText('Codice di conferma'), '12345');
    expect(sign).toBeDisabled();
  });

  it('shows the backend message when the code is wrong', async () => {
    mockPost
      .mockResolvedValueOnce({ data: started })
      .mockRejectedValueOnce({ response: { data: { message: 'Codice non corretto.' } } });
    render(<RegisterOrgPage />, { wrapper: createWrapper() });
    await submitForm();

    await userEvent.type(await screen.findByLabelText('Codice di conferma'), '000000');
    await userEvent.click(screen.getByRole('button', { name: 'Firma e crea organizzazione' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Codice non corretto.');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('requests a new code and says the old one is no longer valid', async () => {
    mockPost.mockResolvedValueOnce({ data: started }).mockResolvedValueOnce({ data: started });
    render(<RegisterOrgPage />, { wrapper: createWrapper() });
    await submitForm();

    await userEvent.click(await screen.findByRole('button', { name: 'Invia un nuovo codice' }));

    expect(mockPost).toHaveBeenLastCalledWith('/organizations/register/resend', { registrationId: 'reg-1' });
    expect(await screen.findByRole('status')).toHaveTextContent('nuovo codice');
  });

  it('shows the backend message when a new code is refused', async () => {
    mockPost
      .mockResolvedValueOnce({ data: started })
      .mockRejectedValueOnce({ response: { data: { message: 'Hai richiesto troppi codici: compila di nuovo il modulo.' } } });
    render(<RegisterOrgPage />, { wrapper: createWrapper() });
    await submitForm();

    await userEvent.click(await screen.findByRole('button', { name: 'Invia un nuovo codice' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('troppi codici');
  });

  it('counts down before a new code can be requested', async () => {
    jest.useFakeTimers();
    try {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      mockPost.mockResolvedValueOnce({ data: { ...started, resendCooldownSeconds: 2 } });
      render(<RegisterOrgPage />, { wrapper: createWrapper() });
      await submitForm(user);

      expect(await screen.findByRole('button', { name: 'Invia un nuovo codice (2s)' })).toBeDisabled();
      act(() => { jest.advanceTimersByTime(1000); });
      act(() => { jest.advanceTimersByTime(1000); });
      expect(screen.getByRole('button', { name: 'Invia un nuovo codice' })).toBeEnabled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('goes back to the form, keeping what was typed', async () => {
    mockPost.mockResolvedValueOnce({ data: started });
    render(<RegisterOrgPage />, { wrapper: createWrapper() });
    await submitForm();

    await userEvent.click(await screen.findByRole('button', { name: 'Modifica i dati' }));

    expect(screen.getByLabelText('Nome organizzazione')).toHaveValue('Acme Srl');
  });

  it('links the Terms and the Privacy notice from the acceptance checkbox', () => {
    render(<RegisterOrgPage />, { wrapper: createWrapper() });

    expect(screen.getByRole('link', { name: 'Termini di servizio' })).toHaveAttribute('href', '/termini');
    expect(screen.getByRole('link', { name: 'Informativa privacy' })).toHaveAttribute('href', '/privacy');
  });

  it('shows the backend message when registration is refused (e.g. stale Terms version)', async () => {
    mockPost.mockRejectedValue({
      response: { data: { message: 'I Termini di servizio sono stati aggiornati: ricarica la pagina e accettali di nuovo.' } },
    });
    render(<RegisterOrgPage />, { wrapper: createWrapper() });
    await submitForm();

    expect(await screen.findByRole('alert')).toHaveTextContent('Termini di servizio sono stati aggiornati');
  });
});
