// api.js — para endpoints de autenticación (login, refresh, logout, registro)
import axios from 'axios';
import { encryptPayload, hasEncryptionKey } from './encryptionService';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // necesario para enviar/recibir la HttpOnly cookie
});

api.interceptors.request.use(async (config) => {
  if (!config.encrypt) {
    return config;
  }

  if (!hasEncryptionKey()) {
    throw new Error('No se pudo procesar la solicitud en este momento.');
  }

  config.data = await encryptPayload(config.data || {});
  config.headers = {
    ...config.headers,
    'X-Encrypted': 'true',
  };

  return config;
});

export default api;