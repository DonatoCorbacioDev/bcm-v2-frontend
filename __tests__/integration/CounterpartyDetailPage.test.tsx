import React from 'react';
import { render, screen } from '@testing-library/react';
import { createWrapper } from '../mocks/wrapper';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/hooks/useCounterparty', () => ({
  useCounterparty: jest.fn(),
  useCounterpartyInvoicingSummary: jest.fn(),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

import { useCounterparty, useCounterpartyInvoicingSummary } from '@/hooks/useCounterparty';
import { useAuthStore } from '@/store/authStore';
import CounterpartyDetailPage from '@/app/(dashboard)/counterparties/[id]/page';

const mockAuthAs = (role: string | null) => {
  (useAuthStore as unknown as jest.Mock).mockImplementation((selector) => {
    const state = { user: role ? { id: 1, username: 'user', role } : null };
    return selector ? selector(state) : state;
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthAs('ADMIN');
});

describe('CounterpartyDetailPage', () => {
  it('shows a loading spinner while the counterparty is loading', () => {
    (useCounterparty as jest.Mock).mockReturnValue({ data: undefined, isLoading: true, isError: false });
    (useCounterpartyInvoicingSummary as jest.Mock).mockReturnValue({ data: undefined, isLoading: true, isError: false });

    const { container } = render(<CounterpartyDetailPage />, { wrapper: createWrapper() });

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows an error state when the counterparty is not found', () => {
    (useCounterparty as jest.Mock).mockReturnValue({ data: undefined, isLoading: false, isError: true });
    (useCounterpartyInvoicingSummary as jest.Mock).mockReturnValue({ data: undefined, isLoading: false, isError: false });

    render(<CounterpartyDetailPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/controparte non trovata/i)).toBeInTheDocument();
  });

  it('renders the counterparty name, type and invoicing summary', () => {
    (useCounterparty as jest.Mock).mockReturnValue({
      data: { id: 1, name: 'Alfa Srl', type: 'CUSTOMER', vatNumber: 'IT01234567890' },
      isLoading: false,
      isError: false,
    });
    (useCounterpartyInvoicingSummary as jest.Mock).mockReturnValue({
      data: {
        counterpartyId: 1,
        counterpartyName: 'Alfa Srl',
        activeContracts: 3,
        contractedValue: 36000,
        invoicedYtd: 24000,
        variancePercent: -33.3,
        invoiceCount: 8,
        lastInvoiceDate: '2026-08-28',
      },
      isLoading: false,
      isError: false,
    });

    render(<CounterpartyDetailPage />, { wrapper: createWrapper() });

    expect(screen.getByRole('heading', { name: 'Alfa Srl' })).toBeInTheDocument();
    expect(screen.getByText('Cliente')).toBeInTheDocument();
    expect(screen.getByText('IT01234567890')).toBeInTheDocument();
    expect(screen.getByText('Contratti attivi')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText(/ultima il 28\/08\/2026/)).toBeInTheDocument();
  });

  it('shows a fallback message when there is no VAT number', () => {
    (useCounterparty as jest.Mock).mockReturnValue({
      data: { id: 2, name: 'Beta Srl', type: 'SUPPLIER', vatNumber: null },
      isLoading: false,
      isError: false,
    });
    (useCounterpartyInvoicingSummary as jest.Mock).mockReturnValue({ data: undefined, isLoading: false, isError: true });

    render(<CounterpartyDetailPage />, { wrapper: createWrapper() });

    expect(screen.getByText('P.IVA non indicata')).toBeInTheDocument();
    expect(screen.getByText(/riepilogo non disponibile/i)).toBeInTheDocument();
  });

  it('shows "Non impostato" and lets an admin set the verified IBAN for the first time', () => {
    (useCounterparty as jest.Mock).mockReturnValue({
      data: { id: 1, name: 'Alfa Srl', type: 'CUSTOMER', vatNumber: 'IT01234567890', verifiedIban: null },
      isLoading: false,
      isError: false,
    });
    (useCounterpartyInvoicingSummary as jest.Mock).mockReturnValue({ data: undefined, isLoading: true, isError: false });

    render(<CounterpartyDetailPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Non impostato')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Imposta IBAN verificato' })).toBeInTheDocument();
  });

  it('shows the masked IBAN/BIC and lets an admin confirm a change when already verified', () => {
    (useCounterparty as jest.Mock).mockReturnValue({
      data: {
        id: 1,
        name: 'Alfa Srl',
        type: 'CUSTOMER',
        vatNumber: 'IT01234567890',
        verifiedIban: 'IT...3456',
        verifiedBic: 'BPPIITRRXXX',
      },
      isLoading: false,
      isError: false,
    });
    (useCounterpartyInvoicingSummary as jest.Mock).mockReturnValue({ data: undefined, isLoading: true, isError: false });

    render(<CounterpartyDetailPage />, { wrapper: createWrapper() });

    expect(screen.getByText('IT...3456')).toBeInTheDocument();
    expect(screen.getByText('BPPIITRRXXX')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Conferma nuovo IBAN' })).toBeInTheDocument();
  });

  it('hides the verified-IBAN action for a non-admin user', () => {
    mockAuthAs('MANAGER');
    (useCounterparty as jest.Mock).mockReturnValue({
      data: { id: 1, name: 'Alfa Srl', type: 'CUSTOMER', vatNumber: 'IT01234567890', verifiedIban: 'IT...3456' },
      isLoading: false,
      isError: false,
    });
    (useCounterpartyInvoicingSummary as jest.Mock).mockReturnValue({ data: undefined, isLoading: true, isError: false });

    render(<CounterpartyDetailPage />, { wrapper: createWrapper() });

    expect(screen.getByText('IT...3456')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Conferma nuovo IBAN' })).not.toBeInTheDocument();
  });
});
