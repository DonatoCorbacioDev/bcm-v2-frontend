// ─── Module mocks ────────────────────────────────────────────────────────────

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// ─── Imports that reference mocked modules ───────────────────────────────────

import api from '@/lib/api';
import { businessAreasService } from '@/services/businessAreas.service';
import { financialTypesService } from '@/services/financialTypes.service';
import { financialValuesService } from '@/services/financialValues.service';
import { managersService } from '@/services/managers.service';
import { usersService } from '@/services/users.service';
import { contractsService } from '@/services/contracts.service';
import { dashboardService } from '@/services/dashboard.service';
import { rolesService } from '@/services/roles.service';

const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;
const mockPut = api.put as jest.Mock;
const mockDelete = api.delete as jest.Mock;

beforeEach(() => jest.clearAllMocks());

// ─── businessAreasService ────────────────────────────────────────────────────

describe('businessAreasService', () => {
  it('list() calls GET /business-areas and returns data', async () => {
    const data = [{ id: 1, name: 'Eng', description: 'Eng' }];
    mockGet.mockResolvedValue({ data });
    const result = await businessAreasService.list();
    expect(mockGet).toHaveBeenCalledWith('/business-areas');
    expect(result).toEqual(data);
  });

  it('create() calls POST /business-areas with payload', async () => {
    const payload = { name: 'Eng', description: 'Engineering' };
    const data = { id: 1, ...payload };
    mockPost.mockResolvedValue({ data });
    const result = await businessAreasService.create(payload);
    expect(mockPost).toHaveBeenCalledWith('/business-areas', payload);
    expect(result).toEqual(data);
  });

  it('update() calls PUT /business-areas/:id with payload', async () => {
    const payload = { name: 'Eng Updated', description: 'Updated' };
    const data = { id: 1, ...payload };
    mockPut.mockResolvedValue({ data });
    const result = await businessAreasService.update(1, payload);
    expect(mockPut).toHaveBeenCalledWith('/business-areas/1', payload);
    expect(result).toEqual(data);
  });

  it('delete() calls DELETE /business-areas/:id', async () => {
    mockDelete.mockResolvedValue({});
    await businessAreasService.delete(1);
    expect(mockDelete).toHaveBeenCalledWith('/business-areas/1');
  });
});

// ─── financialTypesService ───────────────────────────────────────────────────

describe('financialTypesService', () => {
  it('list() calls GET /financial-types', async () => {
    const data = [{ id: 1, name: 'Revenue', description: 'Revenue' }];
    mockGet.mockResolvedValue({ data });
    const result = await financialTypesService.list();
    expect(mockGet).toHaveBeenCalledWith('/financial-types');
    expect(result).toEqual(data);
  });

  it('create() calls POST /financial-types', async () => {
    const payload = { name: 'Revenue', description: 'Revenue' };
    const data = { id: 1, ...payload };
    mockPost.mockResolvedValue({ data });
    const result = await financialTypesService.create(payload);
    expect(mockPost).toHaveBeenCalledWith('/financial-types', payload);
    expect(result).toEqual(data);
  });

  it('update() calls PUT /financial-types/:id', async () => {
    const payload = { name: 'Revenue', description: 'Revenue' };
    const data = { id: 1, ...payload };
    mockPut.mockResolvedValue({ data });
    const result = await financialTypesService.update(1, payload);
    expect(mockPut).toHaveBeenCalledWith('/financial-types/1', payload);
    expect(result).toEqual(data);
  });

  it('delete() calls DELETE /financial-types/:id', async () => {
    mockDelete.mockResolvedValue({});
    await financialTypesService.delete(1);
    expect(mockDelete).toHaveBeenCalledWith('/financial-types/1');
  });
});

// ─── financialValuesService ──────────────────────────────────────────────────

