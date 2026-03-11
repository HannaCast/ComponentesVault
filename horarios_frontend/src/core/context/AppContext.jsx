import { createContext, useContext, useState, useEffect } from 'react';
import api from '../request/api';
import { setAccessToken, clearAccessToken } from '../request/tokenStore';

const AppContext = createContext(null);

const decodeUser = (access) => {
  const payload = JSON.parse(atob(access.split('.')[1]));
  return { id: payload.id, role: payload.role };
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Silent refresh al montar — si ya hay token en sessionStorage lo usa directamente,
  // si no (pestaña nueva / primera vez) pide uno nuevo con la HttpOnly cookie.
  useEffect(() => {
    const existing = getAccessToken();
    if (existing) {
      setUser(decodeUser(existing));
      setAuthLoading(false);
      return;
    }

    api.post('/api/v1/auth/refresh/')
      .then(({ data }) => {
        setAccessToken(data.data.access);
        setUser(decodeUser(data.data.access));
      })
      .catch(() => {}) // sin cookie = sin sesión, es normal
      .finally(() => setAuthLoading(false));
  }, []);

  // Devuelve { id, role } en éxito, null en fallo
  const login = async (email, password) => {
    try {
      const { data } = await api.post('/api/v1/auth/login/', { email, password });
      if (data.data?.access) {
        setAccessToken(data.data.access);
        const userData = decodeUser(data.data.access);
        setUser(userData);
        return userData;
      }
      return null;
    } catch {
      return null;
    }
  };

  const logout = async () => {
    try { await api.post('/api/v1/auth/logout/'); } catch {}
    clearAccessToken();
    setUser(null);
  };

  return (
    <AppContext.Provider value={{ user, login, logout, authLoading }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider');
  return ctx;
};
