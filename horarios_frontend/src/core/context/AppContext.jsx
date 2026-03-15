import { createContext, useContext, useState, useEffect } from 'react';
import {
  login as loginApi,
  logout as logoutApi,
  refreshSession,
  getUserConfiguration,
} from '../../modules/auth/api/authApi';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Bootstrap de sesión usando cookies HttpOnly.
  useEffect(() => {
    const pathname = window.location.pathname;
    const isPrivateRoute = pathname.startsWith('/admin') || pathname.startsWith('/user');

    if (!isPrivateRoute) {
      setAuthLoading(false);
      return;
    }

    const bootstrap = async () => {
      try {
        // Si access cookie sigue viva, my-info funcionará directo.
        const initialData = await getUserConfiguration();
        setUser({
          id: initialData.data.data.id,
          role: initialData.data.data.role_name,
          selected_university: initialData.data.data.selected_university,
        });
      } catch {
        try {
          // Si access expiró pero refresh sigue viva, renueva y vuelve a consultar my-info.
          await refreshSession();
          const initialData = await getUserConfiguration();
          setUser({
            id: initialData.data.data.id,
            role: initialData.data.data.role_name,
            selected_university: initialData.data.data.selected_university,
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
      const { data } = await loginApi(email, password);
      if (data.data?.user) {
        const initialData = await getUserConfiguration();
        const userData = {
          id: initialData.data.data.id,
          role: initialData.data.data.role_name,
          selected_university: initialData.data.data.selected_university,
        };
        setUser(userData);
        return userData;
      }
      return null;
    } catch {
      return null;
    }
  };

  const logout = async () => {
    try { await logoutApi(); } catch {}
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
