// Tests for lib/api.ts using jest.resetModules so each test loads a fresh
// copy of the module with the desired env configuration.

const ORIGINAL_API_URL = process.env.NEXT_PUBLIC_API_URL;

describe('lib/api', () => {
  let reqSuccessFn: ((config: Record<string, unknown>) => Record<string, unknown>) | undefined;
  let reqErrorFn: ((error: unknown) => Promise<unknown>) | undefined;
  let resSuccessFn: ((response: unknown) => unknown) | undefined;
  let resErrorFn: ((error: unknown) => Promise<unknown>) | undefined;
  let mockGetToken: jest.Mock;
  let mockSetAccessToken: jest.Mock;
  let mockClearAuth: jest.Mock;
  let mockAxiosPost: jest.Mock;

  function loadModule(url: string) {
    process.env.NEXT_PUBLIC_API_URL = url;

    mockGetToken = jest.fn();
    mockSetAccessToken = jest.fn();
    mockClearAuth = jest.fn();
    mockAxiosPost = jest.fn();

    jest.doMock('@/store/authStore', () => ({
      useAuthStore: {
        getState: () => ({
          getToken: mockGetToken,
          setAccessToken: mockSetAccessToken,
          clearAuth: mockClearAuth,
        }),
      },
    }));

    const mockInstance = {
      request: jest.fn(),
      defaults: { headers: { common: {} } },
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
      default: {
        create: jest.fn(() => mockInstance),
        post: mockAxiosPost,
      },
    }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
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
    mockGetToken.mockReturnValue('mytoken');
    const config = { headers: {} as Record<string, string> };
    const result = reqSuccessFn!(config) as typeof config;
    expect(result.headers.Authorization).toBe('Bearer mytoken');
  });

  it('request interceptor skips Authorization when no token', () => {
    loadModule('http://localhost:8080');
    mockGetToken.mockReturnValue(null);
    const config = { headers: {} as Record<string, string> };
    reqSuccessFn!(config);
    expect(config.headers).not.toHaveProperty('Authorization');
  });

  it('request error handler throws the error', () => {
    loadModule('http://localhost:8080');
    const error = new Error('network error');
    expect(() => reqErrorFn!(error)).toThrow(error);
  });

  // ── Response interceptor ───────────────────────────────────────────────────

  it('response success handler returns the response unchanged', () => {
    loadModule('http://localhost:8080');
    const response = { data: { id: 1 }, status: 200 };
    expect(resSuccessFn!(response)).toBe(response);
  });

  it('response error handler on 429 attaches userMessage and rejects', async () => {
    loadModule('http://localhost:8080');
    const error = { response: { status: 429, data: null }, message: 'Too Many Requests', config: {} };
    const rejected = resErrorFn!(error) as Promise<unknown>;
    await expect(rejected).rejects.toMatchObject({ userMessage: 'Troppi tentativi, riprova tra 1 minuto' });
  });

  it('response error handler on 401 calls refresh endpoint with credentials and no body', async () => {
    const { instance } = loadModule('http://localhost:8080');
    mockAxiosPost.mockResolvedValue({ data: { token: 'new-token' } });
    instance.request.mockResolvedValue({ data: 'retried' });

    const error = { response: { status: 401, data: null }, message: 'Unauthorized', config: { headers: {}, _retry: false } };
    await resErrorFn!(error);

    expect(mockAxiosPost).toHaveBeenCalledWith(
      'http://localhost:8080/auth/refresh',
      {},
      { withCredentials: true }
    );
    expect(mockSetAccessToken).toHaveBeenCalledWith('new-token');
    expect(instance.request).toHaveBeenCalled();
  });

  it('processQueue rejects queued requests when refresh fails', async () => {
    const { instance } = loadModule('http://localhost:8080');

    let rejectRefresh!: (e: unknown) => void;
    const refreshPending = new Promise((_, reject) => { rejectRefresh = reject; });
    mockAxiosPost.mockReturnValueOnce(refreshPending);
    instance.request.mockResolvedValue({ data: 'retried' });

    const error1 = { response: { status: 401, data: null }, message: 'Unauthorized', config: { _retry: false } };
    const error2 = { response: { status: 401, data: null }, message: 'Unauthorized', config: { headers: {}, _retry: false } };

    const promise1 = resErrorFn!(error1);
    const promise2 = resErrorFn!(error2); // queued — will hit reject(error) when refresh fails

    const refreshErr = new Error('refresh failed');
    rejectRefresh(refreshErr);

    await expect(promise1).rejects.toBe(refreshErr);
    await expect(promise2).rejects.toBe(refreshErr);
  });

  it('response error handler on 401 → refresh fails → clears auth and redirects', async () => {
    loadModule('http://localhost:8080');
    mockAxiosPost.mockRejectedValue(new Error('refresh failed'));

    const error = { response: { status: 401, data: null }, message: 'Unauthorized', config: { headers: {}, _retry: false } };
    await expect(resErrorFn!(error)).rejects.toThrow('refresh failed');
    expect(mockClearAuth).toHaveBeenCalled();
  });

  it('queues concurrent 401 requests when refresh is already in progress', async () => {
    const { instance } = loadModule('http://localhost:8080');

    let resolveRefresh!: (v: unknown) => void;
    const refreshPending = new Promise((resolve) => { resolveRefresh = resolve; });
    mockAxiosPost.mockReturnValueOnce(refreshPending);
    instance.request.mockResolvedValue({ data: 'retried' });

    // error1 has NO headers → direct refresh path covers `headers ?? {}` "undefined" branch
    // error2 HAS headers → queue path covers `headers ?? {}` "defined" branch
    const error1 = { response: { status: 401, data: null }, message: 'Unauthorized', config: { _retry: false } };
    const error2 = { response: { status: 401, data: null }, message: 'Unauthorized', config: { headers: {}, _retry: false } };

    const promise1 = resErrorFn!(error1);
    const promise2 = resErrorFn!(error2);

    resolveRefresh({ data: { token: 'new-token' } });

    await Promise.all([promise1, promise2]);
    expect(instance.request).toHaveBeenCalledTimes(2);
  });

  it('response error handler skips refresh on already-retried request', async () => {
    loadModule('http://localhost:8080');
    const error = { response: { status: 401, data: null }, message: 'Unauthorized', config: { _retry: true } };
    await expect(resErrorFn!(error)).rejects.toBe(error);
    expect(mockAxiosPost).not.toHaveBeenCalled();
  });

  it('response error handler does not act on non-401 non-429', async () => {
    loadModule('http://localhost:8080');
    const error = { response: { status: 500, data: null }, message: 'Server Error', config: {} };
    await expect(resErrorFn!(error)).rejects.toBe(error);
    expect(mockClearAuth).not.toHaveBeenCalled();
    expect(mockAxiosPost).not.toHaveBeenCalled();
  });

  it('response error handler does not act when response is absent', async () => {
    loadModule('http://localhost:8080');
    const error = { response: undefined, message: 'Network Error', config: {} };
    await expect(resErrorFn!(error)).rejects.toBe(error);
    expect(mockClearAuth).not.toHaveBeenCalled();
  });
});
