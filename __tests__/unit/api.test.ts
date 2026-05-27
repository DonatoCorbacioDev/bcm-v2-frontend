// Tests for lib/api.ts using jest.isolateModules so each test loads a fresh
// copy of the module with the desired env configuration.

const ORIGINAL_API_URL = process.env.NEXT_PUBLIC_API_URL;

describe('lib/api', () => {
  let reqSuccessFn: ((config: Record<string, unknown>) => Record<string, unknown>) | undefined;
  let reqErrorFn: ((error: unknown) => Promise<unknown>) | undefined;
  let resSuccessFn: ((response: unknown) => unknown) | undefined;
  let resErrorFn: ((error: unknown) => Promise<unknown>) | undefined;
  let mockCookiesGet: jest.Mock;
  let mockCookiesRemove: jest.Mock;

  function loadModule(url: string) {
    process.env.NEXT_PUBLIC_API_URL = url;

    mockCookiesGet = jest.fn();
    mockCookiesRemove = jest.fn();

    const mockInstance = {
      interceptors: {
        request: {
          use: jest.fn((success: typeof reqSuccessFn, error: typeof reqErrorFn) => {
            reqSuccessFn = success;
            reqErrorFn = error;
          }),
        },
        response: {
          use: jest.fn((success: typeof resSuccessFn, error: typeof resErrorFn) => {
            resSuccessFn = success;
            resErrorFn = error;
          }),
        },
      },
    };

    jest.doMock('axios', () => ({
      __esModule: true,
      default: { create: jest.fn(() => mockInstance) },
    }));

    jest.doMock('js-cookie', () => ({
      __esModule: true,
      default: { get: mockCookiesGet, remove: mockCookiesRemove },
    }));

    return { mod: require('@/lib/api') as { api: typeof mockInstance; default: typeof mockInstance }, instance: mockInstance };
  }

  beforeEach(() => {
    jest.resetModules();
    reqSuccessFn = undefined;
    reqErrorFn = undefined;
    resSuccessFn = undefined;
    resErrorFn = undefined;
  });

  afterEach(() => {
    if (ORIGINAL_API_URL !== undefined) {
      process.env.NEXT_PUBLIC_API_URL = ORIGINAL_API_URL;
    } else {
      delete process.env.NEXT_PUBLIC_API_URL;
    }
  });

  // ── Module-level checks ────────────────────────────────────────────────────

  it('throws when NEXT_PUBLIC_API_URL is not defined', () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    jest.doMock('axios', () => ({ __esModule: true, default: { create: jest.fn() } }));
    jest.doMock('js-cookie', () => ({ __esModule: true, default: { get: jest.fn(), remove: jest.fn() } }));
    expect(() => require('@/lib/api')).toThrow('NEXT_PUBLIC_API_URL is not defined');
  });

  it('exports api as named and default export', () => {
    const { mod, instance } = loadModule('http://localhost:8080');
    expect(mod.api).toBe(instance);
    expect(mod.default).toBe(instance);
  });

  // ── Request interceptor ────────────────────────────────────────────────────

  it('request interceptor adds Authorization header when token exists', () => {
    loadModule('http://localhost:8080');
    mockCookiesGet.mockReturnValue('mytoken');
    const config = { headers: {} as Record<string, string> };
    const result = reqSuccessFn!(config) as typeof config;
    expect(result.headers.Authorization).toBe('Bearer mytoken');
  });

  it('request interceptor skips Authorization when no token', () => {
    loadModule('http://localhost:8080');
    mockCookiesGet.mockReturnValue(undefined);
    const config = { headers: {} as Record<string, string> };
    reqSuccessFn!(config);
    expect(config.headers).not.toHaveProperty('Authorization');
  });

  it('request error handler rejects with the error', async () => {
    loadModule('http://localhost:8080');
    const error = new Error('network error');
    await expect(reqErrorFn!(error)).rejects.toBe(error);
  });

  // ── Response interceptor ───────────────────────────────────────────────────

  it('response success handler returns the response unchanged', () => {
    loadModule('http://localhost:8080');
    const response = { data: { id: 1 }, status: 200 };
    expect(resSuccessFn!(response)).toBe(response);
  });

  it('response error handler removes cookie on 401', async () => {
    loadModule('http://localhost:8080');
    const error = { response: { status: 401, data: null }, message: 'Unauthorized' };
    await expect(resErrorFn!(error)).rejects.toBe(error);
    expect(mockCookiesRemove).toHaveBeenCalledWith('auth_token');
  });

  it('response error handler does not remove cookie on non-401', async () => {
    loadModule('http://localhost:8080');
    const error = { response: { status: 500, data: null }, message: 'Server Error' };
    await expect(resErrorFn!(error)).rejects.toBe(error);
    expect(mockCookiesRemove).not.toHaveBeenCalled();
  });

  it('response error handler does not remove cookie when response is absent', async () => {
    loadModule('http://localhost:8080');
    const error = { response: undefined, message: 'Network Error' };
    await expect(resErrorFn!(error)).rejects.toBe(error);
    expect(mockCookiesRemove).not.toHaveBeenCalled();
  });
});
