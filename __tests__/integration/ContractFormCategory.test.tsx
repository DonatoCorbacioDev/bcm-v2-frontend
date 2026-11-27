import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createWrapper } from '../mocks/wrapper';
import { uid } from '../mocks/ids';

const loaded = (data: unknown[]) => ({ data, isLoading: false, isError: false });

jest.mock('@/hooks/useUpsertContract', () => ({ useUpsertContract: () => ({ mutateAsync: jest.fn(), isPending: false }) }));
jest.mock('@/hooks/useBusinessAreas', () => ({ useBusinessAreas: () => loaded([{ id: uid(1), name: 'Acquisti', description: '' }]) }));
jest.mock('@/hooks/useManagers', () => ({ useManagers: () => loaded([{ id: uid(4), firstName: 'Lucia', lastName: 'Verdi', email: 'l@v.it' }]) }));
jest.mock('@/hooks/useCounterparties', () => ({
  useCounterparties: () => loaded([
    { id: uid(10), name: 'Ferri Forniture', type: 'SUPPLIER' },
    { id: uid(11), name: 'Rossi Clienti', type: 'CUSTOMER' },
  ]),
}));
jest.mock('@/hooks/useFinancialTypes', () => ({
  useFinancialTypes: () => loaded([
    { id: uid(20), name: 'Ricavi', category: 'REVENUE' },
    { id: uid(21), name: 'Costi', category: 'COST' },
  ]),
}));

import ContractForm from '@/components/contracts/ContractForm';

async function chooseCounterparty(name: string) {
  await userEvent.click(screen.getByRole('combobox', { name: /controparte/i }));
  await userEvent.click(await screen.findByRole('option', { name }));
}

describe('ContractForm — the category follows the counterparty', () => {
  it('chooses Costi for a supplier', async () => {
    render(<ContractForm onClose={jest.fn()} />, { wrapper: createWrapper() });
    await chooseCounterparty('Ferri Forniture');

    expect(screen.getByRole('combobox', { name: /categoria/i })).toHaveTextContent('Costi');
  });

  it('chooses Ricavi for a customer', async () => {
    render(<ContractForm onClose={jest.fn()} />, { wrapper: createWrapper() });
    await chooseCounterparty('Rossi Clienti');

    expect(screen.getByRole('combobox', { name: /categoria/i })).toHaveTextContent('Ricavi');
  });

  it('keeps a category already chosen', async () => {
    render(<ContractForm onClose={jest.fn()} />, { wrapper: createWrapper() });
    await chooseCounterparty('Ferri Forniture');
    await chooseCounterparty('Rossi Clienti');

    // Chosen with the first counterparty, not overwritten by the second.
    expect(screen.getByRole('combobox', { name: /categoria/i })).toHaveTextContent('Costi');
  });
});
