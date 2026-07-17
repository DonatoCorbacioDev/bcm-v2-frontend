import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    expect(await screen.findByText(/rilevamento anomalie non disponibile/i)).toBeInTheDocument();
    expect(screen.getByText(/verifica che il servizio ml sia attivo/i)).toBeInTheDocument();
  });

  it('shows green empty state when no anomalies', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });
    render(<AnomalyWidget />, { wrapper: createWrapper() });
    expect(await screen.findByText(/nessuna anomalia finanziaria rilevata/i)).toBeInTheDocument();
  });

  it.each([
    ['customer names', 'Acme Corp', 'Beta Ltd', 'Gamma Inc'],
    ['month and year', 'Giu 2025', 'Nov 2025', 'Mar 2025'],
    ['severity badges', 'Alta', 'Media', 'Bassa'],
  ])('renders %s in the anomaly rows', async (_label, first, second, third) => {
    (api.get as jest.Mock).mockResolvedValue({ data: mockAnomalies });
    render(<AnomalyWidget />, { wrapper: createWrapper() });
    expect(await screen.findByText(first)).toBeInTheDocument();
    expect(screen.getByText(second)).toBeInTheDocument();
    expect(screen.getByText(third)).toBeInTheDocument();
  });

  it('renders links to contract detail pages', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: mockAnomalies });
    render(<AnomalyWidget />, { wrapper: createWrapper() });
    expect(await screen.findByText('Acme Corp')).toBeInTheDocument();
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
    expect(await screen.findByText('Unknown Ltd')).toBeInTheDocument();
  });

  it('renders the table header columns', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: mockAnomalies });
    render(<AnomalyWidget />, { wrapper: createWrapper() });
    expect(await screen.findByText('Cliente')).toBeInTheDocument();
    expect(screen.getByText('Periodo')).toBeInTheDocument();
    expect(screen.getByText('Importo')).toBeInTheDocument();
    expect(screen.getByText('Gravità')).toBeInTheDocument();
  });

  it('shows only the first 5 anomalies with a toggle when there are more', async () => {
    const manyAnomalies = Array.from({ length: 7 }, (_, i) => ({
      financialValueId: i + 1,
      contractId: i + 100,
      customerName: `Cliente ${i + 1}`,
      month: 1,
      year: 2025,
      financialAmount: 1000 * (i + 1),
      anomalyScore: -0.1,
      severity: 'MEDIUM' as const,
    }));
    (api.get as jest.Mock).mockResolvedValue({ data: manyAnomalies });
    render(<AnomalyWidget />, { wrapper: createWrapper() });
    expect(await screen.findByText('Cliente 1')).toBeInTheDocument();

    expect(screen.getByText('Cliente 5')).toBeInTheDocument();
    expect(screen.queryByText('Cliente 6')).not.toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: 'Mostra tutti (7)' });
    await userEvent.click(toggle);

    expect(screen.getByText('Cliente 7')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mostra meno' })).toBeInTheDocument();
  });

  it('does not show the toggle when there are 5 or fewer anomalies', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: mockAnomalies });
    render(<AnomalyWidget />, { wrapper: createWrapper() });
    expect(await screen.findByText('Acme Corp')).toBeInTheDocument();
    expect(screen.queryByText(/mostra tutti/i)).not.toBeInTheDocument();
  });
});
