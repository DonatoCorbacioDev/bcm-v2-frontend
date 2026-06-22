import axios, { AxiosError } from "axios";
import { useAuthStore } from "@/store/authStore";

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
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().getToken();
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

function processQueue(error: unknown, token: string | null) {
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
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    }).then((token) => {
      /* istanbul ignore next */
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return api.request(originalRequest);
    });
  }

  originalRequest._retry = true;
  isRefreshing = true;

  try {
    // No body needed: the refresh_token cookie (HttpOnly, set by the backend
    // on login) is sent automatically because withCredentials is true.
    const response = await axios.post<{ token: string }>(
      `${API_URL}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    const { token } = response.data;
    useAuthStore.getState().setAccessToken(token);
    processQueue(null, token);
    originalRequest.headers = originalRequest.headers ?? {};
    originalRequest.headers.Authorization = `Bearer ${token}`;
    return api.request(originalRequest);
  } catch (refreshError) {
    processQueue(refreshError, null);
    useAuthStore.getState().clearAuth();
    redirectToLogin();
    throw refreshError;
  } finally {
    isRefreshing = false;
  }
}

export default api;
