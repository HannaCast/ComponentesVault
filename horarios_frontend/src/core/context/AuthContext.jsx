import PropTypes from 'prop-types';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { buildRequestSignature, useRequestDeduper } from '@shared/hooks/useRequestDeduper';
import {
  login as loginApi,
  logout as logoutApi,
  refreshSession,
  getUserConfiguration,
} from '../../modules/auth/api/authApi';

const AuthContext = createContext(null);

const extractDataFromResponse = (response) => ({
  id: response.data.data.id,
  role: response.data.data.role_name,
  selected_university: response.data.data.selected_university,
  selected_university_active_period_id: response.data.data.selected_university_active_period_id || null,
  selected_university_active_period_name: response.data.data.selected_university_active_period_name || null,
  theme: response.data.data.theme || 'light',
  accent: response.data.data.accent || 'blue',
  schedule_generation: response.data.data.schedule_generation || {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const userRef = useRef(null);
  const restoreSessionPromiseRef = useRef(null);
  const { shouldRun: shouldRunRestoreSession } = useRequestDeduper({ windowMs: 220 });

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const restoreSession = useCallback(async () => {
    if (restoreSessionPromiseRef.current) {
      return restoreSessionPromiseRef.current;
    }

    const requestSignature = buildRequestSignature(
      { resource: 'auth-restore-session' },
      ['resource'],
    );

    if (!shouldRunRestoreSession(requestSignature)) {
      return userRef.current;
    }

    restoreSessionPromiseRef.current = (async () => {
      try {
        // Si access cookie sigue viva, my-info funcionara directo.
        const initialData = await getUserConfiguration();
        const userData = extractDataFromResponse(initialData);
        setUser(userData);
        return userData;
      } catch {
        try {
          // Si access expiro pero refresh sigue viva, renueva y vuelve a consultar configuracion.
          await refreshSession();
          const initialData = await getUserConfiguration();
          const userData = extractDataFromResponse(initialData);
          setUser(userData);
          return userData;
        } catch {
          setUser(null);
          return null;
        }
      }
    })();

    try {
      return await restoreSessionPromiseRef.current;
    } finally {
      restoreSessionPromiseRef.current = null;
    }
  }, [shouldRunRestoreSession]);

  useEffect(() => {
    const pathname = globalThis.location.pathname;
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
  }, [restoreSession]);

  const login = useCallback(async (email, password) => {
    const { data } = await loginApi(email, password);
    if (data.data?.user) {
      const initialData = await getUserConfiguration();
      const userData = extractDataFromResponse(initialData);
      setUser(userData);
      return userData;
    }
    return null;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch (error) {
      // Mantiene el flujo de cierre local aun si falla la API remota.
      console.warn('No se pudo cerrar sesion en el servidor.', error);
    }
    setUser(null);
  }, []);

  const contextValue = useMemo(
    () => ({ user, login, logout, authLoading, restoreSession }),
    [user, login, logout, authLoading, restoreSession],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node,
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
