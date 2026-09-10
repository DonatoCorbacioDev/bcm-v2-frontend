import React from 'react';
import { render, screen } from '@testing-library/react';
import { createWrapper } from '../mocks/wrapper';

jest.mock('@/hooks/useDashboardStats', () => ({
  useInvoicingSummary: jest.fn(),
}));

import { useInvoicingSummary } from '@/hooks/useDashboardStats';
import { InvoicingSummaryWidget } from '@/components/dashboard/InvoicingSummaryWidget';

beforeEach(() => jest.clearAllMocks());

describe('InvoicingSummaryWidget', () => {
  it('shows loading state initially', () => {
    (useInvoicingSummary as jest.Mock).mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<InvoicingSummaryWidget />, { wrapper: createWrapper() });
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows an error message when the summary is unavailable', () => {
    (useInvoicingSummary as jest.Mock).mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<InvoicingSummaryWidget />, { wrapper: createWrapper() });
    expect(screen.getByText(/riepilogo fatturato non disponibile/i)).toBeInTheDocument();
  });

  it('renders expected, invoiced and variance for an on-track year', () => {
    (useInvoicingSummary as jest.Mock).mockReturnValue({
      data: { year: 2026, expectedYtd: 100000, invoicedYtd: 94500, variance: -5500, variancePercent: -5.5 },
      isLoading: false,
      isError: false,
    });
    render(<InvoicingSummaryWidget />, { wrapper: createWrapper() });

    expect(screen.getByText('Fatturato vs previsto 2026')).toBeInTheDocument();
    expect(screen.getByText('Valore atteso')).toBeInTheDocument();
    expect(screen.getByText('Fatturato confermato')).toBeInTheDocument();
    expect(screen.getByText('-5,5%')).toBeInTheDocument();
  });

  it('shows a positive-signed variance when invoiced exceeds expected', () => {
    (useInvoicingSummary as jest.Mock).mockReturnValue({
      data: { year: 2026, expectedYtd: 50000, invoicedYtd: 60500, variance: 10500, variancePercent: 21 },
      isLoading: false,
      isError: false,
    });
    render(<InvoicingSummaryWidget />, { wrapper: createWrapper() });

    expect(screen.getByText('+21%')).toBeInTheDocument();
  });
});
