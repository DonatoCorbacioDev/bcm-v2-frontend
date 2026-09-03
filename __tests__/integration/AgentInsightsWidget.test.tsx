import React from 'react';
import { render, screen } from '@testing-library/react';
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
});
