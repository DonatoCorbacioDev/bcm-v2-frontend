import { renderHook, waitFor, act } from '@testing-library/react';
import { createWrapper } from '../mocks/wrapper';

// ─── Service mocks ────────────────────────────────────────────────────────────

jest.mock('@/services/businessAreas.service', () => ({
  businessAreasService: { list: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
}));
jest.mock('@/services/financialTypes.service', () => ({
  financialTypesService: { list: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
}));
jest.mock('@/services/financialValues.service', () => ({
  financialValuesService: { list: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
}));
jest.mock('@/services/managers.service', () => ({
  managersService: { list: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
}));
jest.mock('@/services/users.service', () => ({
  usersService: { list: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), invite: jest.fn() },
}));
jest.mock('@/services/roles.service', () => ({
  rolesService: { list: jest.fn() },
}));
jest.mock('@/services/contracts.service', () => ({
  contractsService: {
    list: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(),
    getById: jest.fn(), searchPaged: jest.fn(),
    getContractsByArea: jest.fn(), getContractsTimeline: jest.fn(), getTopManagers: jest.fn(),
  },
}));
jest.mock('@/services/dashboard.service', () => ({
  dashboardService: { getStats: jest.fn() },
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(() => ({
    setAuth: jest.fn(),
    clearAuth: jest.fn(),
    user: null,
    isAuthenticated: false,
  })),
}));

jest.mock('@/lib/api', () => {
  const mockApi = {
    post: jest.fn(),
    get: jest.fn(),
    defaults: { headers: { common: {} } },
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  };
  return { __esModule: true, default: mockApi, api: mockApi };
});

// ─── Imports that reference mocked modules ───────────────────────────────────

import { businessAreasService } from '@/services/businessAreas.service';
import { financialTypesService } from '@/services/financialTypes.service';
import { financialValuesService } from '@/services/financialValues.service';
import { managersService } from '@/services/managers.service';
import { usersService } from '@/services/users.service';
import { rolesService } from '@/services/roles.service';
import { contractsService } from '@/services/contracts.service';
import { dashboardService } from '@/services/dashboard.service';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

import { useBusinessAreas } from '@/hooks/useBusinessAreas';
import { useFinancialTypes } from '@/hooks/useFinancialTypes';
import { useFinancialValues } from '@/hooks/useFinancialValues';
import { useManagers } from '@/hooks/useManagers';
import { useRoles } from '@/hooks/useRoles';
import { useUsers } from '@/hooks/useUsers';
import { useContracts } from '@/hooks/useContracts';
import { useContractsByArea } from '@/hooks/useContractsByArea';
import { useContractsTimeline } from '@/hooks/useContractsTimeline';
import { useTopManagers } from '@/hooks/useTopManagers';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useContractsPaged } from '@/hooks/useContractsPaged';
import { useContract } from '@/hooks/useContract';
import { useExpiringContracts } from '@/hooks/useExpiringContracts';
import { useUpsertBusinessArea } from '@/hooks/useUpsertBusinessArea';
import { useUpsertFinancialType } from '@/hooks/useUpsertFinancialType';
import { useUpsertFinancialValue } from '@/hooks/useUpsertFinancialValue';
import { useUpsertManager } from '@/hooks/useUpsertManager';
import { useUpsertUser } from '@/hooks/useUpsertUser';
import { useUpsertContract } from '@/hooks/useUpsertContract';
import { useAuth } from '@/hooks/useAuth';

beforeEach(() => jest.clearAllMocks());

// ─── Simple query hooks ───────────────────────────────────────────────────────

describe('useBusinessAreas', () => {
  it('fetches and returns data', async () => {
    const data = [{ id: 1, name: 'Eng', description: 'Eng' }];
    (businessAreasService.list as jest.Mock).mockResolvedValue(data);
    const { result } = renderHook(() => useBusinessAreas(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });
});

describe('useFinancialTypes', () => {
  it('fetches and returns data', async () => {
    const data = [{ id: 1, name: 'Revenue', description: 'Revenue' }];
    (financialTypesService.list as jest.Mock).mockResolvedValue(data);
    const { result } = renderHook(() => useFinancialTypes(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });
});

describe('useFinancialValues', () => {
  it('fetches and returns data', async () => {
    const data = [{ id: 1, month: 1, year: 2024, financialAmount: 1000, financialTypeId: 1, businessAreaId: 1, contractId: 1 }];
    (financialValuesService.list as jest.Mock).mockResolvedValue(data);
    const { result } = renderHook(() => useFinancialValues(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });
});

describe('useManagers', () => {
  it('fetches and returns data', async () => {
    const data = [{ id: 1, firstName: 'John', lastName: 'Doe', email: 'j@d.com', phoneNumber: '123', department: 'IT' }];
    (managersService.list as jest.Mock).mockResolvedValue(data);
    const { result } = renderHook(() => useManagers(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });
});

describe('useRoles', () => {
  it('fetches and returns data', async () => {
    const data = [{ id: 1, role: 'ADMIN' }];
    (rolesService.list as jest.Mock).mockResolvedValue(data);
    const { result } = renderHook(() => useRoles(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });
});

describe('useUsers', () => {
  it('fetches and returns data', async () => {
    const data = [{ id: 1, username: 'user1' }];
    (usersService.list as jest.Mock).mockResolvedValue(data);
    const { result } = renderHook(() => useUsers(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });
});

describe('useContracts', () => {
  it('fetches and returns data', async () => {
    const data = [{ id: 1, customerName: 'Acme' }];
    (contractsService.list as jest.Mock).mockResolvedValue(data);
    const { result } = renderHook(() => useContracts(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });
});

describe('useContractsByArea', () => {
  it('fetches and returns data', async () => {
    const data = [{ areaName: 'Eng', count: 5 }];
    (contractsService.getContractsByArea as jest.Mock).mockResolvedValue(data);
    const { result } = renderHook(() => useContractsByArea(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });
});

describe('useContractsTimeline', () => {
  it('fetches and returns data', async () => {
    const data = [{ month: '2024-01', count: 3 }];
    (contractsService.getContractsTimeline as jest.Mock).mockResolvedValue(data);
    const { result } = renderHook(() => useContractsTimeline(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });
});

describe('useTopManagers', () => {
  it('fetches and returns data', async () => {
    const data = [{ managerName: 'John', contractsCount: 10 }];
    (contractsService.getTopManagers as jest.Mock).mockResolvedValue(data);
    const { result } = renderHook(() => useTopManagers(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });
});

describe('useDashboardStats', () => {
  it('fetches and returns stats', async () => {
    const data = { total: 10, active: 5, expiring: 2, expired: 3 };
    (dashboardService.getStats as jest.Mock).mockResolvedValue(data);
    const { result } = renderHook(() => useDashboardStats(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });
});

describe('useContractsPaged', () => {
  it('fetches paged data with params', async () => {
    const data = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 };
    (contractsService.searchPaged as jest.Mock).mockResolvedValue(data);
    const params = { page: 0, size: 10 };
    const { result } = renderHook(() => useContractsPaged(params), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });
});

describe('useContract', () => {
  it('fetches contract when id > 0', async () => {
    const data = { id: 1, customerName: 'Acme' };
    (contractsService.getById as jest.Mock).mockResolvedValue(data);
    const { result } = renderHook(() => useContract(1), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });

  it('is disabled when id is 0', () => {
    const { result } = renderHook(() => useContract(0), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useExpiringContracts', () => {
  it('fetches expiring contracts', async () => {
    const data = [{ id: 1, customerName: 'Acme' }];
    (api.get as jest.Mock).mockResolvedValue({ data });
    const { result } = renderHook(() => useExpiringContracts(30), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });

  it('uses default days=30 when called without arguments', async () => {
    const data = [{ id: 2, customerName: 'Beta' }];
    (api.get as jest.Mock).mockResolvedValue({ data });
    const { result } = renderHook(() => useExpiringContracts(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/contracts/expiring?days=30');
  });
});

// ─── Mutation hooks ───────────────────────────────────────────────────────────

describe('useUpsertBusinessArea', () => {
  it('calls create when no id is provided', async () => {
    const created = { id: 1, name: 'Eng', description: 'Eng' };
    (businessAreasService.create as jest.Mock).mockResolvedValue(created);
    const { result } = renderHook(() => useUpsertBusinessArea(), { wrapper: createWrapper() });
    await act(async () => {
      await result.current.mutateAsync({ payload: { name: 'Eng', description: 'Eng' } });
    });
    expect(businessAreasService.create).toHaveBeenCalledWith({ name: 'Eng', description: 'Eng' });
  });

  it('calls update when id is provided', async () => {
    const updated = { id: 1, name: 'Eng', description: 'Eng' };
    (businessAreasService.update as jest.Mock).mockResolvedValue(updated);
    const { result } = renderHook(() => useUpsertBusinessArea(), { wrapper: createWrapper() });
    await act(async () => {
      await result.current.mutateAsync({ id: 1, payload: { name: 'Eng', description: 'Eng' } });
    });
    expect(businessAreasService.update).toHaveBeenCalledWith(1, { name: 'Eng', description: 'Eng' });
  });
});

describe('useUpsertFinancialType', () => {
  it('calls create when no id is provided', async () => {
    (financialTypesService.create as jest.Mock).mockResolvedValue({ id: 1, name: 'Rev', description: 'Rev' });
    const { result } = renderHook(() => useUpsertFinancialType(), { wrapper: createWrapper() });
    await act(async () => {
      await result.current.mutateAsync({ payload: { name: 'Rev', description: 'Rev' } });
    });
    expect(financialTypesService.create).toHaveBeenCalled();
  });

  it('calls update when id is provided', async () => {
    (financialTypesService.update as jest.Mock).mockResolvedValue({ id: 1, name: 'Rev', description: 'Rev' });
    const { result } = renderHook(() => useUpsertFinancialType(), { wrapper: createWrapper() });
    await act(async () => {
      await result.current.mutateAsync({ id: 1, payload: { name: 'Rev', description: 'Rev' } });
    });
    expect(financialTypesService.update).toHaveBeenCalledWith(1, { name: 'Rev', description: 'Rev' });
  });
});

describe('useUpsertFinancialValue', () => {
  const payload = { month: 1, year: 2024, financialAmount: 1000, financialTypeId: 1, businessAreaId: 1, contractId: 1 };

  it('calls create in create mode', async () => {
    (financialValuesService.create as jest.Mock).mockResolvedValue({ id: 1, ...payload });
    const { result } = renderHook(() => useUpsertFinancialValue(), { wrapper: createWrapper() });
    await act(async () => {
      await result.current.mutateAsync({ mode: 'create', payload });
    });
    expect(financialValuesService.create).toHaveBeenCalledWith(payload);
  });

  it('calls update in update mode', async () => {
    (financialValuesService.update as jest.Mock).mockResolvedValue({ id: 1, ...payload });
    const { result } = renderHook(() => useUpsertFinancialValue(), { wrapper: createWrapper() });
    await act(async () => {
      await result.current.mutateAsync({ mode: 'update', id: 1, payload });
    });
    expect(financialValuesService.update).toHaveBeenCalledWith(1, payload);
  });
});

describe('useUpsertManager', () => {
  const payload = { firstName: 'John', lastName: 'Doe', email: 'j@d.com', phoneNumber: '123', department: 'IT' };

  it('calls create in create mode', async () => {
    (managersService.create as jest.Mock).mockResolvedValue({ id: 1, ...payload });
    const { result } = renderHook(() => useUpsertManager(), { wrapper: createWrapper() });
    await act(async () => {
      await result.current.mutateAsync({ mode: 'create', payload });
    });
    expect(managersService.create).toHaveBeenCalledWith(payload);
  });

  it('calls update in update mode', async () => {
    (managersService.update as jest.Mock).mockResolvedValue({ id: 1, ...payload });
    const { result } = renderHook(() => useUpsertManager(), { wrapper: createWrapper() });
    await act(async () => {
      await result.current.mutateAsync({ mode: 'update', id: 1, payload });
    });
    expect(managersService.update).toHaveBeenCalledWith(1, payload);
  });
});

describe('useUpsertUser', () => {
  const payload = { username: 'user1', managerId: 1, roleId: 1, verified: true };

  it('calls create when no id is provided', async () => {
    (usersService.create as jest.Mock).mockResolvedValue({ id: 1, ...payload });
    const { result } = renderHook(() => useUpsertUser(), { wrapper: createWrapper() });
    await act(async () => {
      await result.current.mutateAsync({ payload });
    });
    expect(usersService.create).toHaveBeenCalledWith(payload);
  });

  it('calls update when id is provided', async () => {
    (usersService.update as jest.Mock).mockResolvedValue({ id: 1, ...payload });
    const { result } = renderHook(() => useUpsertUser(), { wrapper: createWrapper() });
    await act(async () => {
      await result.current.mutateAsync({ id: 1, payload });
    });
    expect(usersService.update).toHaveBeenCalledWith(1, payload);
  });
});

describe('useUpsertContract', () => {
  const payload = {
    customerName: 'Acme', contractNumber: 'CNT-001', wbsCode: 'WBS-001',
    projectName: 'Proj A', startDate: '2024-01-01', endDate: '2024-12-31',
    status: 'ACTIVE' as const, areaId: 1, managerId: 1,
  };

  it('calls create in create mode', async () => {
    (contractsService.create as jest.Mock).mockResolvedValue({ id: 1, ...payload });
    const { result } = renderHook(() => useUpsertContract(), { wrapper: createWrapper() });
    await act(async () => {
      await result.current.mutateAsync({ mode: 'create', payload });
    });
    expect(contractsService.create).toHaveBeenCalledWith(payload);
  });

  it('calls update in update mode', async () => {
    (contractsService.update as jest.Mock).mockResolvedValue({ id: 1, ...payload });
    const { result } = renderHook(() => useUpsertContract(), { wrapper: createWrapper() });
    await act(async () => {
      await result.current.mutateAsync({ mode: 'update', id: 1, payload });
    });
    expect(contractsService.update).toHaveBeenCalledWith(1, payload);
  });
});

// ─── useAuth ─────────────────────────────────────────────────────────────────

describe('useAuth', () => {
  it('logout calls clearAuth', () => {
    const mockClearAuth = jest.fn();
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      setAuth: jest.fn(), clearAuth: mockClearAuth,
      user: null, isAuthenticated: false,
    });
    const { result } = renderHook(() => useAuth());
    act(() => { result.current.logout(); });
    expect(mockClearAuth).toHaveBeenCalled();
  });

  it('login succeeds and calls setAuth', async () => {
    const mockSetAuth = jest.fn();
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      setAuth: mockSetAuth, clearAuth: jest.fn(),
      user: null, isAuthenticated: false,
    });
    (api.post as jest.Mock).mockResolvedValue({ data: { token: 'abc123' } });
    (api.get as jest.Mock).mockResolvedValue({ data: { id: 1, username: 'alice', role: 'ADMIN' } });
    const { result } = renderHook(() => useAuth());
    let success: boolean | undefined;
    await act(async () => { success = await result.current.login({ username: 'alice', password: 'pw' }); });
    expect(success).toBe(true);
    expect(mockSetAuth).toHaveBeenCalled();
  });

  it('login fails and sets error message from response', async () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      setAuth: jest.fn(), clearAuth: jest.fn(),
      user: null, isAuthenticated: false,
    });
    (api.post as jest.Mock).mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });
    const { result } = renderHook(() => useAuth());
    let success: boolean | undefined;
    await act(async () => { success = await result.current.login({ username: 'alice', password: 'wrong' }); });
    expect(success).toBe(false);
    expect(result.current.error).toBe('Invalid credentials');
  });

  it('login fails with fallback message when response has no message', async () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      setAuth: jest.fn(), clearAuth: jest.fn(),
      user: null, isAuthenticated: false,
    });
    (api.post as jest.Mock).mockRejectedValue({ response: { data: {} } });
    const { result } = renderHook(() => useAuth());
    let success: boolean | undefined;
    await act(async () => { success = await result.current.login({ username: 'alice', password: 'wrong' }); });
    expect(success).toBe(false);
    expect(result.current.error).toBe('Login failed. Please try again.');
  });
});
