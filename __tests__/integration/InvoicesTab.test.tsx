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
    patch:  jest.fn(),
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
  supplierIban: 'IT60X0542811101000000123456',
  supplierBic: 'UNCRITMMXXX',
  paymentDueDate: '2024-04-01',
  sepaBatchId: null,
};

const invoiceKB   = { ...invoice, id: 2, fileName: 'piccola.xml', fileSize: 512    }; // 512 B
const invoiceMed  = { ...invoice, id: 3, fileName: 'media.xml',   fileSize: 102400 }; // 100 KB
const invoiceNoIban = { ...invoice, id: 4, fileName: 'no-iban.xml', supplierIban: null, supplierBic: null };
const invoicePaid = { ...invoice, id: 5, fileName: 'pagata.xml', sepaBatchId: 99 };
const invoiceNoPaymentDetails = {
  ...invoice, id: 6, fileName: 'no-payment-details.xml',
  supplierIban: null, supplierBic: null, paymentDueDate: null,
};

const sepaBatch = {
  id: 99,
  contractId: 1,
  executionDate: '2024-04-05',
  totalAmount: 1220,
  currency: 'EUR',
  numberOfTransactions: 1,
  fileName: 'sepa-1-2024-04-05.xml',
  createdAt: '2024-04-04T09:00:00Z',
};

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

type MockConfig = {
  invoices?: unknown[];
  invoicesError?: Error;
  detail?: unknown;
  detailError?: Error;
  download?: Blob;
  downloadError?: Error;
  sepaPayments?: unknown[];
  sepaPaymentsError?: Error;
};

