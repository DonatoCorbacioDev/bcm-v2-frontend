import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createWrapper } from '../mocks/wrapper';

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get:    jest.fn(),
    post:   jest.fn(),
    delete: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    defaults: { headers: { common: {} } },
  },
}));

import api from '@/lib/api';
import { toast } from 'sonner';
import DocumentsTab from '@/components/contracts/DocumentsTab';

const doc = {
  id: 1, contractId: 1, fileName: 'contract.pdf',
  fileSize: 1500000, contentType: 'application/pdf',
  uploadedAt: '2024-03-15T10:00:00Z', downloadUrl: '',
};

const smallDoc  = { ...doc, id: 2, fileName: 'tiny.pdf',   fileSize: 512 };
const mediumDoc = { ...doc, id: 3, fileName: 'medium.pdf', fileSize: 102400 };

const analysis = {
  documentId: 1, rawText: 'Contract text here',
  detectedCustomerName: 'Acme Corp', detectedContractNumber: 'CNT-001',
  detectedStartDate: '2024-01-01', detectedEndDate: '2024-12-31',
  detectedAmount: '50000',
};

const onApply = jest.fn();

global.URL.createObjectURL = jest.fn(() => 'blob:mock');
global.URL.revokeObjectURL = jest.fn();

beforeEach(() => jest.clearAllMocks());

