import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createWrapper } from '../mocks/wrapper';

jest.mock('@/lib/api', () => ({
  api: { get: jest.fn(), post: jest.fn() },
}));

import { api } from '@/lib/api';
import { RiskScoreWidget } from '@/components/dashboard/RiskScoreWidget';

const mockScores = [
  { contractId: 1, customerName: 'Acme Corp', riskScore: 0.85, level: 'HIGH' as const, anomalies: ['amount_spike', 'expiring_soon'] },
  { contractId: 2, customerName: 'Beta Ltd',  riskScore: 0.45, level: 'MEDIUM' as const, anomalies: [] },
  { contractId: 3, customerName: 'Gamma Inc', riskScore: 0.1,  level: 'LOW' as const,    anomalies: ['minor_delay'] },
];

beforeEach(() => jest.clearAllMocks());

function mockGetByUrl(responses: Record<string, unknown>) {
  (api.get as jest.Mock).mockImplementation(async (url: string) => ({
    data: responses[url] ?? [],
  }));
}

describe('RiskScoreWidget', () => {
  it('shows loading state initially', () => {
    (api.get as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<RiskScoreWidget />, { wrapper: createWrapper() });
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows offline message when FastAPI is unavailable', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('Network Error'));
    render(<RiskScoreWidget />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(/analisi del rischio non disponibile/i)).toBeInTheDocument());
    expect(screen.getByText(/verifica che il backend e il servizio di previsione/i)).toBeInTheDocument();
  });

  it('shows empty state when no risk scores', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });
    render(<RiskScoreWidget />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(/nessun dato sul rischio disponibile/i)).toBeInTheDocument());
  });

  it('renders risk scores with levels and anomalies', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: mockScores });
    render(<RiskScoreWidget />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument());
    expect(screen.getByText('Beta Ltd')).toBeInTheDocument();
    expect(screen.getByText('Gamma Inc')).toBeInTheDocument();
    // Anomalies with replaceAll
    expect(screen.getByText('amount spike')).toBeInTheDocument();
    expect(screen.getByText('expiring soon')).toBeInTheDocument();
    expect(screen.getByText('minor delay')).toBeInTheDocument();
  });

  it('translates the real backend anomaly codes to Italian', async () => {
    const realCodes = [
      { contractId: 4, customerName: 'Delta Srl', riskScore: 0.9, level: 'HIGH' as const,
        anomalies: ['EXPIRED', 'EXPIRING_SOON', 'UNUSUAL_VALUE', 'NO_END_DATE'] },
    ];
    (api.get as jest.Mock).mockResolvedValue({ data: realCodes });
    render(<RiskScoreWidget />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText('Delta Srl')).toBeInTheDocument());
    expect(screen.getByText('Scaduto')).toBeInTheDocument();
    expect(screen.getByText('In scadenza')).toBeInTheDocument();
    expect(screen.getByText('Valore anomalo')).toBeInTheDocument();
    expect(screen.getByText('Senza data di fine')).toBeInTheDocument();
  });

  it('shows correct risk level badges', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: mockScores });
    render(<RiskScoreWidget />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(/alto · 85%/i)).toBeInTheDocument());
    expect(screen.getByText(/medio · 45%/i)).toBeInTheDocument();
    expect(screen.getByText(/basso · 10%/i)).toBeInTheDocument();
  });

  it('falls back to LOW config for unknown risk level', async () => {
    const unknownLevel = [{ contractId: 9, customerName: 'Unknown Corp', riskScore: 0.5, level: 'UNKNOWN' as 'LOW', anomalies: [] }];
    (api.get as jest.Mock).mockResolvedValue({ data: unknownLevel });
    render(<RiskScoreWidget />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText('Unknown Corp')).toBeInTheDocument());
  });

  it('renders links to contract detail pages', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: mockScores });
    render(<RiskScoreWidget />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument());
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/contracts/1');
  });

  it('shows only the first 5 scores with a toggle when there are more', async () => {
    const manyScores = Array.from({ length: 8 }, (_, i) => ({
      contractId: i + 1,
      customerName: `Cliente ${i + 1}`,
      riskScore: 0.9 - i * 0.05,
      level: 'MEDIUM' as const,
      anomalies: [],
    }));
    (api.get as jest.Mock).mockResolvedValue({ data: manyScores });
    render(<RiskScoreWidget />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText('Cliente 1')).toBeInTheDocument());

    expect(screen.getByText('Cliente 5')).toBeInTheDocument();
    expect(screen.queryByText('Cliente 6')).not.toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: 'Mostra tutti (8)' });
    await userEvent.click(toggle);

    expect(screen.getByText('Cliente 8')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mostra meno' })).toBeInTheDocument();
  });

  it('does not show the toggle when there are 5 or fewer scores', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: mockScores });
    render(<RiskScoreWidget />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument());
    expect(screen.queryByText(/mostra tutti/i)).not.toBeInTheDocument();
  });

  it('shows a "solo regole euristiche" badge when no score has an ML level', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: mockScores });
    render(<RiskScoreWidget />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument());
    expect(screen.getByText('Solo regole euristiche')).toBeInTheDocument();
    expect(screen.queryByText('ML attivo')).not.toBeInTheDocument();
  });

  it('shows an "ML attivo" badge when at least one score has an ML level', async () => {
    const withMl = [
      { ...mockScores[0], mlScore: 0.8, mlLevel: 'HIGH' as const },
      mockScores[1],
    ];
    (api.get as jest.Mock).mockResolvedValue({ data: withMl });
    render(<RiskScoreWidget />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument());
    expect(screen.getByText('ML attivo')).toBeInTheDocument();
    expect(screen.queryByText('Solo regole euristiche')).not.toBeInTheDocument();
  });

  it('does not show the ML badge when there are no risk scores', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });
    render(<RiskScoreWidget />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(/nessun dato sul rischio disponibile/i)).toBeInTheDocument());
    expect(screen.queryByText('Solo regole euristiche')).not.toBeInTheDocument();
    expect(screen.queryByText('ML attivo')).not.toBeInTheDocument();
  });

  describe('risk feedback', () => {
    it('shows the feedback prompt with thumbs up/down when no feedback exists yet', async () => {
      mockGetByUrl({ '/risk-scores': mockScores, '/risk-feedback': [] });
      render(<RiskScoreWidget />, { wrapper: createWrapper() });

      await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument());
      expect(screen.getAllByText('Il punteggio è corretto?')).toHaveLength(mockScores.length);
      expect(screen.getAllByRole('button', { name: 'Punteggio corretto' })).toHaveLength(mockScores.length);
      expect(screen.getAllByRole('button', { name: 'Punteggio errato' })).toHaveLength(mockScores.length);
    });

    it('submits agree feedback with the score/level shown for that contract', async () => {
      mockGetByUrl({ '/risk-scores': mockScores, '/risk-feedback': [] });
      (api.post as jest.Mock).mockResolvedValue({
        data: { id: 1, contractId: 1, riskScore: 0.85, riskLevel: 'HIGH', mlScore: null, mlLevel: null, agree: true, createdAt: '2027-01-01T00:00:00' },
      });
      render(<RiskScoreWidget />, { wrapper: createWrapper() });

      await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument());
      const [firstThumbsUp] = screen.getAllByRole('button', { name: 'Punteggio corretto' });
      await userEvent.click(firstThumbsUp);

      await waitFor(() => expect(api.post).toHaveBeenCalledWith('/risk-feedback/contracts/1', {
        riskScore: 0.85,
        level: 'HIGH',
        mlScore: undefined,
        mlLevel: undefined,
        agree: true,
      }));
    });

    it('submits disagree feedback for the clicked contract', async () => {
      mockGetByUrl({ '/risk-scores': mockScores, '/risk-feedback': [] });
      (api.post as jest.Mock).mockResolvedValue({
        data: { id: 2, contractId: 2, riskScore: 0.45, riskLevel: 'MEDIUM', mlScore: null, mlLevel: null, agree: false, createdAt: '2027-01-01T00:00:00' },
      });
      render(<RiskScoreWidget />, { wrapper: createWrapper() });

      await waitFor(() => expect(screen.getByText('Beta Ltd')).toBeInTheDocument());
      const thumbsDownButtons = screen.getAllByRole('button', { name: 'Punteggio errato' });
      await userEvent.click(thumbsDownButtons[1]);

      await waitFor(() => expect(api.post).toHaveBeenCalledWith('/risk-feedback/contracts/2', {
        riskScore: 0.45,
        level: 'MEDIUM',
        mlScore: undefined,
        mlLevel: undefined,
        agree: false,
      }));
    });

    it('shows a confirmed state instead of buttons when feedback already exists', async () => {
      mockGetByUrl({
        '/risk-scores': mockScores,
        '/risk-feedback': [{ id: 1, contractId: 1, riskScore: 0.85, riskLevel: 'HIGH', mlScore: null, mlLevel: null, agree: true, createdAt: '2027-01-01T00:00:00' }],
      });
      render(<RiskScoreWidget />, { wrapper: createWrapper() });

      await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument());
      expect(screen.getByText('Confermato corretto')).toBeInTheDocument();
      expect(screen.getAllByText('Il punteggio è corretto?')).toHaveLength(mockScores.length - 1);
    });

    it('shows a disputed state when feedback disagreed with the score', async () => {
      mockGetByUrl({
        '/risk-scores': mockScores,
        '/risk-feedback': [{ id: 2, contractId: 2, riskScore: 0.45, riskLevel: 'MEDIUM', mlScore: null, mlLevel: null, agree: false, createdAt: '2027-01-01T00:00:00' }],
      });
      render(<RiskScoreWidget />, { wrapper: createWrapper() });

      await waitFor(() => expect(screen.getByText('Beta Ltd')).toBeInTheDocument());
      expect(screen.getByText('Segnalato come errato')).toBeInTheDocument();
    });
  });
});
