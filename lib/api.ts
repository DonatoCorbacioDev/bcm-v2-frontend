import axios, { AxiosError } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is not defined. Please check your .env.local file."
  );
}

/* istanbul ignore next */
if (
  process.env.NODE_ENV === "production" &&
  API_URL.startsWith("http://") &&
  !API_URL.includes("localhost") &&
  !API_URL.includes("127.0.0.1")
) {
  throw new Error(
    "Production API must use HTTPS for external domains. Check NEXT_PUBLIC_API_URL in your .env file."
  );
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => { throw error; }
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
}

function redirectToLogin() {
  /* istanbul ignore else */
  if (globalThis.window !== undefined) {
    globalThis.window.location.href = "/login";
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError & { userMessage?: string }) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status === 429) {
      error.userMessage = "Troppi tentativi, riprova tra 1 minuto";
      throw error;
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      return handle401(error, originalRequest);
    }

    /* istanbul ignore next */
    if (process.env.NODE_ENV === "development") {
      console.error("API Error:", error.response?.data || error.message);
    }

    throw error;
  }
);

async function handle401(
  error: AxiosError,
  originalRequest: NonNullable<typeof error.config> & { _retry?: boolean }
) {
  const refreshToken = localStorage.getItem("auth_refresh_token");

  if (!refreshToken) {
    localStorage.removeItem("auth_token");
    redirectToLogin();
    throw error;
  }

  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    }).then((token) => {
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return api.request(originalRequest);
    });
  }

  originalRequest._retry = true;
  isRefreshing = true;

  try {
    const response = await axios.post<{ token: string; refreshToken: string }>(
      `${API_URL}/auth/refresh`,
      { refreshToken }
    );
    const { token, refreshToken: newRefreshToken } = response.data;
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_refresh_token", newRefreshToken);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    processQueue(null, token);
    originalRequest.headers = originalRequest.headers ?? {};
    originalRequest.headers.Authorization = `Bearer ${token}`;
    return api.request(originalRequest);
  } catch (refreshError) {
    processQueue(refreshError, null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_refresh_token");
    redirectToLogin();
    throw refreshError;
  } finally {
    isRefreshing = false;
  }
}

export default api;
