import React from 'react';
import { render, screen } from '@testing-library/react';
import { createWrapper } from '../mocks/wrapper';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/hooks/useBusinessAreas', () => ({
  useBusinessAreas: jest.fn(),
}));

jest.mock('@/hooks/useManagers', () => ({
  useManagers: jest.fn(),
}));

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
  default: () => <div>Contract Import Dialog Stub</div>,
}));

jest.mock('@/components/contracts/SemanticSearchBar', () => ({
  SemanticSearchBar: () => <div>Semantic Search Stub</div>,
}));

import { useAuthStore } from '@/store/authStore';
import { useBusinessAreas } from '@/hooks/useBusinessAreas';
import { useManagers } from '@/hooks/useManagers';
import ContractsPage from '@/app/(dashboard)/contracts/page';

const nonEmptyQuery = { isSuccess: true, data: [{ id: 1 }] };

beforeEach(() => {
  jest.clearAllMocks();
  (useBusinessAreas as jest.Mock).mockReturnValue(nonEmptyQuery);
  (useManagers as jest.Mock).mockReturnValue(nonEmptyQuery);
});

describe('ContractsPage — create button authorization', () => {
  it('hides "+ Nuovo contratto" for a MANAGER — POST /contracts is ADMIN-only server-side', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: { role: 'MANAGER' } });
    render(<ContractsPage />, { wrapper: createWrapper() });

    expect(screen.queryByRole('button', { name: '+ Nuovo contratto' })).not.toBeInTheDocument();
  });

  it('shows "+ Nuovo contratto" for an ADMIN', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: { role: 'ADMIN' } });
    render(<ContractsPage />, { wrapper: createWrapper() });

    expect(screen.getByRole('button', { name: '+ Nuovo contratto' })).toBeInTheDocument();
  });
});
