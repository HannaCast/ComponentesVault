import api from "@requests/api";
import apiToken from "@requests/apiToken";

// Iniciar sesión
export const login = (email, password) =>
	api.post("/api/v1/auth/login/", { email, password }, { encrypt: true });

// Cerrar sesión
export const logout = () => apiToken.post("/api/v1/auth/logout/");

// Renovar sesión por cookies HttpOnly
export const refreshSession = () => api.post('/api/v1/auth/refresh/');

// Obtener perfil/configuración inicial del usuario
export const getUserConfiguration = () => api.get('/api/v1/user/configurations/');

// Registrarse como nuevo usuario
export const register = (payload) =>
	api.post('/api/v1/auth/register/', payload, { encrypt: true });

// Verificar cuenta desde token de correo
export const verifyAccount = (token) =>
	api.post('/api/v1/auth/verify-account/', { token }, { encrypt: true });