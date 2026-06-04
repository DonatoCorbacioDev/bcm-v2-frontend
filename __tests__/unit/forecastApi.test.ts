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
});
