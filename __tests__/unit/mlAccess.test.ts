import { AxiosError, AxiosHeaders } from 'axios';
import { isMlTierForbidden } from '@/lib/mlAccess';

const axiosErrorWithStatus = (status: number) =>
  new AxiosError('failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status, statusText: '', data: {}, headers: {}, config: { headers: new AxiosHeaders() },
  });

describe('isMlTierForbidden', () => {
  it('is true for a 403 from the ML tier check', () => {
    expect(isMlTierForbidden(axiosErrorWithStatus(403))).toBe(true);
  });

  it('is false for other HTTP errors', () => {
    expect(isMlTierForbidden(axiosErrorWithStatus(500))).toBe(false);
  });

  it('is false when the request never got a response (backend down, network)', () => {
    expect(isMlTierForbidden(new AxiosError('Network Error', 'ERR_NETWORK'))).toBe(false);
  });

  it('is false for errors that are not from axios', () => {
    expect(isMlTierForbidden(new Error('boom'))).toBe(false);
  });
});
