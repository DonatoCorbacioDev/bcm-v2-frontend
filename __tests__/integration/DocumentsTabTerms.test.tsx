import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createWrapper } from '../mocks/wrapper';

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
// Reading renewal and dates sits behind the document AI flag (see DocumentsTab).
jest.mock('@/lib/featureFlags', () => ({ SHOW_EXPERIMENTAL_AI: true }));
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

import { toast } from 'sonner';
import api from '@/lib/api';
import DocumentsTab from '@/components/contracts/DocumentsTab';
import { termsToContract } from '@/components/contracts/ContractTermsPanel';
import { uid } from "../mocks/ids";

const doc = {
  id: uid(1), contractId: uid(1), fileName: 'contratto.pdf',
  fileSize: 1500, contentType: 'application/pdf',
  uploadedAt: '2026-03-15T10:00:00Z', downloadUrl: '',
};

const sentence = 'Il contratto si rinnova tacitamente salvo disdetta con preavviso di tre mesi.';
const terms = {
  documentId: uid(1),
  terms: [
    { field: 'AUTO_RENEW', value: 'true', asWritten: 'rinnova tacitamente', sentence },
    { field: 'NOTICE_DAYS', value: '90', asWritten: '3 mesi', sentence },
    { field: 'RENEWAL_MONTHS', value: '12', asWritten: 'per un ulteriore anno', sentence },
    { field: 'END_DATE', value: '2027-01-31', asWritten: 'con scadenza il 31 gennaio 2027', sentence },
  ],
};

const mockApi = (termsResponse: object | Error) => {
  (api.get as jest.Mock).mockImplementation((url: string) => {
    if (url.endsWith('/terms')) {
      return termsResponse instanceof Error ? Promise.reject(termsResponse) : Promise.resolve({ data: termsResponse });
    }
    return Promise.resolve({ data: [doc] });
  });
};

const openTerms = async () => {
  await userEvent.click(await screen.findByRole('button', { name: 'Leggi rinnovo e scadenze dal documento' }));
};

beforeEach(() => jest.clearAllMocks());

describe('DocumentsTab — renewal and dates read from the document', () => {
  it('shows each value with the sentence it comes from', async () => {
    mockApi(terms);
    render(<DocumentsTab contractId={uid(1)} isAdmin={false} onApply={jest.fn()} />, { wrapper: createWrapper() });
    await openTerms();

    expect(await screen.findByText('Rinnovo e scadenze nel documento')).toBeInTheDocument();
    expect(screen.getByText('3 mesi (circa 90 giorni)')).toBeInTheDocument();
    expect(screen.getByText('12 mesi')).toBeInTheDocument();
    expect(screen.getByText('31 gennaio 2027')).toBeInTheDocument();
    expect(screen.getAllByText(`“${sentence}”`)).toHaveLength(4);
    expect(api.get).toHaveBeenCalledWith(`/contracts/${uid(1)}/documents/${uid(1)}/terms`);
  });

  it('lets a manager read the values but not apply them', async () => {
    mockApi(terms);
    render(<DocumentsTab contractId={uid(1)} isAdmin={false} onApply={jest.fn()} />, { wrapper: createWrapper() });
    await openTerms();

    expect(await screen.findByText(/solo un amministratore/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Usa questi valori' })).not.toBeInTheDocument();
  });

  it('lets an admin open the edit form pre-filled with the values', async () => {
    mockApi(terms);
    const onApply = jest.fn();
    render(<DocumentsTab contractId={uid(1)} isAdmin onApply={onApply} />, { wrapper: createWrapper() });
    await openTerms();
    await userEvent.click(await screen.findByRole('button', { name: 'Usa questi valori' }));

    expect(onApply).toHaveBeenCalledWith({ autoRenew: true, noticeDays: 90, renewalMonths: 12, endDate: '2027-01-31' });
  });

  it('says so when the text states nothing clear', async () => {
    mockApi({ documentId: uid(1), terms: [] });
    render(<DocumentsTab contractId={uid(1)} isAdmin onApply={jest.fn()} />, { wrapper: createWrapper() });
    await openTerms();

    expect(await screen.findByText(/meglio nessun valore che uno sbagliato/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Usa questi valori' })).not.toBeInTheDocument();
  });

  it('collapses and reopens without asking the server again', async () => {
    mockApi(terms);
    render(<DocumentsTab contractId={uid(1)} isAdmin onApply={jest.fn()} />, { wrapper: createWrapper() });
    await openTerms();
    expect(await screen.findByText('Rinnovo e scadenze nel documento')).toBeInTheDocument();

    await openTerms();
    expect(screen.queryByText('Rinnovo e scadenze nel documento')).not.toBeInTheDocument();
    await openTerms();
    expect(screen.getByText('Rinnovo e scadenze nel documento')).toBeInTheDocument();
    expect((api.get as jest.Mock).mock.calls.filter(([url]) => url.endsWith('/terms'))).toHaveLength(1);
  });

  it('shows an error toast when reading fails', async () => {
    mockApi(new Error('boom'));
    render(<DocumentsTab contractId={uid(1)} isAdmin onApply={jest.fn()} />, { wrapper: createWrapper() });
    await openTerms();

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Lettura del documento non riuscita'));
  });
});

describe('termsToContract', () => {
  it('maps a stated "no renewal", a notice in days and both dates', () => {
    expect(termsToContract([
      { field: 'AUTO_RENEW', value: 'false', asWritten: '', sentence: '' },
      { field: 'NOTICE_DAYS', value: '60', asWritten: '60 giorni', sentence: '' },
      { field: 'START_DATE', value: '2026-01-01', asWritten: '', sentence: '' },
    ])).toEqual({ autoRenew: false, noticeDays: 60, startDate: '2026-01-01' });
  });
});

describe('DocumentsTab — while the terms are being read', () => {
  it('spins only on the document being read', async () => {
    const other = { ...doc, id: uid(2), fileName: 'allegato.pdf' };
    (api.get as jest.Mock).mockImplementation((url: string) =>
      url.endsWith('/terms') ? new Promise(() => {}) : Promise.resolve({ data: [doc, other] }));
    render(<DocumentsTab contractId={uid(1)} isAdmin={false} onApply={jest.fn()} />, { wrapper: createWrapper() });

    const buttons = await screen.findAllByRole('button', { name: 'Leggi rinnovo e scadenze dal documento' });
    await userEvent.click(buttons[0]);

    await waitFor(() => expect(buttons[0].querySelector('.animate-spin')).not.toBeNull());
    expect(buttons[1].querySelector('.animate-spin')).toBeNull();
  });
});
