import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
import { TERMS_VERSION } from '@/lib/legal';

const mockPost = api.post as jest.Mock;
const mockGet = api.get as jest.Mock;

async function fillForm() {
  await userEvent.type(screen.getByLabelText('Nome organizzazione'), 'Acme Srl');
  await userEvent.type(screen.getByLabelText('Nome'), 'Mario');
  await userEvent.type(screen.getByLabelText('Cognome'), 'Rossi');
  await userEvent.type(screen.getByLabelText('Email'), 'mario@acme.it');
  await userEvent.type(screen.getByLabelText('Nome utente'), 'mario');
  await userEvent.type(screen.getByLabelText('Password'), 'Secret#2026');
}

const declarations = () => [
  screen.getByRole('checkbox', { name: /accetto i termini di servizio/i }),
  screen.getByRole('checkbox', { name: /scopi imprenditoriali o professionali/i }),
  screen.getByRole('checkbox', { name: /artt\. 1341 e 1342/i }),
];

describe('RegisterOrgPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('keeps registration disabled until all three declarations are checked, one by one', async () => {
    render(<RegisterOrgPage />, { wrapper: createWrapper() });
    await fillForm();
    const submit = screen.getByRole('button', { name: 'Crea organizzazione' });

    for (const checkbox of declarations()) {
      expect(submit).toBeDisabled();
      await userEvent.click(checkbox);
    }

    expect(submit).toBeEnabled();
  });

  it('sends the declarations and the published Terms version with the registration', async () => {
    mockPost.mockResolvedValue({ data: { token: 'access-token' } });
    mockGet.mockResolvedValue({ data: { id: 1, username: 'mario', role: 'ADMIN' } });
    render(<RegisterOrgPage />, { wrapper: createWrapper() });
    await fillForm();
    for (const checkbox of declarations()) await userEvent.click(checkbox);

    await userEvent.click(screen.getByRole('button', { name: 'Crea organizzazione' }));

    await waitFor(() => expect(mockPost).toHaveBeenCalledWith('/organizations/register', expect.objectContaining({
      organizationName: 'Acme Srl',
      termsVersion: TERMS_VERSION,
      termsAccepted: true,
      professionalUse: true,
      onerousClausesApproved: true,
    })));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard'));
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
    await fillForm();
    for (const checkbox of declarations()) await userEvent.click(checkbox);

    await userEvent.click(screen.getByRole('button', { name: 'Crea organizzazione' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Termini di servizio sono stati aggiornati');
  });
});
