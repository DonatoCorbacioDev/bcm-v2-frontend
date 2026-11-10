import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { createWrapper } from '../mocks/wrapper';

jest.mock('@/hooks/useUpsertContract', () => ({ useUpsertContract: () => ({ mutateAsync: jest.fn(), isPending: false }) }));
jest.mock('@/hooks/useBusinessAreas', () => ({ useBusinessAreas: jest.fn() }));
jest.mock('@/hooks/useManagers', () => ({ useManagers: jest.fn() }));
jest.mock('@/hooks/useCounterparties', () => ({ useCounterparties: () => ({ data: [], isLoading: false, isError: false }) }));
jest.mock('@/hooks/useFinancialTypes', () => ({ useFinancialTypes: () => ({ data: [], isLoading: false, isError: false }) }));

import { useBusinessAreas } from '@/hooks/useBusinessAreas';
import { useManagers } from '@/hooks/useManagers';
import ContractForm from '@/components/contracts/ContractForm';
import { uid } from "../mocks/ids";

const area = { id: uid(1), name: 'Acquisti', description: '' };
const manager = { id: uid(4), firstName: 'Lucia', lastName: 'Verdi', email: 'l@v.it' };
const loaded = (data: unknown[]) => ({ data, isLoading: false, isError: false });

describe('ContractForm — single area or responsabile', () => {
  it('pre-selects the only business area and the only manager on a new contract', async () => {
    (useBusinessAreas as jest.Mock).mockReturnValue(loaded([area]));
    (useManagers as jest.Mock).mockReturnValue(loaded([manager]));
    render(<ContractForm onClose={jest.fn()} />, { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByRole('combobox', { name: /area di business/i })).toHaveTextContent('Acquisti'));
    expect(screen.getByRole('combobox', { name: /responsabile/i })).toHaveTextContent('Lucia Verdi');
  });

  it('also pre-selects when the reference data arrives after the form opened', async () => {
    (useBusinessAreas as jest.Mock).mockReturnValue({ data: undefined, isLoading: true, isError: false });
    (useManagers as jest.Mock).mockReturnValue({ data: undefined, isLoading: true, isError: false });
    const { rerender } = render(<ContractForm onClose={jest.fn()} />, { wrapper: createWrapper() });
    expect(screen.getByText(/caricamento dati del form/i)).toBeInTheDocument();

    (useBusinessAreas as jest.Mock).mockReturnValue(loaded([area]));
    (useManagers as jest.Mock).mockReturnValue(loaded([manager]));
    rerender(<ContractForm onClose={jest.fn()} />);

    await waitFor(() => expect(screen.getByRole('combobox', { name: /area di business/i })).toHaveTextContent('Acquisti'));
  });

  it('leaves the choice open when there are several business areas', () => {
    (useBusinessAreas as jest.Mock).mockReturnValue(loaded([area, { id: uid(2), name: 'IT', description: '' }]));
    (useManagers as jest.Mock).mockReturnValue(loaded([manager]));
    render(<ContractForm onClose={jest.fn()} />, { wrapper: createWrapper() });

    expect(screen.getByRole('combobox', { name: /area di business/i })).toHaveTextContent(/seleziona/i);
    expect(screen.getByRole('combobox', { name: /responsabile/i })).toHaveTextContent('Lucia Verdi');
  });
});
