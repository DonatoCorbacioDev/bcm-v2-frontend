import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createWrapper } from '../mocks/wrapper';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { SemanticSearchBar } from '@/components/contracts/SemanticSearchBar';

const mockResults = [
  { contractId: 1, contractNumber: 'CNT-2024-001', customerName: 'Acme Corp', documentId: 10, fileName: 'msa.pdf', score: 0.87 },
];

const mockPush = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
});

describe('SemanticSearchBar', () => {
  it('does not search until the user submits a query', () => {
    render(<SemanticSearchBar />, { wrapper: createWrapper() });
    expect(api.post).not.toHaveBeenCalled();
  });

  it('searches and shows ranked results on submit', async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: mockResults });
    const user = userEvent.setup();
    render(<SemanticSearchBar />, { wrapper: createWrapper() });

    await user.type(screen.getByLabelText(/ricerca semantica/i), 'penale per ritardo');
    await user.click(screen.getByRole('button', { name: /cerca/i }));

    expect(await screen.findByText(/CNT-2024-001/)).toBeInTheDocument();
    expect(screen.getByText('msa.pdf')).toBeInTheDocument();
    expect(screen.getByText('87%')).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith('/contracts/search/semantic', { query: 'penale per ritardo' });
  });

  it('shows an empty-state message when nothing matches', async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: [] });
    const user = userEvent.setup();
    render(<SemanticSearchBar />, { wrapper: createWrapper() });

    await user.type(screen.getByLabelText(/ricerca semantica/i), 'qualcosa di inesistente');
    await user.click(screen.getByRole('button', { name: /cerca/i }));

    expect(await screen.findByText(/nessun documento indicizzato/i)).toBeInTheDocument();
  });

  it('navigates to the contract when a result is clicked', async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: mockResults });
    const user = userEvent.setup();
    render(<SemanticSearchBar />, { wrapper: createWrapper() });

    await user.type(screen.getByLabelText(/ricerca semantica/i), 'penale');
    await user.click(screen.getByRole('button', { name: /cerca/i }));

    const resultButton = await screen.findByText(/CNT-2024-001/);
    await user.click(resultButton);

    expect(mockPush).toHaveBeenCalledWith('/contracts/1');
  });
});
