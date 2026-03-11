// api.js — para endpoints de autenticación (login, refresh, logout, registro)
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // necesario para enviar/recibir la HttpOnly cookie
});

export default api;