/** URL-based GET mock so concurrent queries (invoices + sepa-payments) don't fight over a positional queue. */
function mockApiGet(config: MockConfig) {
  (api.get as jest.Mock).mockImplementation((url: string) => {
    if (url.includes('/sepa-payments') && !url.includes('/download')) {
      return config.sepaPaymentsError
        ? Promise.reject(config.sepaPaymentsError)
        : Promise.resolve({ data: config.sepaPayments ?? [] });
    }
    if (url.endsWith('/download')) {
      return config.downloadError
        ? Promise.reject(config.downloadError)
        : Promise.resolve({ data: config.download ?? new Blob(['<xml/>']) });
    }
    if (/\/invoices\/\d+$/.test(url)) {
      return config.detailError
        ? Promise.reject(config.detailError)
        : Promise.resolve({ data: config.detail });
    }
    if (url.endsWith('/invoices')) {
      return config.invoicesError
        ? Promise.reject(config.invoicesError)
        : Promise.resolve({ data: config.invoices ?? [] });
    }
    return Promise.reject(new Error(`Unhandled GET ${url} in test mock`));
  });
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
    mockApiGet({ invoices: [] });
    renderTab();
    expect(await screen.findByText(/nessuna fattura/i)).toBeInTheDocument();
  });

  it('shows empty state when data is undefined/null', async () => {
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/sepa-payments')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: null });
    });
    renderTab();
    expect(await screen.findByText(/nessuna fattura/i)).toBeInTheDocument();
  });

  // ── list rendering ─────────────────────────────────────────────────────────

  it('renders invoice table with formatted file sizes', async () => {
    mockApiGet({ invoices: [invoice, invoiceKB, invoiceMed] });
    renderTab();
    expect(await screen.findByText('fattura.xml')).toBeInTheDocument();
    // 2 MB
    expect(screen.getByText(/2\.0 MB/)).toBeInTheDocument();
    // 512 B
    expect(screen.getByText(/512 B/)).toBeInTheDocument();
    // 100.0 KB
    expect(screen.getByText(/100\.0 KB/)).toBeInTheDocument();
  });

  it('renders supplier name and invoice number in the table', async () => {
    mockApiGet({ invoices: [invoice] });
    renderTab();
    expect(await screen.findByText('Fornitore SRL')).toBeInTheDocument();
    expect(screen.getByText('FT-2024-001')).toBeInTheDocument();
    // totalAmount + currency via formatAmount
    expect(screen.getByText(/1\.?220,00 EUR/)).toBeInTheDocument();
  });

  // ── admin guard ────────────────────────────────────────────────────────────

  it('hides delete button for non-admin users', async () => {
    mockApiGet({ invoices: [invoice] });
    renderTab(false);
    expect(await screen.findByText('fattura.xml')).toBeInTheDocument();
    expect(screen.queryByTitle('Elimina fattura')).not.toBeInTheDocument();
  });

  it('shows delete button for admin users', async () => {
    mockApiGet({ invoices: [invoice] });
    renderTab(true);
    expect(await screen.findByTitle('Elimina fattura')).toBeInTheDocument();
  });

  // ── upload ─────────────────────────────────────────────────────────────────

  it('does nothing when file input fires with no file', async () => {
    mockApiGet({ invoices: [] });
    renderTab();
    expect(await screen.findByText(/carica fattura/i)).toBeInTheDocument();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: null } });
    expect(api.post).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('rejects non-XML files and shows error toast', async () => {
    mockApiGet({ invoices: [] });
    renderTab();
    expect(await screen.findByText(/carica fattura/i)).toBeInTheDocument();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(toast.error).toHaveBeenCalledWith('Sono ammessi solo file XML');
    expect(api.post).not.toHaveBeenCalled();
  });

  it('uploads a valid XML file and shows success toast', async () => {
    mockApiGet({ invoices: [] });
    (api.post as jest.Mock).mockResolvedValue({ data: invoice });
    renderTab();
    expect(await screen.findByText(/carica fattura/i)).toBeInTheDocument();
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
    mockApiGet({ invoices: [] });
    (api.post as jest.Mock).mockRejectedValue(new Error('upload failed'));
    renderTab();
    expect(await screen.findByText(/carica fattura/i)).toBeInTheDocument();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['<xml/>'], 'fattura.xml', { type: 'text/xml' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Caricamento della fattura non riuscito'),
    );
  });

  it('shows uploading state while mutation is pending', async () => {
    mockApiGet({ invoices: [] });
    (api.post as jest.Mock).mockReturnValue(new Promise(() => {}));
    renderTab();
    expect(await screen.findByText(/carica fattura/i)).toBeInTheDocument();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['<xml/>'], 'fattura.xml', { type: 'text/xml' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(await screen.findByText(/caricamento\.\.\./i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /caricamento/i })).toBeDisabled();
  });

  // ── delete ─────────────────────────────────────────────────────────────────

  it('calls delete API and shows success toast', async () => {
    mockApiGet({ invoices: [invoice] });
    (api.delete as jest.Mock).mockResolvedValue({});
    renderTab();
    expect(await screen.findByTitle('Elimina fattura')).toBeInTheDocument();
    await userEvent.click(screen.getByTitle('Elimina fattura'));
    await waitFor(() =>
      expect(api.delete).toHaveBeenCalledWith('/contracts/1/invoices/1'),
    );
    expect(toast.success).toHaveBeenCalledWith('Fattura eliminata');
  });

  it('shows error toast when delete fails', async () => {
    mockApiGet({ invoices: [invoice] });
    (api.delete as jest.Mock).mockRejectedValue(new Error('delete failed'));
    renderTab();
    expect(await screen.findByTitle('Elimina fattura')).toBeInTheDocument();
    await userEvent.click(screen.getByTitle('Elimina fattura'));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Eliminazione della fattura non riuscita'),
    );
  });

  it('delete button is disabled while mutation is pending', async () => {
    mockApiGet({ invoices: [invoice] });
    (api.delete as jest.Mock).mockReturnValue(new Promise(() => {}));
    renderTab();
    expect(await screen.findByTitle('Elimina fattura')).toBeInTheDocument();
    await userEvent.click(screen.getByTitle('Elimina fattura'));
    expect(await screen.findByTitle('Elimina fattura')).toBeDisabled();
  });

  // ── download ───────────────────────────────────────────────────────────────

  it('downloads invoice file when download button is clicked', async () => {
    mockApiGet({ invoices: [invoice], download: new Blob(['<xml/>']) });
    renderTab();
    expect(await screen.findByTitle('Scarica fattura')).toBeInTheDocument();
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
    mockApiGet({ invoices: [invoice], downloadError: new Error('network error') });
    renderTab();
    expect(await screen.findByTitle('Scarica fattura')).toBeInTheDocument();
    await userEvent.click(screen.getByTitle('Scarica fattura'));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Download della fattura non riuscito'),
    );
  });

  // ── stopPropagation on actions cell ───────────────────────────────────────

  it('clicking the actions cell does not open the detail dialog', async () => {
    mockApiGet({ invoices: [invoice] });
    renderTab();
    expect(await screen.findByTitle('Scarica fattura')).toBeInTheDocument();
    // Click the actions <td> directly — propagation should be stopped
    const actionsTd = screen.getByTitle('Scarica fattura').closest('td')!;
    fireEvent.click(actionsTd);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // ── row click → detail dialog ──────────────────────────────────────────────

  it('opens detail dialog with full invoice info on row click', async () => {
    mockApiGet({ invoices: [invoice], detail: invoice });
    renderTab();
    expect(await screen.findByText('fattura.xml')).toBeInTheDocument();
    await userEvent.click(screen.getByText('fattura.xml'));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
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
    mockApiGet({ invoices: [invoiceNoItems], detail: invoiceNoItems });
    renderTab();
    expect(await screen.findByText('fattura.xml')).toBeInTheDocument();
    await userEvent.click(screen.getByText('fattura.xml'));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByText('Voci di dettaglio')).not.toBeInTheDocument();
  });

  it('shows error toast when row click detail fetch fails', async () => {
    mockApiGet({ invoices: [invoice], detailError: new Error('fetch failed') });
    renderTab();
    expect(await screen.findByText('fattura.xml')).toBeInTheDocument();
    await userEvent.click(screen.getByText('fattura.xml'));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Caricamento dei dettagli della fattura non riuscito'),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // ── SEPA: selection state ──────────────────────────────────────────────────

  it('disables the selection checkbox when the supplier IBAN is missing', async () => {
    mockApiGet({ invoices: [invoiceNoIban] });
    renderTab();
    expect(await screen.findByText('no-iban.xml')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /seleziona fattura/i })).toBeDisabled();
    expect(screen.getByText('IBAN mancante')).toBeInTheDocument();
  });

  it('disables the selection checkbox and shows "Pagata" once the invoice is already batched', async () => {
    mockApiGet({ invoices: [invoicePaid] });
    renderTab();
    expect(await screen.findByText('pagata.xml')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /seleziona fattura/i })).toBeDisabled();
    expect(screen.getByText('Pagata')).toBeInTheDocument();
  });

  it('allows selecting an eligible invoice and shows the generate button with the count', async () => {
    mockApiGet({ invoices: [invoice] });
    renderTab();
    expect(await screen.findByText('Pronta per SEPA')).toBeInTheDocument();
    const checkbox = screen.getByRole('checkbox', { name: /seleziona fattura/i });
    expect(checkbox).not.toBeDisabled();
    await userEvent.click(checkbox);
    expect(screen.getByRole('button', { name: /genera pagamento sepa \(1\)/i })).toBeInTheDocument();
  });

  it('deselects an invoice and hides the generate button again', async () => {
    mockApiGet({ invoices: [invoice] });
    renderTab();
    expect(await screen.findByText('Pronta per SEPA')).toBeInTheDocument();
    const checkbox = screen.getByRole('checkbox', { name: /seleziona fattura/i });
    await userEvent.click(checkbox);
    expect(screen.getByRole('button', { name: /genera pagamento sepa/i })).toBeInTheDocument();
    await userEvent.click(checkbox);
    expect(screen.queryByRole('button', { name: /genera pagamento sepa/i })).not.toBeInTheDocument();
  });

  // ── SEPA: generate payment ─────────────────────────────────────────────────

  it('generates a SEPA payment for the selected invoice and triggers a download', async () => {
    mockApiGet({ invoices: [invoice] });
    (api.post as jest.Mock).mockResolvedValue({ data: new Blob(['<Document/>']) });
    renderTab();
    expect(await screen.findByText('Pronta per SEPA')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: /seleziona fattura/i }));
    await userEvent.click(screen.getByRole('button', { name: /genera pagamento sepa/i }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        '/contracts/1/sepa-payments',
        { invoiceIds: [1] },
        expect.objectContaining({ responseType: 'blob' }),
      ),
    );
    expect(toast.success).toHaveBeenCalledWith('Pagamento SEPA generato con successo');
  });

  it('shows error toast when SEPA generation fails', async () => {
    mockApiGet({ invoices: [invoice] });
    (api.post as jest.Mock).mockRejectedValue(new Error('generation failed'));
    renderTab();
    expect(await screen.findByText('Pronta per SEPA')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: /seleziona fattura/i }));
    await userEvent.click(screen.getByRole('button', { name: /genera pagamento sepa/i }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Generazione del pagamento SEPA non riuscita'),
    );
  });

  it('shows a spinner on the generate button while SEPA generation is pending', async () => {
    mockApiGet({ invoices: [invoice] });
    (api.post as jest.Mock).mockReturnValue(new Promise(() => {}));
    renderTab();
    expect(await screen.findByText('Pronta per SEPA')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: /seleziona fattura/i }));
    const generateButton = screen.getByRole('button', { name: /genera pagamento sepa/i });
    await userEvent.click(generateButton);
    await waitFor(() => expect(generateButton).toBeDisabled());
    expect(generateButton.querySelector('.animate-spin')).toBeInTheDocument();
  });

  // ── SEPA: payment details dialog ──────────────────────────────────────────

  it('opens the payment details dialog and saves a new IBAN', async () => {
    mockApiGet({ invoices: [invoiceNoIban] });
    (api.patch as jest.Mock).mockResolvedValue({ data: { ...invoiceNoIban, supplierIban: 'IT60X0542811101000000123456' } });
    renderTab();
    expect(await screen.findByText('IBAN mancante')).toBeInTheDocument();
    await userEvent.click(screen.getByText('IBAN mancante'));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    const ibanField = screen.getByLabelText(/IBAN \*/i);
    await userEvent.type(ibanField, 'IT60X0542811101000000123456');
    await userEvent.click(screen.getByRole('button', { name: /^salva$/i }));

    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith(
        '/contracts/1/invoices/4/payment-details',
        expect.objectContaining({ supplierIban: 'IT60X0542811101000000123456' }),
      ),
    );
    expect(toast.success).toHaveBeenCalledWith('Dati di pagamento aggiornati');
  });

  it('shows a validation error when saving payment details without an IBAN', async () => {
    mockApiGet({ invoices: [invoiceNoIban] });
    renderTab();
    expect(await screen.findByText('IBAN mancante')).toBeInTheDocument();
    await userEvent.click(screen.getByText('IBAN mancante'));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^salva$/i }));

    expect(toast.error).toHaveBeenCalledWith("L'IBAN è obbligatorio");
    expect(api.patch).not.toHaveBeenCalled();
  });

  it('opens the payment details dialog from the actions column, prefilled with existing data, and updates the BIC and due date', async () => {
    mockApiGet({ invoices: [invoice] });
    (api.patch as jest.Mock).mockResolvedValue({ data: invoice });
    renderTab();
    expect(await screen.findByTitle('Modifica dati di pagamento')).toBeInTheDocument();
    await userEvent.click(screen.getByTitle('Modifica dati di pagamento'));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    expect(screen.getByLabelText(/IBAN \*/i)).toHaveValue(invoice.supplierIban);
    expect(screen.getByLabelText(/BIC \/ SWIFT/i)).toHaveValue(invoice.supplierBic);
    expect(screen.getByLabelText(/Scadenza pagamento/i)).toHaveValue('2024-04-01');

    const bicField = screen.getByLabelText(/BIC \/ SWIFT/i);
    await userEvent.clear(bicField);
    await userEvent.type(bicField, 'BCITITMM');
    const dueDateField = screen.getByLabelText(/Scadenza pagamento/i);
    fireEvent.change(dueDateField, { target: { value: '2024-05-01' } });

    await userEvent.click(screen.getByRole('button', { name: /^salva$/i }));

    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith(
        '/contracts/1/invoices/1/payment-details',
        expect.objectContaining({ supplierBic: 'BCITITMM', paymentDueDate: '2024-05-01' }),
      ),
    );
  });

  it('shows an error toast when saving payment details fails', async () => {
    mockApiGet({ invoices: [invoiceNoIban] });
    (api.patch as jest.Mock).mockRejectedValue(new Error('save failed'));
    renderTab();
    expect(await screen.findByText('IBAN mancante')).toBeInTheDocument();
    await userEvent.click(screen.getByText('IBAN mancante'));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/IBAN \*/i), 'IT60X0542811101000000123456');
    await userEvent.click(screen.getByRole('button', { name: /^salva$/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Aggiornamento dei dati di pagamento non riuscito'),
    );
  });

  it('closes the payment details dialog when cancelled', async () => {
    mockApiGet({ invoices: [invoiceNoIban] });
    renderTab();
    expect(await screen.findByText('IBAN mancante')).toBeInTheDocument();
    await userEvent.click(screen.getByText('IBAN mancante'));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^annulla$/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes the payment details dialog on escape', async () => {
    mockApiGet({ invoices: [invoiceNoIban] });
    renderTab();
    expect(await screen.findByText('IBAN mancante')).toBeInTheDocument();
    await userEvent.click(screen.getByText('IBAN mancante'));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('prefills an empty due date field when the invoice has none, and saves with a null due date', async () => {
    mockApiGet({ invoices: [invoiceNoPaymentDetails] });
    (api.patch as jest.Mock).mockResolvedValue({ data: invoiceNoPaymentDetails });
    renderTab();
    expect(await screen.findByText('IBAN mancante')).toBeInTheDocument();
    await userEvent.click(screen.getByText('IBAN mancante'));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    expect(screen.getByLabelText(/Scadenza pagamento/i)).toHaveValue('');

    await userEvent.type(screen.getByLabelText(/IBAN \*/i), 'IT60X0542811101000000123456');
    await userEvent.click(screen.getByRole('button', { name: /^salva$/i }));

    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith(
        '/contracts/1/invoices/6/payment-details',
        expect.objectContaining({ supplierBic: null, paymentDueDate: null }),
      ),
    );
  });

  it('shows a "Salvataggio..." label on the save button while the payment details mutation is pending', async () => {
    mockApiGet({ invoices: [invoiceNoIban] });
    (api.patch as jest.Mock).mockReturnValue(new Promise(() => {}));
    renderTab();
    expect(await screen.findByText('IBAN mancante')).toBeInTheDocument();
    await userEvent.click(screen.getByText('IBAN mancante'));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/IBAN \*/i), 'IT60X0542811101000000123456');
    await userEvent.click(screen.getByRole('button', { name: /^salva$/i }));

    expect(await screen.findByRole('button', { name: /salvataggio/i })).toBeDisabled();
  });

  // ── SEPA: payment history ──────────────────────────────────────────────────

  it('renders the SEPA payment history and re-downloads a generated file', async () => {
    mockApiGet({ invoices: [invoice], sepaPayments: [sepaBatch] });
    renderTab();
    expect(await screen.findByText('Pagamenti SEPA generati')).toBeInTheDocument();
    expect(screen.getByText('sepa-1-2024-04-05.xml')).toBeInTheDocument();

    await userEvent.click(screen.getByTitle('Scarica di nuovo'));
    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith(
        '/contracts/1/sepa-payments/99/download',
        { responseType: 'blob' },
      ),
    );
  });

  it('does not render the SEPA payment history section when there are no batches yet', async () => {
    mockApiGet({ invoices: [invoice], sepaPayments: [] });
    renderTab();
    expect(await screen.findByText('fattura.xml')).toBeInTheDocument();
    expect(screen.queryByText('Pagamenti SEPA generati')).not.toBeInTheDocument();
  });

  it('shows an error toast when re-downloading a generated SEPA payment fails', async () => {
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/sepa-payments') && url.endsWith('/download')) {
        return Promise.reject(new Error('network error'));
      }
      if (url.includes('/sepa-payments')) return Promise.resolve({ data: [sepaBatch] });
      if (url.endsWith('/invoices')) return Promise.resolve({ data: [invoice] });
      return Promise.reject(new Error(`Unhandled GET ${url} in test mock`));
    });
    renderTab();
    expect(await screen.findByText('Pagamenti SEPA generati')).toBeInTheDocument();

    await userEvent.click(screen.getByTitle('Scarica di nuovo'));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Download del pagamento SEPA non riuscito'),
    );
  });
});
