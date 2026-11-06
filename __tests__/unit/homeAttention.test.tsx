import { renderHook, waitFor } from '@testing-library/react';
import { createWrapper } from '../mocks/wrapper';

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

import api from '@/lib/api';
import { homeService } from '@/services/home.service';
import { homeQueryKeys, useHomeAttention } from '@/hooks/useHomeAttention';

const attention = {
  windowDays: 30,
  dueSoonCount: 2,
  invoicesToMatchCount: 1,
  ibanAlertsCount: 1,
  items: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  (api.get as jest.Mock).mockResolvedValue({ data: attention });
});

describe('homeService.getAttention', () => {
  it('reads the home page attention list from the backend', async () => {
    await expect(homeService.getAttention()).resolves.toEqual(attention);
    expect(api.get).toHaveBeenCalledWith('/home/attention');
  });
});

describe('useHomeAttention', () => {
  it('loads the attention list under its own cache key', async () => {
    const { result } = renderHook(() => useHomeAttention(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(attention);
    expect(homeQueryKeys.attention).toEqual(['home', 'attention']);
  });

  it('reports the error when the backend fails', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('down'));
    const { result } = renderHook(() => useHomeAttention(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
