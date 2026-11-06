import { AxiosError, AxiosHeaders } from 'axios';
import { apiErrorMessage } from '@/lib/apiError';

const axiosError = (status: number, data: unknown) =>
  new AxiosError('failed', String(status), undefined, undefined, {
    status, statusText: '', headers: {}, config: { headers: new AxiosHeaders() }, data,
  });

describe('apiErrorMessage', () => {
  it('returns the backend message from a JSON body', async () => {
    await expect(apiErrorMessage(axiosError(403, { message: 'Accesso negato: no' }), 'fallback'))
      .resolves.toBe('Accesso negato: no');
  });

  it('reads the message from a Blob body (failed file downloads)', async () => {
    const blob = new Blob([JSON.stringify({ message: 'Accesso negato: demo' })], { type: 'application/json' });
    await expect(apiErrorMessage(axiosError(403, blob), 'fallback')).resolves.toBe('Accesso negato: demo');
  });

  it('falls back when there is no usable message', async () => {
    await expect(apiErrorMessage(axiosError(500, new Blob(['<html>'])), 'fallback')).resolves.toBe('fallback');
    await expect(apiErrorMessage(axiosError(500, undefined), 'fallback')).resolves.toBe('fallback');
    await expect(apiErrorMessage(new Error('boom'), 'fallback')).resolves.toBe('fallback');
  });

  it('says to wait on rate limiting', async () => {
    await expect(apiErrorMessage(axiosError(429, {}), 'fallback')).resolves.toBe('Troppi tentativi, riprova tra un minuto');
  });
});

describe('apiErrorMessage without a response', () => {
  it('falls back when the request never reached the backend (network error)', async () => {
    await expect(apiErrorMessage(new AxiosError('Network Error', 'ERR_NETWORK'), 'fallback')).resolves.toBe('fallback');
  });
});
