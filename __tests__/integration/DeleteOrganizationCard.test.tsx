import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { createWrapper } from '../mocks/wrapper';

jest.mock('@/services/organization.service', () => ({
  organizationService: {
    requestDeletion: jest.fn(),
    confirmDeletion: jest.fn(),
    cancelDeletion: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

import { toast } from 'sonner';
import { organizationService } from '@/services/organization.service';
import { DeleteOrganizationCard } from '@/components/organization/DeleteOrganizationCard';

const service = organizationService as jest.Mocked<typeof organizationService>;

/** A rejected request carrying the backend's own message, as GlobalExceptionHandler sends it. */
const apiError = (status: number, message?: string) =>
  new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status, statusText: '', data: message ? { message } : {}, headers: {},
    config: { headers: new AxiosHeaders() },
  });

const renderCard = (deletionScheduledFor: string | null = null) =>
  render(<DeleteOrganizationCard organizationName="Acme S.r.l." deletionScheduledFor={deletionScheduledFor} />,
    { wrapper: createWrapper() });

/** Opens the dialog and fills step 1. */
async function fillRequest(name = 'Acme S.r.l.') {
  await userEvent.click(screen.getByRole('button', { name: 'Cancella organizzazione' }));
  await userEvent.type(screen.getByLabelText('La tua password'), 'secret');
  await userEvent.type(screen.getByLabelText(/per confermare/), name);
}

beforeEach(() => {
  jest.clearAllMocks();
  service.requestDeletion.mockResolvedValue({ expiresInMinutes: 15, resendCooldownSeconds: 60 });
});

describe('DeleteOrganizationCard — no deletion scheduled', () => {
  it('explains what is deleted and the 30 days to change idea', () => {
    renderCard();

    expect(screen.getByText('Zona pericolosa')).toBeInTheDocument();
    expect(screen.getByText(/30 giorni dopo la conferma/)).toBeInTheDocument();
  });

  it('only lets the code be requested once the password is given and the name retyped exactly', async () => {
    renderCard();
    await fillRequest('Acme');
    const send = screen.getByRole('button', { name: 'Invia il codice' });
    expect(send).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/per confermare/), ' S.r.l.');
    expect(send).toBeEnabled();
  });

  it('asks for the code, then schedules the deletion and refreshes the organization', async () => {
    service.confirmDeletion.mockResolvedValue({ scheduledFor: '2026-12-03T02:00:00' });
    renderCard();
    await fillRequest();

    await userEvent.click(screen.getByRole('button', { name: 'Invia il codice' }));

    expect(service.requestDeletion).toHaveBeenCalledWith({ password: 'secret', organizationName: 'Acme S.r.l.' });
    expect(await screen.findByText(/codice a 6 cifre, valido 15 minuti/)).toBeInTheDocument();
    const confirm = screen.getByRole('button', { name: 'Conferma la cancellazione' });
    expect(confirm).toBeDisabled();
    // Only digits are kept, at most six.
    await userEvent.type(screen.getByLabelText('Codice di conferma'), '12a3456789');
    expect(screen.getByLabelText('Codice di conferma')).toHaveValue('123456');

    await userEvent.click(confirm);

    await waitFor(() => expect(service.confirmDeletion).toHaveBeenCalledWith('123456'));
    expect(toast.success).toHaveBeenCalledWith('Cancellazione programmata per il 3 dicembre 2026');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it("shows the backend's reason when the request is refused, e.g. a paid plan", async () => {
    service.requestDeletion.mockRejectedValue(apiError(409, 'Prima annulla l\'abbonamento'));
    renderCard();
    await fillRequest();

    await userEvent.click(screen.getByRole('button', { name: 'Invia il codice' }));

    expect(await screen.findByRole('alert')).toHaveTextContent("Prima annulla l'abbonamento");
  });

  it('keeps the code step after a wrong code, goes back to step 1 when the code is used up', async () => {
    service.confirmDeletion
      .mockRejectedValueOnce(apiError(400, 'Codice non corretto.'))
      .mockRejectedValueOnce(apiError(400, 'Troppi tentativi con un codice errato: ripeti la richiesta.'));
    renderCard();
    await fillRequest();
    await userEvent.click(screen.getByRole('button', { name: 'Invia il codice' }));
    await userEvent.type(await screen.findByLabelText('Codice di conferma'), '000000');

    await userEvent.click(screen.getByRole('button', { name: 'Conferma la cancellazione' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Codice non corretto.');
    expect(screen.getByLabelText('Codice di conferma')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Conferma la cancellazione' }));
    expect(await screen.findByLabelText('La tua password')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('ripeti la richiesta');
  });

  it('waits for the cooldown before a new code can be sent', async () => {
    service.requestDeletion.mockResolvedValue({ expiresInMinutes: 15, resendCooldownSeconds: 0 });
    renderCard();
    await fillRequest();
    await userEvent.click(screen.getByRole('button', { name: 'Invia il codice' }));

    await userEvent.click(await screen.findByRole('button', { name: 'Non è arrivato? Invia un nuovo codice' }));

    await waitFor(() => expect(service.requestDeletion).toHaveBeenCalledTimes(2));
  });

  it('says in plain words how long to wait, with no resend button meanwhile', async () => {
    renderCard();
    await fillRequest();
    await userEvent.click(screen.getByRole('button', { name: 'Invia il codice' }));

    expect(await screen.findByText('Non è arrivato? Potrai chiedere un nuovo codice tra 60 secondi.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /nuovo codice/ })).not.toBeInTheDocument();
    expect(await screen.findByText(/tra 59 secondi/, {}, { timeout: 2000 })).toBeInTheDocument();
  });

  it('reports rate limiting and network failures without the backend message', async () => {
    service.requestDeletion.mockRejectedValueOnce(apiError(429)).mockRejectedValueOnce(new Error('network'));
    renderCard();
    await fillRequest();

    await userEvent.click(screen.getByRole('button', { name: 'Invia il codice' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Troppi tentativi, riprova tra un minuto');

    await userEvent.click(screen.getByRole('button', { name: 'Invia il codice' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Richiesta non riuscita'));
  });

  it('stays open, with what was typed, when clicking outside it', async () => {
    renderCard();
    await fillRequest();

    // What Radix listens to for "outside": a pointerdown outside the content.
    // (A user-event click can't reach the page behind a modal: pointer-events: none.)
    fireEvent.pointerDown(document.body);
    fireEvent.click(document.body);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('La tua password')).toHaveValue('secret');
  });

  it('forgets what was typed when the dialog is closed', async () => {
    renderCard();
    await fillRequest();

    await userEvent.click(screen.getByRole('button', { name: 'Annulla' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancella organizzazione' }));

    expect(screen.getByLabelText('La tua password')).toHaveValue('');
    expect(screen.getByLabelText(/per confermare/)).toHaveValue('');
  });
});

describe('DeleteOrganizationCard — deletion scheduled', () => {
  it('shows the date and lets any admin cancel it', async () => {
    service.cancelDeletion.mockResolvedValue(undefined);
    renderCard('2026-12-03T02:00:00');

    expect(screen.getByText('Cancellazione programmata')).toBeInTheDocument();
    expect(screen.getByText('3 dicembre 2026')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancella organizzazione' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Annulla la cancellazione' }));

    await waitFor(() => expect(service.cancelDeletion).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith('Cancellazione annullata: nessun dato verrà cancellato');
  });

  it('tells when cancelling fails', async () => {
    service.cancelDeletion.mockRejectedValue(apiError(400, "Non c'è nessuna cancellazione programmata."));
    renderCard('2026-12-03T02:00:00');

    await userEvent.click(screen.getByRole('button', { name: 'Annulla la cancellazione' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Non c'è nessuna cancellazione programmata."));
  });
});

describe('DeleteOrganizationCard — while a request is on its way', () => {
  const never = () => new Promise<never>(() => {});

  it('says the code is being sent, and Esc does not close the dialog meanwhile', async () => {
    service.requestDeletion.mockImplementation(never);
    renderCard();
    await fillRequest();

    await userEvent.click(screen.getByRole('button', { name: 'Invia il codice' }));
    expect(await screen.findByRole('button', { name: 'Invio del codice...' })).toBeDisabled();

    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('says the deletion is being confirmed', async () => {
    service.confirmDeletion.mockImplementation(never);
    renderCard();
    await fillRequest();
    await userEvent.click(screen.getByRole('button', { name: 'Invia il codice' }));
    await userEvent.type(await screen.findByLabelText('Codice di conferma'), '123456');

    await userEvent.click(screen.getByRole('button', { name: 'Conferma la cancellazione' }));

    expect(await screen.findByRole('button', { name: 'Conferma...' })).toBeDisabled();
  });

  it('says a new code is being sent from the code step', async () => {
    service.requestDeletion
      .mockResolvedValueOnce({ expiresInMinutes: 15, resendCooldownSeconds: 0 })
      .mockImplementation(never);
    renderCard();
    await fillRequest();
    await userEvent.click(screen.getByRole('button', { name: 'Invia il codice' }));

    await userEvent.click(await screen.findByRole('button', { name: 'Non è arrivato? Invia un nuovo codice' }));

    expect(await screen.findByRole('button', { name: 'Invio del codice...' })).toBeDisabled();
  });

  it('uses the singular for the last second of the cooldown', async () => {
    service.requestDeletion.mockResolvedValue({ expiresInMinutes: 15, resendCooldownSeconds: 1 });
    renderCard();
    await fillRequest();
    await userEvent.click(screen.getByRole('button', { name: 'Invia il codice' }));

    expect(await screen.findByText('Non è arrivato? Potrai chiedere un nuovo codice tra 1 secondo.')).toBeInTheDocument();
  });

  it('closes with Esc and forgets what was typed when nothing is pending', async () => {
    renderCard();
    await fillRequest();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Cancella organizzazione' }));

    expect(screen.getByLabelText('La tua password')).toHaveValue('');
  });

  it('says the cancellation is under way', async () => {
    service.cancelDeletion.mockImplementation(never);
    renderCard('2026-12-03T10:00:00Z');

    await userEvent.click(screen.getByRole('button', { name: 'Annulla la cancellazione' }));

    expect(await screen.findByRole('button', { name: 'Annullamento...' })).toBeDisabled();
  });
});

describe('DeleteOrganizationCard — errors without a message', () => {
  it('falls back to a generic sentence when the backend sends no message or is unreachable', async () => {
    service.requestDeletion
      .mockRejectedValueOnce(apiError(500))
      .mockRejectedValueOnce(new AxiosError('Network Error', 'ERR_NETWORK'));
    renderCard();
    await fillRequest();

    await userEvent.click(screen.getByRole('button', { name: 'Invia il codice' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Richiesta non riuscita, riprova più tardi');

    await userEvent.click(screen.getByRole('button', { name: 'Invia il codice' }));
    await waitFor(() => expect(service.requestDeletion).toHaveBeenCalledTimes(2));
    expect(screen.getByRole('alert')).toHaveTextContent('Richiesta non riuscita, riprova più tardi');
  });
});
