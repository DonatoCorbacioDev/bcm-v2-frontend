import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { createWrapper } from '../mocks/wrapper';

jest.mock('@/lib/api', () => ({
  api: { get: jest.fn() },
}));

import { api } from '@/lib/api';
import { AnomalyWidget } from '@/components/dashboard/AnomalyWidget';

const mockAnomalies = [
  {
    financialValueId: 1, contractId: 10, customerName: 'Acme Corp',
    month: 6, year: 2025, financialAmount: 150000, anomalyScore: -0.5, severity: 'HIGH' as const,
  },
  {
    financialValueId: 2, contractId: 11, customerName: 'Beta Ltd',
    month: 11, year: 2025, financialAmount: 80000, anomalyScore: -0.12, severity: 'MEDIUM' as const,
  },
  {
    financialValueId: 3, contractId: 12, customerName: 'Gamma Inc',
    month: 3, year: 2025, financialAmount: 45000, anomalyScore: -0.06, severity: 'LOW' as const,
  },
];

beforeEach(() => jest.clearAllMocks());

describe('AnomalyWidget', () => {
  it('shows loading state initially', () => {
    (api.get as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<AnomalyWidget />, { wrapper: createWrapper() });
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows offline message when ML service is unavailable', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('Network Error'));
    render(<AnomalyWidget />, { wrapper: createWrapper() });
    await waitFor(() =>
      expect(screen.getByText(/rilevamento anomalie non disponibile/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/verifica che il servizio ml sia attivo/i)).toBeInTheDocument();
  });

  it('shows green empty state when no anomalies', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });
    render(<AnomalyWidget />, { wrapper: createWrapper() });
    await waitFor(() =>
      expect(screen.getByText(/nessuna anomalia finanziaria rilevata/i)).toBeInTheDocument()
    );
  });

  it('renders anomaly rows with customer names', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: mockAnomalies });
    render(<AnomalyWidget />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument());
    expect(screen.getByText('Beta Ltd')).toBeInTheDocument();
    expect(screen.getByText('Gamma Inc')).toBeInTheDocument();
  });

  it('renders month and year correctly', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: mockAnomalies });
    render(<AnomalyWidget />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText('Giu 2025')).toBeInTheDocument());
    expect(screen.getByText('Nov 2025')).toBeInTheDocument();
    expect(screen.getByText('Mar 2025')).toBeInTheDocument();
  });

  it('renders severity badges with correct labels', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: mockAnomalies });
    render(<AnomalyWidget />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText('Alta')).toBeInTheDocument());
    expect(screen.getByText('Media')).toBeInTheDocument();
    expect(screen.getByText('Bassa')).toBeInTheDocument();
  });

  it('renders links to contract detail pages', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: mockAnomalies });
    render(<AnomalyWidget />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument());
    const links = screen.getAllByRole('link');
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/contracts/10');
    expect(hrefs).toContain('/contracts/11');
  });

  it('falls back to LOW config for unknown severity', async () => {
    const unknown = [{
      financialValueId: 9, contractId: 99, customerName: 'Unknown Ltd',
      month: 1, year: 2025, financialAmount: 1000, anomalyScore: -0.01,
      severity: 'UNKNOWN' as 'LOW',
    }];
    (api.get as jest.Mock).mockResolvedValue({ data: unknown });
    render(<AnomalyWidget />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText('Unknown Ltd')).toBeInTheDocument());
  });

  it('renders the table header columns', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: mockAnomalies });
    render(<AnomalyWidget />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText('Cliente')).toBeInTheDocument());
    expect(screen.getByText('Periodo')).toBeInTheDocument();
    expect(screen.getByText('Importo')).toBeInTheDocument();
    expect(screen.getByText('Gravità')).toBeInTheDocument();
  });
});
