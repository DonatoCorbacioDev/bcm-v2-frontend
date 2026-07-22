import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createWrapper } from '../mocks/wrapper';

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    defaults: { headers: { common: {} } },
  },
}));

import api from '@/lib/api';
import DocumentVersionsDialog from '@/components/contracts/DocumentVersionsDialog';

const v1 = {
  id: 1, contractId: 1, fileName: 'contract.pdf', fileSize: 1000,
  contentType: 'application/pdf', uploadedAt: '2027-01-01T10:00:00Z', downloadUrl: '',
  versionGroupId: 1, versionNumber: 1, versionCount: 2,
};
const v2 = {
  ...v1, id: 2, fileName: 'contract-v2.pdf', versionNumber: 2, uploadedAt: '2027-02-01T10:00:00Z',
};

const diff = {
  fromDocumentId: 1, fromFileName: 'contract.pdf', toDocumentId: 2, toFileName: 'contract-v2.pdf',
  lines: [
    { tag: 'EQUAL', oldText: 'Clausola invariata', newText: 'Clausola invariata' },
    { tag: 'CHANGE', oldText: 'Importo: 1000', newText: 'Importo: 2000' },
    { tag: 'INSERT', oldText: null, newText: 'Nuova clausola aggiunta' },
  ],
};

const onDownload = jest.fn();

beforeEach(() => jest.clearAllMocks());

describe('DocumentVersionsDialog', () => {
  it('does not fetch versions when closed', () => {
    render(
      <DocumentVersionsDialog
        contractId={1} documentId={1} fileName="contract.pdf"
        open={false} onOpenChange={jest.fn()} onDownload={onDownload}
      />,
      { wrapper: createWrapper() }
    );
    expect(api.get).not.toHaveBeenCalled();
  });

  it('lists all versions when opened', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [v2, v1] });
    render(
      <DocumentVersionsDialog
        contractId={1} documentId={1} fileName="contract.pdf"
        open={true} onOpenChange={jest.fn()} onDownload={onDownload}
      />,
      { wrapper: createWrapper() }
    );
    expect(await screen.findByText(/v2 · contract-v2\.pdf/)).toBeInTheDocument();
    expect(screen.getByText(/v1 · contract\.pdf/)).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/contracts/1/documents/1/versions');
  });

  it('calls onDownload when a version download button is clicked', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [v1] });
    render(
      <DocumentVersionsDialog
        contractId={1} documentId={1} fileName="contract.pdf"
        open={true} onOpenChange={jest.fn()} onDownload={onDownload}
      />,
      { wrapper: createWrapper() }
    );
    expect(await screen.findByTitle('Scarica versione')).toBeInTheDocument();
    await userEvent.click(screen.getByTitle('Scarica versione'));
    expect(onDownload).toHaveBeenCalledWith(v1);
  });

  it('fetches and renders the diff once two versions are selected', async () => {
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url.endsWith('/versions')) return Promise.resolve({ data: [v2, v1] });
      return Promise.resolve({ data: diff });
    });
    render(
      <DocumentVersionsDialog
        contractId={1} documentId={1} fileName="contract.pdf"
        open={true} onOpenChange={jest.fn()} onDownload={onDownload}
      />,
      { wrapper: createWrapper() }
    );
    expect(await screen.findByText(/v2 · contract-v2\.pdf/)).toBeInTheDocument();

    const checkboxes = screen.getAllByRole('checkbox');
    await userEvent.click(checkboxes[0]);
    await userEvent.click(checkboxes[1]);

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/contracts/1/documents/1/diff/2'));
    expect(await screen.findByText(/confronto tra versioni/i)).toBeInTheDocument();
    expect(screen.getByText(/Clausola invariata/)).toBeInTheDocument();
    expect(screen.getByText(/− Importo: 1000/)).toBeInTheDocument();
    expect(screen.getByText(/\+ Importo: 2000/)).toBeInTheDocument();
    expect(screen.getByText(/\+ Nuova clausola aggiunta/)).toBeInTheDocument();
  });

  it('shows a message when no differences are found', async () => {
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url.endsWith('/versions')) return Promise.resolve({ data: [v2, v1] });
      return Promise.resolve({ data: { ...diff, lines: [] } });
    });
    render(
      <DocumentVersionsDialog
        contractId={1} documentId={1} fileName="contract.pdf"
        open={true} onOpenChange={jest.fn()} onDownload={onDownload}
      />,
      { wrapper: createWrapper() }
    );
    const checkboxes = await screen.findAllByRole('checkbox');
    await userEvent.click(checkboxes[0]);
    await userEvent.click(checkboxes[1]);
    expect(await screen.findByText(/nessuna differenza rilevata/i)).toBeInTheDocument();
  });

  it('deselects a version when its checkbox is clicked again', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [v2, v1] });
    render(
      <DocumentVersionsDialog
        contractId={1} documentId={1} fileName="contract.pdf"
        open={true} onOpenChange={jest.fn()} onDownload={onDownload}
      />,
      { wrapper: createWrapper() }
    );
    const checkboxes = await screen.findAllByRole('checkbox');
    await userEvent.click(checkboxes[0]);
    await userEvent.click(checkboxes[0]);
    expect(screen.queryByText(/confronto tra versioni/i)).not.toBeInTheDocument();
  });
});
