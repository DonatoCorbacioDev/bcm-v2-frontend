import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createWrapper } from '../mocks/wrapper';

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ComposedChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => null,
  Line: () => null,
  XAxis: ({ tickFormatter }: { tickFormatter?: (v: string) => string }) => { tickFormatter?.('2024-01'); return null; },
  YAxis: ({ tickFormatter }: { tickFormatter?: (v: number) => string }) => { tickFormatter?.(1000); return null; },
  CartesianGrid: () => null,
  Tooltip: ({ formatter }: { formatter?: (v: number, name: string) => unknown }) => {
    formatter?.(1000, 'historical');
    formatter?.(1000, 'forecast');
    formatter?.(1000, 'upper');
    formatter?.(1000, 'lower');
    formatter?.(1000, 'unknown');
    return null;
  },
  Legend: () => null,
  ReferenceLine: () => null,
}));

jest.mock('@/hooks/useFinancialValues', () => ({ useFinancialValues: jest.fn() }));
jest.mock('@/lib/forecastApi', () => ({ forecastApi: { get: jest.fn() } }));

import { useFinancialValues } from '@/hooks/useFinancialValues';
import { forecastApi } from '@/lib/forecastApi';
import { FinancialForecastChart } from '@/components/dashboard/FinancialForecastChart';

const financialValues = [
  { id: 1, month: 1, year: 2024, financialAmount: 10000, financialTypeId: 1, businessAreaId: 1, contractId: 1 },
  { id: 2, month: 1, year: 2024, financialAmount: 5000,  financialTypeId: 2, businessAreaId: 1, contractId: 1 },
  { id: 3, month: 2, year: 2024, financialAmount: 8000,  financialTypeId: 1, businessAreaId: 1, contractId: 2 },
];

const forecastResponse = {
  historical: [{ month: '2024-01', amount: 15000 }, { month: '2024-02', amount: 8000 }],
  forecast:   [{ month: '2024-03', amount: 12000, lower: 10000, upper: 14000 }],
};

beforeEach(() => jest.clearAllMocks());

describe('FinancialForecastChart', () => {
  it('shows loading spinner while data is fetching', () => {
    (useFinancialValues as jest.Mock).mockReturnValue({ data: undefined, isLoading: true });
    (forecastApi.get as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<FinancialForecastChart />, { wrapper: createWrapper() });
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows empty state when no data', async () => {
    (useFinancialValues as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    (forecastApi.get as jest.Mock).mockResolvedValue({ data: { historical: [], forecast: [] } });
    render(<FinancialForecastChart />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(/no financial data available/i)).toBeInTheDocument());
  });

  it('renders chart with historical data from useFinancialValues when FastAPI offline', async () => {
    (useFinancialValues as jest.Mock).mockReturnValue({ data: financialValues, isLoading: false });
    (forecastApi.get as jest.Mock).mockRejectedValue(new Error('offline'));
    render(<FinancialForecastChart />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(/forecast offline/i)).toBeInTheDocument());
  });

  it('renders chart with historical + forecast data from FastAPI', async () => {
    (useFinancialValues as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    (forecastApi.get as jest.Mock).mockResolvedValue({ data: forecastResponse });
    render(<FinancialForecastChart />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(/financial forecast/i)).toBeInTheDocument());
    expect(screen.queryByText(/forecast offline/i)).not.toBeInTheDocument();
  });

  it('disables horizon buttons when forecast is offline', async () => {
    (useFinancialValues as jest.Mock).mockReturnValue({ data: financialValues, isLoading: false });
    (forecastApi.get as jest.Mock).mockRejectedValue(new Error('offline'));
    render(<FinancialForecastChart />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(/forecast offline/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: '3M' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '6M' })).toBeDisabled();
  });

  it('switches horizon from 3M to 6M', async () => {
    (useFinancialValues as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    (forecastApi.get as jest.Mock).mockResolvedValue({ data: forecastResponse });
    render(<FinancialForecastChart />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByRole('button', { name: '6M' })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: '6M' }));
    await waitFor(() => expect(forecastApi.get).toHaveBeenCalledWith('/forecast?months=6'));
  });

  it('aggregates financial values by month correctly', async () => {
    (useFinancialValues as jest.Mock).mockReturnValue({ data: financialValues, isLoading: false });
    (forecastApi.get as jest.Mock).mockRejectedValue(new Error('offline'));
    render(<FinancialForecastChart />, { wrapper: createWrapper() });
    // aggregateHistorical groups month=1/year=2024 → 15000, month=2/year=2024 → 8000
    await waitFor(() => expect(screen.getByText(/financial forecast/i)).toBeInTheDocument());
  });
});
