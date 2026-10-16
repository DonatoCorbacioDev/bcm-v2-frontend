import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createWrapper } from '../mocks/wrapper';

// ─── Module mocks ────────────────────────────────────────────────────────────

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const mockConfirmVerifiedIban = jest.fn();
jest.mock('@/services/counterparties.service', () => ({
  counterpartiesService: {
    confirmVerifiedIban: (...args: unknown[]) => mockConfirmVerifiedIban(...args),
  },
}));

import { toast } from 'sonner';
import VerifyIbanDialog from '@/components/counterparties/VerifyIbanDialog';

const renderDialog = (overrides: Partial<React.ComponentProps<typeof VerifyIbanDialog>> = {}) => {
  const onOpenChange = jest.fn();
  render(
    <VerifyIbanDialog
      open={true}
      onOpenChange={onOpenChange}
      counterpartyId={1}
      currentIbanMasked={null}
      {...overrides}
    />,
    { wrapper: createWrapper() }
  );
  return { onOpenChange };
};

beforeEach(() => jest.clearAllMocks());

describe('VerifyIbanDialog', () => {
  it('shows "Non impostato" when there is no verified IBAN yet', () => {
    renderDialog({ currentIbanMasked: null });
    expect(screen.getByText('Non impostato')).toBeInTheDocument();
  });

  it('shows the masked current IBAN when one exists', () => {
    renderDialog({ currentIbanMasked: 'IT...3456' });
    expect(screen.getByText('IT...3456')).toBeInTheDocument();
  });

  it('rejects an empty IBAN without calling the API', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: 'Conferma' }));

    expect(toast.error).toHaveBeenCalledWith("L'IBAN è obbligatorio");
    expect(mockConfirmVerifiedIban).not.toHaveBeenCalled();
  });

  it('submits the trimmed IBAN/BIC, shows a success toast and closes on success', async () => {
    mockConfirmVerifiedIban.mockResolvedValue({ id: 1, verifiedIban: 'IT...3456' });
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();

    await user.type(screen.getByLabelText('Nuovo IBAN *'), '  IT60X0542811101000000123456  ');
    await user.type(screen.getByLabelText('Nuovo BIC (opzionale)'), ' BPPIITRRXXX ');
    await user.click(screen.getByRole('button', { name: 'Conferma' }));

    await waitFor(() =>
      expect(mockConfirmVerifiedIban).toHaveBeenCalledWith(1, {
        iban: 'IT60X0542811101000000123456',
        bic: 'BPPIITRRXXX',
      })
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('IBAN verificato aggiornato'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows the backend validation message on a 400 and keeps the dialog open', async () => {
    mockConfirmVerifiedIban.mockRejectedValue({
      response: { status: 400, data: { message: 'IBAN non valido' } },
    });
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();

    await user.type(screen.getByLabelText('Nuovo IBAN *'), 'NOT-AN-IBAN');
    await user.click(screen.getByRole('button', { name: 'Conferma' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('IBAN non valido'));
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('closes without calling the API when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Annulla' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(mockConfirmVerifiedIban).not.toHaveBeenCalled();
  });

  it('omits the BIC from the payload when left blank', async () => {
    mockConfirmVerifiedIban.mockResolvedValue({ id: 1, verifiedIban: 'IT...3456' });
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText('Nuovo IBAN *'), 'IT60X0542811101000000123456');
    await user.click(screen.getByRole('button', { name: 'Conferma' }));

    await waitFor(() =>
      expect(mockConfirmVerifiedIban).toHaveBeenCalledWith(1, {
        iban: 'IT60X0542811101000000123456',
        bic: undefined,
      })
    );
  });

  it('falls back to a generic error message when the backend sends a response with no message', async () => {
    mockConfirmVerifiedIban.mockRejectedValue({ response: { status: 500, data: {} } });
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText('Nuovo IBAN *'), 'IT60X0542811101000000123456');
    await user.click(screen.getByRole('button', { name: 'Conferma' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Aggiornamento dell'IBAN verificato non riuscito")
    );
  });

  it('falls back to a generic error message on a network error with no response at all', async () => {
    mockConfirmVerifiedIban.mockRejectedValue(new Error('Network Error'));
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText('Nuovo IBAN *'), 'IT60X0542811101000000123456');
    await user.click(screen.getByRole('button', { name: 'Conferma' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Aggiornamento dell'IBAN verificato non riuscito")
    );
  });

  it('ignores Escape (which would close the dialog) while the mutation is pending', async () => {
    let resolveMutation: (value: { id: number }) => void = () => {};
    mockConfirmVerifiedIban.mockImplementation(
      () => new Promise((resolve) => { resolveMutation = resolve; })
    );
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();

    await user.type(screen.getByLabelText('Nuovo IBAN *'), 'IT60X0542811101000000123456');
    await user.click(screen.getByRole('button', { name: 'Conferma' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Annulla' })).toBeDisabled());

    await user.keyboard('{Escape}');
    expect(onOpenChange).not.toHaveBeenCalled();

    resolveMutation({ id: 1 });
  });
});
