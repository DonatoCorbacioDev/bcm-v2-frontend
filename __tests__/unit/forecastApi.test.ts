import { forecastApi } from '@/lib/forecastApi';

describe('forecastApi', () => {
  it('is defined and has a baseURL', () => {
    expect(forecastApi).toBeDefined();
    expect(forecastApi.defaults.baseURL).toBeDefined();
  });

  it('uses fallback URL when env var is not set', () => {
    expect(forecastApi.defaults.baseURL).toMatch(/localhost:8000|http/);
  });

  it('has correct timeout', () => {
    expect(forecastApi.defaults.timeout).toBe(8000);
  });

  it('uses NEXT_PUBLIC_FORECAST_URL when defined', () => {
    jest.resetModules();
    process.env.NEXT_PUBLIC_FORECAST_URL = 'http://my-fastapi:9000';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { forecastApi: freshApi } = require('@/lib/forecastApi');
    expect(freshApi.defaults.baseURL).toBe('http://my-fastapi:9000');
    delete process.env.NEXT_PUBLIC_FORECAST_URL;
  });
});
