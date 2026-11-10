import React from 'react';
import { render, screen } from '@testing-library/react';

const replace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

// The page bodies aren't under test here, only who may open them.
jest.mock('@/components/contract-templates/ContractTemplateTable', () => ({
  __esModule: true,
  default: () => <div>templates table</div>,
}));
jest.mock('@/components/contract-templates/ContractTemplateForm', () => ({
  __esModule: true,
  default: () => null,
}));

import { useAuthStore } from '@/store/authStore';
import ContractTemplatesPage from '@/app/(dashboard)/contract-templates/page';
import FinancialValuesPage from '@/app/(dashboard)/financial-values/page';
import { uid } from "../mocks/ids";

const mockRole = (role: string) => {
  (useAuthStore as unknown as jest.Mock).mockImplementation((selector?: (s: unknown) => unknown) => {
    const state = { user: { id: uid(1), username: 'user', role } };
    return selector ? selector(state) : state;
  });
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Admin-only pages opened by URL', () => {
  it.each([
    ['Modelli di contratto', ContractTemplatesPage],
    ['Valori finanziari', FinancialValuesPage],
  ])('%s sends a Responsabile home and renders nothing', (_name, Page) => {
    mockRole('MANAGER');

    const { container } = render(<Page />);

    expect(replace).toHaveBeenCalledWith('/dashboard');
    expect(container).toBeEmptyDOMElement();
  });

  it('still opens for an Amministratore', () => {
    mockRole('ADMIN');

    render(<ContractTemplatesPage />);

    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Modelli di contratto' })).toBeInTheDocument();
    expect(screen.getByText('templates table')).toBeInTheDocument();
  });
});
