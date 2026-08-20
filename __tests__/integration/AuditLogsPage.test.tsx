import React from 'react';
import { render, screen } from '@testing-library/react';
import { createWrapper } from '../mocks/wrapper';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import AuditLogsPage from '@/app/(dashboard)/audit-logs/page';

const baseLog = {
  id: 1,
  action: 'CREATE',
  entityType: 'BusinessArea',
  entityId: 8,
  username: 'qa_sweep_admin',
  orgId: 1,
  timestamp: '2026-08-20T16:35:59Z',
  details: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: { role: 'ADMIN' } });
});

describe('AuditLogsPage — pagination count', () => {
  it('uses singular phrasing for exactly one result', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: { content: [baseLog], totalPages: 1, totalElements: 1, number: 0, size: 20 },
    });

    render(<AuditLogsPage />, { wrapper: createWrapper() });

    expect(await screen.findByText('1 risultato totale')).toBeInTheDocument();
    expect(screen.queryByText('1 risultati totali')).not.toBeInTheDocument();
  });

  it('uses plural phrasing for more than one result', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: { content: [baseLog], totalPages: 1, totalElements: 3, number: 0, size: 20 },
    });

    render(<AuditLogsPage />, { wrapper: createWrapper() });

    expect(await screen.findByText('3 risultati totali')).toBeInTheDocument();
  });
});
