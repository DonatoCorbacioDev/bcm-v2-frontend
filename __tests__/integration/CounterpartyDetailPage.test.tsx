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

  it("compares a supplier's expected costs with its invoices over the same months, IVA esclusa", () => {
    (useCounterparty as jest.Mock).mockReturnValue({
      data: { id: 2, name: 'Nuvola Srl', type: 'SUPPLIER', vatNumber: 'IT07824150960' },
      isLoading: false,
      isError: false,
    });
    (useCounterpartyInvoicingSummary as jest.Mock).mockReturnValue({
      data: {
        counterpartyId: 2, counterpartyName: 'Nuvola Srl', activeContracts: 1, contractedValue: 57600,
        invoicedYtd: 48000, variancePercent: -9.1, invoiceCount: 10, lastInvoiceDate: '2026-11-01',
        expectedYtd: 52800, comparable: true,
      },
      isLoading: false,
      isError: false,
    });

    render(<CounterpartyDetailPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/IVA esclusa/)).toBeInTheDocument();
    expect(screen.getByText('Previsto da inizio anno')).toBeInTheDocument();
    expect(screen.getByText('Fatture confermate (imponibile)')).toBeInTheDocument();
    expect(screen.getByText('Scostamento')).toBeInTheDocument();
  });

  it('shows only the contracted value for a customer: its invoices are not in BCM', () => {
    (useCounterparty as jest.Mock).mockReturnValue({
      data: { id: 1, name: 'Alfa Srl', type: 'CUSTOMER', vatNumber: 'IT01234567890' },
      isLoading: false,
      isError: false,
    });
    (useCounterpartyInvoicingSummary as jest.Mock).mockReturnValue({
      data: {
        counterpartyId: 1, counterpartyName: 'Alfa Srl', activeContracts: 3, contractedValue: 36000,
        invoicedYtd: 0, variancePercent: 0, invoiceCount: 0, lastInvoiceDate: null,
        expectedYtd: 0, comparable: false,
      },
      isLoading: false,
      isError: false,
    });

    render(<CounterpartyDetailPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/fatture emesse ai clienti non sono gestite/)).toBeInTheDocument();
    expect(screen.getByText('Valore annuo contrattato')).toBeInTheDocument();
    expect(screen.queryByText('Scostamento')).not.toBeInTheDocument();
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
