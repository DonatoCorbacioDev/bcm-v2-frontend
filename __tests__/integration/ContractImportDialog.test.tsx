import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createWrapper } from '../mocks/wrapper';

// ─── Module mocks ────────────────────────────────────────────────────────────

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/services/contracts.service', () => ({
  contractsService: {
    importExcel: jest.fn(),
    downloadImportTemplate: jest.fn(),
  },
}));

jest.mock('@/hooks/queries/contracts.queryKeys', () => ({
  contractsQueryKeys: { list: () => ['contracts'] },
}));

// Avoids the NEXT_PUBLIC_API_URL throw from lib/api.ts.
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    defaults: { headers: { common: {} } },
  },
}));

// ─── Imports after mocks ─────────────────────────────────────────────────────

import { toast } from 'sonner';
import { contractsService } from '@/services/contracts.service';
import ContractImportDialog from '@/components/contracts/ContractImportDialog';

const onOpenChange = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  globalThis.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
  globalThis.URL.revokeObjectURL = jest.fn();
});

function selectFile(input: HTMLElement, file: File) {
  return userEvent.upload(input, file);
}

const xlsxFile = new File(['dummy'], 'contratti.xlsx', {
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
});

describe('ContractImportDialog', () => {
  it('renders the dialog when open=true', () => {
    render(<ContractImportDialog open={true} onOpenChange={onOpenChange} />, { wrapper: createWrapper() });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/importa contratti da excel/i)).toBeInTheDocument();
  });

  it('does not render dialog content when open=false', () => {
    render(<ContractImportDialog open={false} onOpenChange={onOpenChange} />, { wrapper: createWrapper() });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('disables the Importa button until a file is selected', () => {
    render(<ContractImportDialog open={true} onOpenChange={onOpenChange} />, { wrapper: createWrapper() });
    expect(screen.getByRole('button', { name: /importa$/i })).toBeDisabled();
  });

  it('enables the Importa button once a file is selected', async () => {
    render(<ContractImportDialog open={true} onOpenChange={onOpenChange} />, { wrapper: createWrapper() });
    await selectFile(screen.getByLabelText(/file excel/i), xlsxFile);
    expect(screen.getByRole('button', { name: /importa$/i })).toBeEnabled();
  });

  it('downloads the template when "Scarica template" is clicked', async () => {
    (contractsService.downloadImportTemplate as jest.Mock).mockResolvedValueOnce(new Blob(['x']));
    render(<ContractImportDialog open={true} onOpenChange={onOpenChange} />, { wrapper: createWrapper() });
    await userEvent.click(screen.getByRole('button', { name: /scarica template/i }));
    await waitFor(() => expect(contractsService.downloadImportTemplate).toHaveBeenCalled());
    expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
  });

  it('shows an error toast when the template download fails', async () => {
    (contractsService.downloadImportTemplate as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    render(<ContractImportDialog open={true} onOpenChange={onOpenChange} />, { wrapper: createWrapper() });
    await userEvent.click(screen.getByRole('button', { name: /scarica template/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Impossibile scaricare il template'));
  });

  it('imports a file and shows a success toast when all rows succeed', async () => {
    (contractsService.importExcel as jest.Mock).mockResolvedValueOnce({
      totalRows: 2, importedCount: 2, errorCount: 0, errors: [],
    });
    render(<ContractImportDialog open={true} onOpenChange={onOpenChange} />, { wrapper: createWrapper() });
    await selectFile(screen.getByLabelText(/file excel/i), xlsxFile);
    await userEvent.click(screen.getByRole('button', { name: /importa$/i }));
    await waitFor(() => expect(contractsService.importExcel).toHaveBeenCalledWith(xlsxFile));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('2 contratti importati con successo!'));
    expect(screen.getByText(/2 righe lette/i)).toBeInTheDocument();
  });

  it('shows per-row errors and a warning toast when some rows fail', async () => {
    (contractsService.importExcel as jest.Mock).mockResolvedValueOnce({
      totalRows: 2, importedCount: 1, errorCount: 1,
      errors: [{ rowNumber: 3, message: 'Area aziendale non trovata: "Finance"' }],
    });
    render(<ContractImportDialog open={true} onOpenChange={onOpenChange} />, { wrapper: createWrapper() });
    await selectFile(screen.getByLabelText(/file excel/i), xlsxFile);
    await userEvent.click(screen.getByRole('button', { name: /importa$/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('1 importati, 1 righe con errori'));
    expect(screen.getByText(/riga 3: area aziendale non trovata/i)).toBeInTheDocument();
  });

  it('shows an error toast when every row fails', async () => {
    (contractsService.importExcel as jest.Mock).mockResolvedValueOnce({
      totalRows: 1, importedCount: 0, errorCount: 1,
      errors: [{ rowNumber: 2, message: 'Cliente mancante' }],
    });
    render(<ContractImportDialog open={true} onOpenChange={onOpenChange} />, { wrapper: createWrapper() });
    await selectFile(screen.getByLabelText(/file excel/i), xlsxFile);
    await userEvent.click(screen.getByRole('button', { name: /importa$/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Nessun contratto importato: controlla gli errori'));
  });

  it('shows an error toast when the import request itself fails', async () => {
    (contractsService.importExcel as jest.Mock).mockRejectedValueOnce(new Error('network error'));
    render(<ContractImportDialog open={true} onOpenChange={onOpenChange} />, { wrapper: createWrapper() });
    await selectFile(screen.getByLabelText(/file excel/i), xlsxFile);
    await userEvent.click(screen.getByRole('button', { name: /importa$/i }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Importazione non riuscita. Controlla che il file sia un .xlsx valido')
    );
  });

  it('calls onOpenChange(false) when Chiudi is clicked', async () => {
    render(<ContractImportDialog open={true} onOpenChange={onOpenChange} />, { wrapper: createWrapper() });
    const [footerCloseButton] = screen.getAllByRole('button', { name: /chiudi/i });
    await userEvent.click(footerCloseButton);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
