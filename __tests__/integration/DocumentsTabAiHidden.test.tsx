import React from 'react';
import { render, screen } from '@testing-library/react';
import { createWrapper } from '../mocks/wrapper';

// No featureFlags mock here: this checks the default a user gets.
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

import api from '@/lib/api';
import DocumentsTab from '@/components/contracts/DocumentsTab';

const doc = {
  id: 1, contractId: 1, fileName: 'contract.pdf',
  fileSize: 1500000, contentType: 'application/pdf',
  uploadedAt: '2024-03-15T10:00:00Z', downloadUrl: '',
};

describe('DocumentsTab — default, AI actions off', () => {
  it('keeps upload, versions and download, and hides field extraction and clause risk', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [doc] });

    render(<DocumentsTab contractId={1} isAdmin onApply={jest.fn()} />, { wrapper: createWrapper() });

    expect(await screen.findByText('contract.pdf')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Scarica documento' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Carica nuova versione' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Estrai campi dal documento' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Rileva clausole a rischio nel documento' })).not.toBeInTheDocument();
  });
});
