import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createWrapper } from '../mocks/wrapper';

jest.mock('@/lib/api', () => ({
  api: { get: jest.fn(), post: jest.fn() },
}));

import { api } from '@/lib/api';
import { AgentInsightsWidget } from '@/components/dashboard/AgentInsightsWidget';

beforeEach(() => jest.clearAllMocks());

describe('AgentInsightsWidget', () => {
  it('shows loading state initially', () => {
    (api.get as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<AgentInsightsWidget />, { wrapper: createWrapper() });
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows offline message when the backend/proxy is unreachable', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('Network Error'));
    render(<AgentInsightsWidget />, { wrapper: createWrapper() });
    expect(await screen.findByText(/suggerimenti ai non disponibili/i)).toBeInTheDocument();
  });

  it('shows the ML-reported error when Ollama itself is unavailable', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: { report: null, error: 'Servizio AI non disponibile: connection refused' },
    });
    render(<AgentInsightsWidget />, { wrapper: createWrapper() });
    expect(await screen.findByText('Servizio AI non disponibile: connection refused')).toBeInTheDocument();
  });

  it('shows an empty state when there is no report and no error', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { report: null, error: null } });
    render(<AgentInsightsWidget />, { wrapper: createWrapper() });
    expect(await screen.findByText(/nessun suggerimento disponibile/i)).toBeInTheDocument();
  });

  it('renders the narrative report', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: { report: 'I contratti più a rischio sono...\n\nPrevisione in crescita.', error: null },
    });
    render(<AgentInsightsWidget />, { wrapper: createWrapper() });
    expect(await screen.findByText(/i contratti più a rischio sono/i)).toBeInTheDocument();
  });

  describe('ask a question', () => {
    beforeEach(() => {
      (api.get as jest.Mock).mockResolvedValue({ data: { report: null, error: null } });
    });

    it('does not submit a blank question', async () => {
      render(<AgentInsightsWidget />, { wrapper: createWrapper() });
      const button = screen.getByRole('button', { name: 'Invia domanda' });
      expect(button).toBeDisabled();
      expect(api.post).not.toHaveBeenCalled();
    });

    it('submits the trimmed question and shows the answer', async () => {
      (api.post as jest.Mock).mockResolvedValue({
        data: { answer: 'Hai 3 contratti in scadenza a marzo.', error: null },
      });
      render(<AgentInsightsWidget />, { wrapper: createWrapper() });

      const input = screen.getByLabelText('Chiedi qualcosa sui tuoi contratti');
      await userEvent.type(input, '  Quali contratti scadono a marzo?  ');
      await userEvent.click(screen.getByRole('button', { name: 'Invia domanda' }));

      await waitFor(() =>
        expect(api.post).toHaveBeenCalledWith('/agent/ask', { question: 'Quali contratti scadono a marzo?' })
      );
      expect(await screen.findByText('Hai 3 contratti in scadenza a marzo.')).toBeInTheDocument();
    });

    it('shows the ML-reported error when Ollama is unavailable for a question', async () => {
      (api.post as jest.Mock).mockResolvedValue({
        data: { answer: null, error: 'Servizio AI non disponibile: connection refused' },
      });
      render(<AgentInsightsWidget />, { wrapper: createWrapper() });

      await userEvent.type(screen.getByLabelText('Chiedi qualcosa sui tuoi contratti'), 'Domanda?');
      await userEvent.click(screen.getByRole('button', { name: 'Invia domanda' }));

      expect(await screen.findByText('Servizio AI non disponibile: connection refused')).toBeInTheDocument();
    });

    it('shows a generic error when the request itself fails', async () => {
      (api.post as jest.Mock).mockRejectedValue(new Error('Network Error'));
      render(<AgentInsightsWidget />, { wrapper: createWrapper() });

      await userEvent.type(screen.getByLabelText('Chiedi qualcosa sui tuoi contratti'), 'Domanda?');
      await userEvent.click(screen.getByRole('button', { name: 'Invia domanda' }));

      expect(await screen.findByText(/non è stato possibile contattare l'assistente/i)).toBeInTheDocument();
    });
  });
});