describe('financialValuesService', () => {
  it('list() calls GET /financial-values', async () => {
    const data = [{ id: 1, month: 1, year: 2024, financialAmount: 1000, financialTypeId: 1, businessAreaId: 1, contractId: 1 }];
    mockGet.mockResolvedValue({ data });
    const result = await financialValuesService.list();
    expect(mockGet).toHaveBeenCalledWith('/financial-values');
    expect(result).toEqual(data);
  });

  it('create() calls POST /financial-values', async () => {
    const payload = { month: 1, year: 2024, financialAmount: 1000, financialTypeId: 1, businessAreaId: 1, contractId: 1 };
    const data = { id: 1, ...payload };
    mockPost.mockResolvedValue({ data });
    const result = await financialValuesService.create(payload);
    expect(mockPost).toHaveBeenCalledWith('/financial-values', payload);
    expect(result).toEqual(data);
  });

  it('update() calls PUT /financial-values/:id', async () => {
    const payload = { month: 2, year: 2024, financialAmount: 2000, financialTypeId: 1, businessAreaId: 1, contractId: 1 };
    const data = { id: 1, ...payload };
    mockPut.mockResolvedValue({ data });
    const result = await financialValuesService.update(1, payload);
    expect(mockPut).toHaveBeenCalledWith('/financial-values/1', payload);
    expect(result).toEqual(data);
  });

  it('delete() calls DELETE /financial-values/:id', async () => {
    mockDelete.mockResolvedValue({});
    await financialValuesService.delete(1);
    expect(mockDelete).toHaveBeenCalledWith('/financial-values/1');
  });
});

// ─── managersService ─────────────────────────────────────────────────────────

describe('managersService', () => {
  const payload = { firstName: 'John', lastName: 'Doe', email: 'j@d.com', phoneNumber: '123', department: 'IT' };

  it('list() calls GET /managers', async () => {
    const data = [{ id: 1, ...payload }];
    mockGet.mockResolvedValue({ data });
    const result = await managersService.list();
    expect(mockGet).toHaveBeenCalledWith('/managers');
    expect(result).toEqual(data);
  });

  it('create() calls POST /managers', async () => {
    const data = { id: 1, ...payload };
    mockPost.mockResolvedValue({ data });
    const result = await managersService.create(payload);
    expect(mockPost).toHaveBeenCalledWith('/managers', payload);
    expect(result).toEqual(data);
  });

  it('update() calls PUT /managers/:id', async () => {
    const data = { id: 1, ...payload };
    mockPut.mockResolvedValue({ data });
    const result = await managersService.update(1, payload);
    expect(mockPut).toHaveBeenCalledWith('/managers/1', payload);
    expect(result).toEqual(data);
  });

  it('delete() calls DELETE /managers/:id', async () => {
    mockDelete.mockResolvedValue({});
    await managersService.delete(1);
    expect(mockDelete).toHaveBeenCalledWith('/managers/1');
  });
});

// ─── usersService ────────────────────────────────────────────────────────────

describe('usersService', () => {
  const payload = { username: 'user1', managerId: 1, roleId: 1, verified: true };

  it('list() calls GET /users', async () => {
    const data = [{ id: 1, username: 'user1' }];
    mockGet.mockResolvedValue({ data });
    const result = await usersService.list();
    expect(mockGet).toHaveBeenCalledWith('/users');
    expect(result).toEqual(data);
  });

  it('create() calls POST /users', async () => {
    const data = { id: 1, ...payload };
    mockPost.mockResolvedValue({ data });
    const result = await usersService.create(payload);
    expect(mockPost).toHaveBeenCalledWith('/users', payload);
    expect(result).toEqual(data);
  });

  it('update() calls PUT /users/:id', async () => {
    const data = { id: 1, ...payload };
    mockPut.mockResolvedValue({ data });
    const result = await usersService.update(1, payload);
    expect(mockPut).toHaveBeenCalledWith('/users/1', payload);
    expect(result).toEqual(data);
  });

  it('delete() calls DELETE /users/:id', async () => {
    mockDelete.mockResolvedValue({});
    await usersService.delete(1);
    expect(mockDelete).toHaveBeenCalledWith('/users/1');
  });

  it('invite() calls POST /users/invite', async () => {
    const invitePayload = { username: 'newuser', role: 'VIEWER', managerId: 1 };
    mockPost.mockResolvedValue({ data: undefined });
    await usersService.invite(invitePayload);
    expect(mockPost).toHaveBeenCalledWith('/users/invite', invitePayload);
  });
});

// ─── contractsService ────────────────────────────────────────────────────────

