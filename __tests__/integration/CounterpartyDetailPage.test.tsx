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

import { useCounterparty, useCounterpartyInvoicingSummary } from '@/hooks/useCounterparty';
import CounterpartyDetailPage from '@/app/(dashboard)/counterparties/[id]/page';

beforeEach(() => jest.clearAllMocks());

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
});
