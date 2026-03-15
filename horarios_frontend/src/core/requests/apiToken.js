// apiToken.js — para endpoints protegidos (requieren autenticación)
import axios from "axios";

const apiToken = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
  withCredentials: true,
});

// Cola de requests que esperan mientras se renueva el token
let isRefreshing = false;
let refreshSubscribers = [];
const onRefreshed = () => { refreshSubscribers.forEach((cb) => cb(null)); };
const onRefreshFailed = (error) => { refreshSubscribers.forEach((cb) => cb(error)); };
const addSubscriber = (cb) => refreshSubscribers.push(cb);

apiToken.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {};
    const requestUrl = original.url || "";

    // Evita bucle infinito si falla el propio refresh
    if (requestUrl.includes('/api/v1/auth/refresh/')) {
      window.location.href = "/login";
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Encola el request hasta que el refresh termine
      return new Promise((resolve, reject) => {
        addSubscriber((refreshError) => {
          if (refreshError) {
            reject(refreshError);
            return;
          }
          resolve(apiToken(original));
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      await apiToken.post("/api/v1/auth/refresh/");
      onRefreshed();
      refreshSubscribers = [];
      isRefreshing = false;
      return apiToken(original);
    } catch {
      onRefreshFailed(error);
      refreshSubscribers = [];
      isRefreshing = false;
      window.location.href = "/login";
      return Promise.reject(error);
    }
  }
);

export default apiToken;