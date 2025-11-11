/**
 * Check if code is running in browser context
 * @returns true if running in browser, false if server-side (SSR)
 */
const isBrowser = (): boolean => globalThis.window !== undefined;

/**
 * Get JWT token from localStorage
 * @returns JWT token string or null if not found
 */
export const getToken = (): string | null => {
  if (isBrowser()) {
    return localStorage.getItem('token');
  }
  return null;
};

/**
 * Save JWT token to both localStorage and cookie
 * localStorage: for client-side axios requests
 * Cookie: for server-side middleware authentication
 * @param token - JWT token string
 */
export const setToken = (token: string): void => {
  if (isBrowser()) {
    // Save to localStorage for axios interceptors
    localStorage.setItem('token', token);

    // Save to cookie for server-side middleware (7 days expiration)
    document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;
  }
};

/**
 * Remove JWT token from both localStorage and cookie
 */
export const removeToken = (): void => {
  if (isBrowser()) {
    // Remove from localStorage
    localStorage.removeItem('token');

    // Remove cookie by setting max-age to 0
    document.cookie = 'token=; path=/; max-age=0';
  }
};

/**
 * Check if user is authenticated (has valid token)
 * @returns true if token exists, false otherwise
 */
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

/**
 * Decode JWT token and extract user information
 * @returns User object with username and expiration, or null if invalid
 */
export const getUserFromToken = () => {
  const token = getToken();
  if (!token) return null;

  try {
    // Decode JWT payload (base64)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      username: payload.username,
      exp: payload.exp,
    };
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
};
