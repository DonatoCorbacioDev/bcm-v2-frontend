import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
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
import InvoicesTab from '@/components/contracts/InvoicesTab';

// ── fixtures ──────────────────────────────────────────────────────────────────

const lineItem = {
  lineNumber: 1,
  description: 'Consulting services',
  quantity: 10,
  unitOfMeasure: 'HH',
  unitPrice: 100,
  totalPrice: 1000,
  vatRate: 22,
};

const invoice = {
  id: 1,
  contractId: 1,
  fileName: 'fattura.xml',
  fileSize: 2097152,          // 2 MB → "2.0 MB"
  uploadedAt: '2024-03-15T10:00:00Z',
  downloadUrl: '',
  supplierName: 'Fornitore SRL',
  supplierVatNumber: 'IT12345678901',
  documentType: 'TD01',
  invoiceNumber: 'FT-2024-001',
  invoiceDate: '2024-03-01',
  totalAmount: 1220,
  currency: 'EUR',
  lineItems: [lineItem],
};

const invoiceKB   = { ...invoice, id: 2, fileName: 'piccola.xml', fileSize: 512    }; // 512 B
const invoiceMed  = { ...invoice, id: 3, fileName: 'media.xml',   fileSize: 102400 }; // 100 KB

global.URL.createObjectURL = jest.fn(() => 'blob:mock');
global.URL.revokeObjectURL = jest.fn();

beforeEach(() => jest.clearAllMocks());

// ── helpers ───────────────────────────────────────────────────────────────────

