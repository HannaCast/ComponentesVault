import { createContext, useContext, useState, useEffect } from 'react';
import api from '../request/api';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Bootstrap de sesión usando cookies HttpOnly.
  useEffect(() => {
    const bootstrap = async () => {
      try {
        // Si access cookie sigue viva, my-info funcionará directo.
        const me = await api.get('/api/v1/auth/my-info/');
        setUser({
          id: me.data.data.id,
          role: me.data.data.role,
        });
      } catch {
        try {
          // Si access expiró pero refresh sigue viva, renueva y vuelve a consultar my-info.
          await api.post('/api/v1/auth/refresh/');
          const me = await api.get('/api/v1/auth/my-info/');
          setUser({
            id: me.data.data.id,
            role: me.data.data.role,
          });
        } catch {
          setUser(null);
        }
      } finally {
        setAuthLoading(false);
      }
    };

    bootstrap();
  }, []);

  // Devuelve { id, role } en éxito, null en fallo
  const login = async (email, password) => {
    try {
      const { data } = await api.post('/api/v1/auth/login/', { email, password });
      if (data.data?.user) {
        const userData = data.data.user;
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
