import React from 'react';
import { render, screen } from '@testing-library/react';
import ContractTermsPanel from '@/components/contracts/ContractTermsPanel';
import type { ContractTerm } from '@/types';
import { uid } from "../mocks/ids";

const term = (field: ContractTerm['field'], value: string, asWritten: string): ContractTerm => ({
  field, value, asWritten, sentence: `frase per ${field}`,
});

const renderTerms = (terms: ContractTerm[]) =>
  render(<ContractTermsPanel result={{ documentId: uid(1), terms } as never} isAdmin={false} onApply={jest.fn()} />);

describe('ContractTermsPanel — how each value is written', () => {
  it('says "No" when the text excludes the tacit renewal', () => {
    renderTerms([term('AUTO_RENEW', 'false', 'non si rinnova')]);
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('shows a notice already in days as written, without the conversion', () => {
    renderTerms([term('NOTICE_DAYS', '60', '60 giorni')]);
    expect(screen.getByText('60 giorni')).toBeInTheDocument();
    expect(screen.queryByText(/circa/)).not.toBeInTheDocument();
  });

  it('adds the days BCM would use when the notice is written in months', () => {
    renderTerms([term('NOTICE_DAYS', '90', '3 mesi')]);
    expect(screen.getByText('3 mesi (circa 90 giorni)')).toBeInTheDocument();
  });

  it('uses the singular for a one-month renewal', () => {
    renderTerms([term('RENEWAL_MONTHS', '1', 'un mese')]);
    expect(screen.getByText('1 mese')).toBeInTheDocument();
  });

  it('tells a non-admin that only an admin can apply the values', () => {
    renderTerms([term('RENEWAL_MONTHS', '12', '12 mesi')]);
    expect(screen.getByText('12 mesi')).toBeInTheDocument();
    expect(screen.getByText('Solo un amministratore può riportare questi valori nel contratto.')).toBeInTheDocument();
  });
});