function renderTab(isAdmin = true) {
  return render(
    <InvoicesTab contractId={1} isAdmin={isAdmin} />,
    { wrapper: createWrapper() },
  );
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('InvoicesTab', () => {
  // ── loading ────────────────────────────────────────────────────────────────

  it('shows skeleton loader while fetching', () => {
    (api.get as jest.Mock).mockReturnValue(new Promise(() => {}));
    renderTab();
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  // ── empty state ────────────────────────────────────────────────────────────

  it('shows empty state when invoice list is empty', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });
    renderTab();
    await waitFor(() =>
      expect(screen.getByText(/nessuna fattura/i)).toBeInTheDocument(),
    );
  });

  it('shows empty state when data is undefined/null', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: null });
    renderTab();
    await waitFor(() =>
      expect(screen.getByText(/nessuna fattura/i)).toBeInTheDocument(),
    );
  });

  // ── list rendering ─────────────────────────────────────────────────────────

  it('renders invoice table with formatted file sizes', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [invoice, invoiceKB, invoiceMed] });
    renderTab();
    await waitFor(() => expect(screen.getByText('fattura.xml')).toBeInTheDocument());
    // 2 MB
    expect(screen.getByText(/2\.0 MB/)).toBeInTheDocument();
    // 512 B
    expect(screen.getByText(/512 B/)).toBeInTheDocument();
    // 100.0 KB
    expect(screen.getByText(/100\.0 KB/)).toBeInTheDocument();
  });

  it('renders supplier name and invoice number in the table', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [invoice] });
    renderTab();
    await waitFor(() => expect(screen.getByText('Fornitore SRL')).toBeInTheDocument());
    expect(screen.getByText('FT-2024-001')).toBeInTheDocument();
    // totalAmount + currency via formatAmount
    expect(screen.getByText(/1\.?220,00 EUR/)).toBeInTheDocument();
  });

  // ── admin guard ────────────────────────────────────────────────────────────

  it('hides delete button for non-admin users', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [invoice] });
    renderTab(false);
    await waitFor(() => expect(screen.getByText('fattura.xml')).toBeInTheDocument());
    expect(screen.queryByTitle('Elimina fattura')).not.toBeInTheDocument();
  });

  it('shows delete button for admin users', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [invoice] });
    renderTab(true);
    await waitFor(() => expect(screen.getByTitle('Elimina fattura')).toBeInTheDocument());
  });

  // ── upload ─────────────────────────────────────────────────────────────────

  it('does nothing when file input fires with no file', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });
    renderTab();
    await waitFor(() => expect(screen.getByText(/carica fattura/i)).toBeInTheDocument());
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: null } });
    expect(api.post).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('rejects non-XML files and shows error toast', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });
    renderTab();
    await waitFor(() => expect(screen.getByText(/carica fattura/i)).toBeInTheDocument());
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(toast.error).toHaveBeenCalledWith('Sono ammessi solo file XML');
    expect(api.post).not.toHaveBeenCalled();
  });

  it('uploads a valid XML file and shows success toast', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });
    (api.post as jest.Mock).mockResolvedValue({ data: invoice });
    renderTab();
    await waitFor(() => expect(screen.getByText(/carica fattura/i)).toBeInTheDocument());
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['<xml/>'], 'fattura.xml', { type: 'text/xml' });
    Object.defineProperty(file, 'name', { value: 'fattura.xml' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(api.post).toHaveBeenCalledWith(
      '/contracts/1/invoices',
      expect.any(FormData),
      expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } }),
    ));
    expect(toast.success).toHaveBeenCalledWith('Fattura caricata con successo');
  });

  it('shows error toast when upload fails', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });
    (api.post as jest.Mock).mockRejectedValue(new Error('upload failed'));
    renderTab();
    await waitFor(() => expect(screen.getByText(/carica fattura/i)).toBeInTheDocument());
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['<xml/>'], 'fattura.xml', { type: 'text/xml' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Caricamento della fattura non riuscito'),
    );
  });

  it('shows uploading state while mutation is pending', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });
    (api.post as jest.Mock).mockReturnValue(new Promise(() => {}));
    renderTab();
    await waitFor(() => expect(screen.getByText(/carica fattura/i)).toBeInTheDocument());
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['<xml/>'], 'fattura.xml', { type: 'text/xml' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(screen.getByText(/caricamento\.\.\./i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /caricamento/i })).toBeDisabled();
  });

  // ── delete ─────────────────────────────────────────────────────────────────

  it('calls delete API and shows success toast', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [invoice] });
    (api.delete as jest.Mock).mockResolvedValue({});
    renderTab();
    await waitFor(() => expect(screen.getByTitle('Elimina fattura')).toBeInTheDocument());
    await userEvent.click(screen.getByTitle('Elimina fattura'));
    await waitFor(() =>
      expect(api.delete).toHaveBeenCalledWith('/contracts/1/invoices/1'),
    );
    expect(toast.success).toHaveBeenCalledWith('Fattura eliminata');
  });

  it('shows error toast when delete fails', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [invoice] });
    (api.delete as jest.Mock).mockRejectedValue(new Error('delete failed'));
    renderTab();
    await waitFor(() => expect(screen.getByTitle('Elimina fattura')).toBeInTheDocument());
    await userEvent.click(screen.getByTitle('Elimina fattura'));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Eliminazione della fattura non riuscita'),
    );
  });

  it('delete button is disabled while mutation is pending', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [invoice] });
    (api.delete as jest.Mock).mockReturnValue(new Promise(() => {}));
    renderTab();
    await waitFor(() => expect(screen.getByTitle('Elimina fattura')).toBeInTheDocument());
    await userEvent.click(screen.getByTitle('Elimina fattura'));
    await waitFor(() => expect(screen.getByTitle('Elimina fattura')).toBeDisabled());
  });

  // ── download ───────────────────────────────────────────────────────────────

  it('downloads invoice file when download button is clicked', async () => {
    (api.get as jest.Mock)
      .mockResolvedValueOnce({ data: [invoice] })
      .mockResolvedValueOnce({ data: new Blob(['<xml/>']) });
    renderTab();
    await waitFor(() => expect(screen.getByTitle('Scarica fattura')).toBeInTheDocument());
    await userEvent.click(screen.getByTitle('Scarica fattura'));
    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith(
        '/contracts/1/invoices/1/download',
        { responseType: 'blob' },
      ),
    );
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
  });

  it('shows error toast when download fails', async () => {
    (api.get as jest.Mock)
      .mockResolvedValueOnce({ data: [invoice] })
      .mockRejectedValueOnce(new Error('network error'));
    renderTab();
    await waitFor(() => expect(screen.getByTitle('Scarica fattura')).toBeInTheDocument());
    await userEvent.click(screen.getByTitle('Scarica fattura'));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Download della fattura non riuscito'),
    );
  });

  // ── stopPropagation on actions cell ───────────────────────────────────────

  it('clicking the actions cell does not open the detail dialog', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [invoice] });
    renderTab();
    await waitFor(() => expect(screen.getByTitle('Scarica fattura')).toBeInTheDocument());
    // Click the actions <td> directly — propagation should be stopped
    const actionsTd = screen.getByTitle('Scarica fattura').closest('td')!;
    fireEvent.click(actionsTd);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // ── row click → detail dialog ──────────────────────────────────────────────

  it('opens detail dialog with full invoice info on row click', async () => {
    (api.get as jest.Mock)
      .mockResolvedValueOnce({ data: [invoice] })
      .mockResolvedValueOnce({ data: invoice });
    renderTab();
    await waitFor(() => expect(screen.getByText('fattura.xml')).toBeInTheDocument());
    await userEvent.click(screen.getByText('fattura.xml'));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    const dialog = screen.getByRole('dialog');
    // Unique-to-dialog fields (not in the table)
    expect(within(dialog).getByText('IT12345678901')).toBeInTheDocument();
    expect(within(dialog).getByText('TD01')).toBeInTheDocument();
    // Line items table
    expect(within(dialog).getByText('Voci di dettaglio')).toBeInTheDocument();
    expect(within(dialog).getByText('Consulting services')).toBeInTheDocument();
    expect(within(dialog).getByText('HH')).toBeInTheDocument();
    expect(within(dialog).getByText('22%')).toBeInTheDocument();
  });

  it('does not render line items section when lineItems is empty', async () => {
    const invoiceNoItems = { ...invoice, lineItems: [] };
    (api.get as jest.Mock)
      .mockResolvedValueOnce({ data: [invoiceNoItems] })
      .mockResolvedValueOnce({ data: invoiceNoItems });
    renderTab();
    await waitFor(() => expect(screen.getByText('fattura.xml')).toBeInTheDocument());
    await userEvent.click(screen.getByText('fattura.xml'));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    expect(screen.queryByText('Voci di dettaglio')).not.toBeInTheDocument();
  });

  it('shows error toast when row click detail fetch fails', async () => {
    (api.get as jest.Mock)
      .mockResolvedValueOnce({ data: [invoice] })
      .mockRejectedValueOnce(new Error('fetch failed'));
    renderTab();
    await waitFor(() => expect(screen.getByText('fattura.xml')).toBeInTheDocument());
    await userEvent.click(screen.getByText('fattura.xml'));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Caricamento dei dettagli della fattura non riuscito'),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
