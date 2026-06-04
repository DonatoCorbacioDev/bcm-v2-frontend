import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { createWrapper } from '../mocks/wrapper';

jest.mock('@/lib/forecastApi', () => ({
  forecastApi: { get: jest.fn() },
}));

import { forecastApi } from '@/lib/forecastApi';
import { RiskScoreWidget } from '@/components/dashboard/RiskScoreWidget';

const mockScores = [
  { contractId: 1, customerName: 'Acme Corp', riskScore: 0.85, level: 'HIGH' as const, anomalies: ['amount_spike', 'expiring_soon'] },
  { contractId: 2, customerName: 'Beta Ltd',  riskScore: 0.45, level: 'MEDIUM' as const, anomalies: [] },
  { contractId: 3, customerName: 'Gamma Inc', riskScore: 0.1,  level: 'LOW' as const,    anomalies: ['minor_delay'] },
];

beforeEach(() => jest.clearAllMocks());

describe('RiskScoreWidget', () => {
  it('shows loading state initially', () => {
    (forecastApi.get as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<RiskScoreWidget />, { wrapper: createWrapper() });
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows offline message when FastAPI is unavailable', async () => {
    (forecastApi.get as jest.Mock).mockRejectedValue(new Error('Network Error'));
    render(<RiskScoreWidget />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(/risk analysis unavailable/i)).toBeInTheDocument());
    expect(screen.getByText(/start the forecasting service/i)).toBeInTheDocument();
  });

  it('shows empty state when no risk scores', async () => {
    (forecastApi.get as jest.Mock).mockResolvedValue({ data: [] });
    render(<RiskScoreWidget />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(/no risk data available/i)).toBeInTheDocument());
  });

  it('renders risk scores with levels and anomalies', async () => {
    (forecastApi.get as jest.Mock).mockResolvedValue({ data: mockScores });
    render(<RiskScoreWidget />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument());
    expect(screen.getByText('Beta Ltd')).toBeInTheDocument();
    expect(screen.getByText('Gamma Inc')).toBeInTheDocument();
    // Anomalies with replaceAll
    expect(screen.getByText('amount spike')).toBeInTheDocument();
    expect(screen.getByText('expiring soon')).toBeInTheDocument();
    expect(screen.getByText('minor delay')).toBeInTheDocument();
  });

  it('shows correct risk level badges', async () => {
    (forecastApi.get as jest.Mock).mockResolvedValue({ data: mockScores });
    render(<RiskScoreWidget />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(/high · 85%/i)).toBeInTheDocument());
    expect(screen.getByText(/medium · 45%/i)).toBeInTheDocument();
    expect(screen.getByText(/low · 10%/i)).toBeInTheDocument();
  });

  it('falls back to LOW config for unknown risk level', async () => {
    const unknownLevel = [{ contractId: 9, customerName: 'Unknown Corp', riskScore: 0.5, level: 'UNKNOWN' as 'LOW', anomalies: [] }];
    (forecastApi.get as jest.Mock).mockResolvedValue({ data: unknownLevel });
    render(<RiskScoreWidget />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText('Unknown Corp')).toBeInTheDocument());
  });

  it('renders links to contract detail pages', async () => {
    (forecastApi.get as jest.Mock).mockResolvedValue({ data: mockScores });
    render(<RiskScoreWidget />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument());
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/contracts/1');
  });
});
