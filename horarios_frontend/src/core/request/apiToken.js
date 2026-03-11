// apiToken.js — para endpoints protegidos (requieren autenticación)
import axios from "axios";
import { getAccessToken, setAccessToken, clearAccessToken } from "./tokenStore";

const apiToken = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
  withCredentials: true, // envía la HttpOnly cookie al renovar el token
});

// Adjunta el access token en memoria en cada request
apiToken.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

// Cola de requests que esperan mientras se renueva el token
let isRefreshing = false;
let refreshSubscribers = [];
const onRefreshed = (token) => { refreshSubscribers.forEach((cb) => cb(token)); };
const addSubscriber = (cb) => refreshSubscribers.push(cb);

apiToken.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Encola el request hasta que el refresh termine
      return new Promise((resolve) => {
        addSubscriber((token) => {
          original.headers["Authorization"] = `Bearer ${token}`;
          resolve(apiToken(original));
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await apiToken.post("/api/v1/auth/refresh/");
      const newToken = data.data.access;
      setAccessToken(newToken);
      onRefreshed(newToken);
      refreshSubscribers = [];
      isRefreshing = false;
      original.headers["Authorization"] = `Bearer ${newToken}`;
      return apiToken(original);
    } catch {
      clearAccessToken();
      refreshSubscribers = [];
      isRefreshing = false;
      window.location.href = "/login";
      return Promise.reject(error);
    }
  }
);

export default apiToken;