describe('DocumentsTab', () => {
  it('shows loading spinner initially', () => {
    (api.get as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<DocumentsTab contractId={1} isAdmin={true} onApply={onApply} />, { wrapper: createWrapper() });
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows empty state when there are no documents', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });
    render(<DocumentsTab contractId={1} isAdmin={true} onApply={onApply} />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(/nessun documento/i)).toBeInTheDocument());
  });

  it('renders document list with formatted file sizes', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [doc, smallDoc, mediumDoc] });
    render(<DocumentsTab contractId={1} isAdmin={true} onApply={onApply} />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText('contract.pdf')).toBeInTheDocument());
    expect(screen.getByText('tiny.pdf')).toBeInTheDocument();
    expect(screen.getByText('medium.pdf')).toBeInTheDocument();
    // formatBytes: B, KB, MB
    expect(screen.getByText(/512 B/)).toBeInTheDocument();
    expect(screen.getByText(/100\.0 KB/)).toBeInTheDocument();
    expect(screen.getByText(/1\.4 MB/)).toBeInTheDocument();
  });

  it('hides delete button for non-admin users', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [doc] });
    render(<DocumentsTab contractId={1} isAdmin={false} onApply={onApply} />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText('contract.pdf')).toBeInTheDocument());
    expect(screen.queryByTitle('Elimina documento')).not.toBeInTheDocument();
  });

  it('shows delete button for admin users', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [doc] });
    render(<DocumentsTab contractId={1} isAdmin={true} onApply={onApply} />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByTitle('Elimina documento')).toBeInTheDocument());
  });

  it('calls delete mutation and shows success toast', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [doc] });
    (api.delete as jest.Mock).mockResolvedValue({});
    render(<DocumentsTab contractId={1} isAdmin={true} onApply={onApply} />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByTitle('Elimina documento')).toBeInTheDocument());
    await userEvent.click(screen.getByTitle('Elimina documento'));
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/contracts/1/documents/1'));
    expect(toast.success).toHaveBeenCalledWith('Documento eliminato');
  });

  it('rejects non-PDF files and shows error toast', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });
    render(<DocumentsTab contractId={1} isAdmin={true} onApply={onApply} />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(/carica pdf/i)).toBeInTheDocument());
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'doc.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(toast.error).toHaveBeenCalledWith('Sono ammessi solo file PDF');
    expect(api.post).not.toHaveBeenCalled();
  });

  it('uploads a valid PDF and shows success toast', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });
    (api.post as jest.Mock).mockResolvedValue({ data: doc });
    render(<DocumentsTab contractId={1} isAdmin={true} onApply={onApply} />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(/carica pdf/i)).toBeInTheDocument());
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['%PDF-1.4'], 'valid.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(api.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith('Documento caricato con successo');
  });

  it('shows analysis results after clicking analyze button', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [doc] });
    (api.post as jest.Mock).mockResolvedValue({ data: analysis });
    render(<DocumentsTab contractId={1} isAdmin={true} onApply={onApply} />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByTitle('Analizza con AI')).toBeInTheDocument());
    await userEvent.click(screen.getByTitle('Analizza con AI'));
    await waitFor(() => expect(screen.getByText(/risultati estrazione ai/i)).toBeInTheDocument());
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('CNT-001')).toBeInTheDocument();
    expect(screen.getByText('50000')).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith('Analisi completata');
  });

  it('shows "Not detected" for null analysis fields', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [doc] });
    (api.post as jest.Mock).mockResolvedValue({ data: { ...analysis, detectedAmount: null, detectedContractNumber: null } });
    render(<DocumentsTab contractId={1} isAdmin={true} onApply={onApply} />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByTitle('Analizza con AI')).toBeInTheDocument());
    await userEvent.click(screen.getByTitle('Analizza con AI'));
    await waitFor(() => expect(screen.getAllByText('Non rilevato').length).toBeGreaterThan(0));
  });

  it('calls onApply with detected values when Apply button is clicked', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [doc] });
    (api.post as jest.Mock).mockResolvedValue({ data: analysis });
    render(<DocumentsTab contractId={1} isAdmin={true} onApply={onApply} />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByTitle('Analizza con AI')).toBeInTheDocument());
    await userEvent.click(screen.getByTitle('Analizza con AI'));
    await waitFor(() => expect(screen.getByText(/applica al contratto/i)).toBeInTheDocument());
    await userEvent.click(screen.getByText(/applica al contratto/i));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({
      customerName: 'Acme Corp',
      contractNumber: 'CNT-001',
    }));
  });

  it('collapses analysis panel when toggle button is clicked', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [doc] });
    (api.post as jest.Mock).mockResolvedValue({ data: analysis });
    render(<DocumentsTab contractId={1} isAdmin={true} onApply={onApply} />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByTitle('Analizza con AI')).toBeInTheDocument());
    await userEvent.click(screen.getByTitle('Analizza con AI'));
    await waitFor(() => expect(screen.getByTitle('Comprimi analisi')).toBeInTheDocument());
    await userEvent.click(screen.getByTitle('Comprimi analisi'));
    expect(screen.queryByText(/risultati estrazione ai/i)).not.toBeInTheDocument();
    // Re-expand
    await userEvent.click(screen.getByTitle('Espandi analisi'));
    expect(screen.getByText(/risultati estrazione ai/i)).toBeInTheDocument();
  });

  it('calls download API when download button is clicked', async () => {
    (api.get as jest.Mock)
      .mockResolvedValueOnce({ data: [doc] })
      .mockResolvedValueOnce({ data: new Blob(['%PDF']) });
    render(<DocumentsTab contractId={1} isAdmin={true} onApply={onApply} />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByTitle('Scarica documento')).toBeInTheDocument());
    await userEvent.click(screen.getByTitle('Scarica documento'));
    await waitFor(() => expect(api.get).toHaveBeenCalledWith(
      '/contracts/1/documents/1/download',
      { responseType: 'blob' }
    ));
  });

  it('hides raw text section when rawText is empty', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [doc] });
    (api.post as jest.Mock).mockResolvedValue({ data: { ...analysis, rawText: '' } });
    render(<DocumentsTab contractId={1} isAdmin={true} onApply={onApply} />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByTitle('Analizza con AI')).toBeInTheDocument());
    await userEvent.click(screen.getByTitle('Analizza con AI'));
    await waitFor(() => expect(screen.getByText(/risultati estrazione ai/i)).toBeInTheDocument());
    expect(screen.queryByText(/mostra testo estratto/i)).not.toBeInTheDocument();
  });

  it('apply skips null detected fields', async () => {
    const nullAnalysis = { ...analysis, detectedCustomerName: null, detectedContractNumber: null, detectedStartDate: null, detectedEndDate: null };
    (api.get as jest.Mock).mockResolvedValue({ data: [doc] });
    (api.post as jest.Mock).mockResolvedValue({ data: nullAnalysis });
    render(<DocumentsTab contractId={1} isAdmin={true} onApply={onApply} />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByTitle('Analizza con AI')).toBeInTheDocument());
    await userEvent.click(screen.getByTitle('Analizza con AI'));
    await waitFor(() => expect(screen.getByText(/applica al contratto/i)).toBeInTheDocument());
    await userEvent.click(screen.getByText(/applica al contratto/i));
    expect(onApply).toHaveBeenCalledWith({});
  });

  it('does nothing when file input fires with no file selected', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });
    render(<DocumentsTab contractId={1} isAdmin={true} onApply={onApply} />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(/carica pdf/i)).toBeInTheDocument());
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: null } });
    expect(api.post).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('shows uploading state while upload mutation is pending', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });
    (api.post as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<DocumentsTab contractId={1} isAdmin={true} onApply={onApply} />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(/carica pdf/i)).toBeInTheDocument());
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['%PDF'], 'loading.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(screen.getByText(/caricamento\.\.\./i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /caricamento/i })).toBeDisabled();
  });

  it('shows analyzing spinner while analyze mutation is pending', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [doc] });
    (api.post as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<DocumentsTab contractId={1} isAdmin={true} onApply={onApply} />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByTitle('Analizza con AI')).toBeInTheDocument());
    await userEvent.click(screen.getByTitle('Analizza con AI'));
    await waitFor(() => expect(screen.getByTitle('Analizza con AI')).toBeDisabled());
  });

  it('shows error toast when download fails', async () => {
    (api.get as jest.Mock)
      .mockResolvedValueOnce({ data: [doc] })
      .mockRejectedValueOnce(new Error('download failed'));
    render(<DocumentsTab contractId={1} isAdmin={true} onApply={onApply} />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByTitle('Scarica documento')).toBeInTheDocument());
    await userEvent.click(screen.getByTitle('Scarica documento'));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Download del documento non riuscito'));
  });

  it('shows error toast when upload fails', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });
    (api.post as jest.Mock).mockRejectedValue(new Error('upload failed'));
    render(<DocumentsTab contractId={1} isAdmin={true} onApply={onApply} />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(/carica pdf/i)).toBeInTheDocument());
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['%PDF'], 'test.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Caricamento del documento non riuscito'));
  });

  it('shows error toast when delete fails', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [doc] });
    (api.delete as jest.Mock).mockRejectedValue(new Error('delete failed'));
    render(<DocumentsTab contractId={1} isAdmin={true} onApply={onApply} />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByTitle('Elimina documento')).toBeInTheDocument());
    await userEvent.click(screen.getByTitle('Elimina documento'));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Eliminazione del documento non riuscita'));
  });

  it('clicks the hidden file input when upload button is clicked', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });
    render(<DocumentsTab contractId={1} isAdmin={true} onApply={onApply} />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByRole('button', { name: /carica pdf/i })).toBeInTheDocument());
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = jest.spyOn(input, 'click').mockImplementation(() => {});
    await userEvent.click(screen.getByRole('button', { name: /carica pdf/i }));
    expect(clickSpy).toHaveBeenCalled();
  });

  it('shows error toast when analysis fails', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [doc] });
    (api.post as jest.Mock).mockRejectedValue(new Error('analysis failed'));
    render(<DocumentsTab contractId={1} isAdmin={true} onApply={onApply} />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByTitle('Analizza con AI')).toBeInTheDocument());
    await userEvent.click(screen.getByTitle('Analizza con AI'));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Analisi non riuscita'), { timeout: 3000 });
  });
});
