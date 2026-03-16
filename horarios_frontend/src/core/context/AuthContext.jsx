import { createContext, useContext, useEffect, useState } from 'react';
import {
  login as loginApi,
  logout as logoutApi,
  refreshSession,
  getUserConfiguration,
} from '../../modules/auth/api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const restoreSession = async () => {
    try {
      // Si access cookie sigue viva, my-info funcionara directo.
      const initialData = await getUserConfiguration();
      const userData = {
        id: initialData.data.data.id,
        role: initialData.data.data.role_name,
        selected_university: initialData.data.data.selected_university,
      };
      setUser(userData);
      return userData;
    } catch {
      try {
        // Si access expiro pero refresh sigue viva, renueva y vuelve a consultar configuracion.
        await refreshSession();
        const initialData = await getUserConfiguration();
        const userData = {
          id: initialData.data.data.id,
          role: initialData.data.data.role_name,
          selected_university: initialData.data.data.selected_university,
        };
        setUser(userData);
        return userData;
      } catch {
        setUser(null);
        return null;
      }
    }
  };

  useEffect(() => {
    const pathname = window.location.pathname;
    const isPrivateRoute = pathname.startsWith('/admin') || pathname.startsWith('/usuario');

    if (!isPrivateRoute) {
      setAuthLoading(false);
      return;
    }

    const bootstrap = async () => {
      try {
        await restoreSession();
      } finally {
        setAuthLoading(false);
      }
    };

    bootstrap();
  }, []);

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
    try {
      await logoutApi();
    } catch {
      // No-op: limpiamos estado local de todos modos.
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, authLoading, restoreSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
