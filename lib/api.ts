import axios from 'axios';

/**
 * Axios instance configured for BCM v2 API
 * Base URL: http://localhost:8090/api/v1 (development)
 * Automatically adds JWT token to all requests via interceptors
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor: Add JWT token to Authorization header
 * Token is retrieved from localStorage (set by lib/auth.ts)
 */
api.interceptors.request.use(
  (config) => {
    if (globalThis.window !== undefined) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor: Handle 401 Unauthorized errors
 * Automatically clears tokens and redirects to login page
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (globalThis.window !== undefined) {
        // Remove token from localStorage
        localStorage.removeItem('token');

        // Remove token from cookie
        globalThis.window.document.cookie = 'token=; path=/; max-age=0';

        // Redirect to login page
        globalThis.window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
