import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { createWrapper } from '../mocks/wrapper';

const replace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace, back: jest.fn() }),
  useSearchParams: () => new URLSearchParams('new=1'),
}));

jest.mock('@/store/authStore', () => ({ useAuthStore: jest.fn() }));
jest.mock('@/hooks/useBusinessAreas', () => ({ useBusinessAreas: jest.fn() }));
jest.mock('@/hooks/useManagers', () => ({ useManagers: jest.fn() }));
jest.mock('@/hooks/useCounterparties', () => ({ useCounterparties: jest.fn() }));

jest.mock('@/components/contracts/ContractTable', () => ({
  __esModule: true,
  default: () => <div>Contract Table Stub</div>,
}));
jest.mock('@/components/contracts/ContractForm', () => ({
  __esModule: true,
  default: () => <div>Contract Form Stub</div>,
}));
jest.mock('@/components/contracts/ContractImportDialog', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@/components/contracts/SemanticSearchBar', () => ({
  SemanticSearchBar: () => null,
}));

import { useAuthStore } from '@/store/authStore';
import { useBusinessAreas } from '@/hooks/useBusinessAreas';
import { useManagers } from '@/hooks/useManagers';
import { useCounterparties } from '@/hooks/useCounterparties';
import ContractsPage from '@/app/(dashboard)/contracts/page';

const loaded = { isSuccess: true, data: [{ id: 1 }] };
const empty = { isSuccess: true, data: [] };

const setUp = (role: string, counterparties = loaded) => {
  (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: { role } });
  (useBusinessAreas as jest.Mock).mockReturnValue(loaded);
  (useManagers as jest.Mock).mockReturnValue(loaded);
  (useCounterparties as jest.Mock).mockReturnValue(counterparties);
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ContractsPage opened from "Crea primo contratto" (?new=1)', () => {
  it('opens the new contract form for an ADMIN and drops the parameter', async () => {
    setUp('ADMIN');
    render(<ContractsPage />, { wrapper: createWrapper() });

    expect(await screen.findByText('Contract Form Stub')).toBeInTheDocument();
    expect(screen.getByText('Crea nuovo contratto')).toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith('/contracts');
  });

  it("doesn't open it while something the form needs is missing", async () => {
    setUp('ADMIN', empty);
    render(<ContractsPage />, { wrapper: createWrapper() });

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/contracts'));
    expect(screen.queryByText('Contract Form Stub')).not.toBeInTheDocument();
  });

  it("doesn't open it for a MANAGER, who can't create contracts", async () => {
    setUp('MANAGER');
    render(<ContractsPage />, { wrapper: createWrapper() });

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/contracts'));
    expect(screen.queryByText('Contract Form Stub')).not.toBeInTheDocument();
  });
});
