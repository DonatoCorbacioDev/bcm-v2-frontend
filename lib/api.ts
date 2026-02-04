import axios from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is not defined. Please check your .env.local file."
  );
}

// Allow HTTP for localhost/127.0.0.1, require HTTPS for external domains
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
    const token = Cookies.get("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove("auth_token");
      if (globalThis.window !== undefined) {
        globalThis.window.location.href = "/login";
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.error("API Error:", error.response?.data || error.message);
    }

    return Promise.reject(error);
  }
);

export default api;