import React from 'react';
import { render, screen } from '@testing-library/react';
import { IbanCheckDialog } from '@/components/contracts/IbanCheckDialog';

/** What a user reads when an invoice asks to be paid on another bank account. */
describe('IbanCheckDialog', () => {
  const supplier = { id: 'supplier-1', name: 'Ferri & Associati S.r.l.', verifiedIban: 'IT...8400' };

  it('puts the two accounts side by side and says to call a known number', () => {
    render(
      <IbanCheckDialog open onOpenChange={() => {}} invoiceNumber="FA-2026-4T" invoiceIban="IT...5519" supplier={supplier} isAdmin />,
    );

    expect(screen.getByText('IT...5519')).toBeInTheDocument();
    expect(screen.getByText('IT...8400')).toBeInTheDocument();
    expect(screen.getByText(/numero che conosci già/)).toBeInTheDocument();
    expect(screen.getByText(/Non pagare questa fattura/)).toBeInTheDocument();
    // A name ending with a full stop gets no second one.
    expect(screen.getByText(/verificato per Ferri & Associati S\.r\.l\.$/)).toBeInTheDocument();
  });

  it("lets an administrator open the supplier's page to update the verified IBAN", () => {
    render(
      <IbanCheckDialog open onOpenChange={() => {}} invoiceNumber="FA-2026-4T" invoiceIban="IT...5519" supplier={supplier} isAdmin />,
    );

    expect(screen.getByRole('link', { name: 'Apri la scheda del fornitore' })).toHaveAttribute('href', '/counterparties/supplier-1');
  });

  it('sends anyone else to the administrator, with no link to a page they cannot change', () => {
    render(
      <IbanCheckDialog open onOpenChange={() => {}} invoiceNumber="FA-2026-4T" invoiceIban="IT...5519" supplier={supplier} isAdmin={false} />,
    );

    expect(screen.getByText(/chiedi all'amministratore/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Apri la scheda del fornitore' })).not.toBeInTheDocument();
  });
});