describe('contractsService', () => {
  const payload = {
    customerName: 'Acme', contractNumber: 'CNT-001', wbsCode: 'WBS-001',
    projectName: 'Project A', startDate: '2024-01-01', endDate: '2024-12-31',
    status: 'ACTIVE' as const, areaId: 1, managerId: 1,
  };

  it('list() calls GET /contracts', async () => {
    const data = [{ id: 1, ...payload }];
    mockGet.mockResolvedValue({ data });
    const result = await contractsService.list();
    expect(mockGet).toHaveBeenCalledWith('/contracts');
    expect(result).toEqual(data);
  });

  it('create() calls POST /contracts', async () => {
    const data = { id: 1, ...payload };
    mockPost.mockResolvedValue({ data });
    const result = await contractsService.create(payload);
    expect(mockPost).toHaveBeenCalledWith('/contracts', payload);
    expect(result).toEqual(data);
  });

  it('update() calls PUT /contracts/:id', async () => {
    const data = { id: 1, ...payload };
    mockPut.mockResolvedValue({ data });
    const result = await contractsService.update(1, payload);
    expect(mockPut).toHaveBeenCalledWith('/contracts/1', payload);
    expect(result).toEqual(data);
  });

  it('getById() calls GET /contracts/:id', async () => {
    const data = { id: 1, ...payload };
    mockGet.mockResolvedValue({ data });
    const result = await contractsService.getById(1);
    expect(mockGet).toHaveBeenCalledWith('/contracts/1');
    expect(result).toEqual(data);
  });

  it('delete() calls DELETE /contracts/:id', async () => {
    mockDelete.mockResolvedValue({});
    await contractsService.delete(1);
    expect(mockDelete).toHaveBeenCalledWith('/contracts/1');
  });

  it('searchPaged() calls GET /contracts/search with default params', async () => {
    const data = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 };
    mockGet.mockResolvedValue({ data });
    await contractsService.searchPaged({});
    expect(mockGet).toHaveBeenCalledWith('/contracts/search?page=0&size=10');
  });

  it('searchPaged() appends query and status params', async () => {
    const data = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 };
    mockGet.mockResolvedValue({ data });
    await contractsService.searchPaged({ query: 'acme', status: 'ACTIVE', page: 1, size: 5 });
    const call = mockGet.mock.calls[0][0] as string;
    expect(call).toContain('q=acme');
    expect(call).toContain('status=ACTIVE');
    expect(call).toContain('page=1');
  });

  it('exportExcel() calls GET /contracts/export/excel with blob responseType', async () => {
    const blob = new Blob(['data']);
    mockGet.mockResolvedValue({ data: blob });
    const result = await contractsService.exportExcel();
    expect(mockGet).toHaveBeenCalledWith('/contracts/export/excel', { responseType: 'blob' });
    expect(result).toBe(blob);
  });

  it('exportPdf() calls GET /contracts/export/pdf with blob responseType', async () => {
    const blob = new Blob(['data']);
    mockGet.mockResolvedValue({ data: blob });
    const result = await contractsService.exportPdf();
    expect(mockGet).toHaveBeenCalledWith('/contracts/export/pdf', { responseType: 'blob' });
    expect(result).toBe(blob);
  });

  it('getContractsByArea() calls GET /contracts/stats/by-area', async () => {
    const data = [{ areaName: 'Eng', count: 5 }];
    mockGet.mockResolvedValue({ data });
    const result = await contractsService.getContractsByArea();
    expect(mockGet).toHaveBeenCalledWith('/contracts/stats/by-area');
    expect(result).toEqual(data);
  });

  it('getContractsTimeline() calls GET /contracts/stats/timeline', async () => {
    const data = [{ month: '2024-01', count: 3 }];
    mockGet.mockResolvedValue({ data });
    const result = await contractsService.getContractsTimeline();
    expect(mockGet).toHaveBeenCalledWith('/contracts/stats/timeline');
    expect(result).toEqual(data);
  });

  it('getTopManagers() calls GET /contracts/stats/top-managers', async () => {
    const data = [{ managerName: 'John', contractsCount: 10 }];
    mockGet.mockResolvedValue({ data });
    const result = await contractsService.getTopManagers();
    expect(mockGet).toHaveBeenCalledWith('/contracts/stats/top-managers');
    expect(result).toEqual(data);
  });
});

// ─── dashboardService ────────────────────────────────────────────────────────

describe('dashboardService', () => {
  it('getStats() calls GET /contracts/stats', async () => {
    const data = { total: 10, active: 5, expiring: 2, expired: 3 };
    mockGet.mockResolvedValue({ data });
    const result = await dashboardService.getStats();
    expect(mockGet).toHaveBeenCalledWith('/contracts/stats');
    expect(result).toEqual(data);
  });
});

// ─── rolesService ────────────────────────────────────────────────────────────

describe('rolesService', () => {
  it('list() calls GET /roles', async () => {
    const data = [{ id: 1, name: 'ADMIN' }];
    mockGet.mockResolvedValue({ data });
    const result = await rolesService.list();
    expect(mockGet).toHaveBeenCalledWith('/roles');
    expect(result).toEqual(data);
  });
});
