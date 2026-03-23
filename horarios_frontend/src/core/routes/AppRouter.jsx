import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Landing } from '../../modules/auth/pages/Landing';
import { Login } from '../../modules/auth/pages/Login';
import { useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { adminRoutes } from './AdminRouter';
import { userRoutes } from './UserRouter';

// Placeholders — reemplazar con los componentes reales cuando estén listos
const RegistroPage = () => <div>Registro — próximamente</div>;
const NotFound = () => <div>404 — Página no encontrada</div>;

const getHomePathByRole = (role) => {
  const normalizedRole = String(role || '').toLowerCase();
  return normalizedRole.includes('admin') ? '/admin' : '/usuario';
};

const RequireAuth = () => {
  const { user, authLoading } = useAuth();

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
};

const RequireRole = ({ role }) => {
  const { user } = useAuth();
  const normalizedRole = String(user?.role || '').toLowerCase();
  const isAdmin = normalizedRole.includes('admin');

  if (role === 'admin' && !isAdmin) {
    return <Navigate to={getHomePathByRole(user?.role)} replace />;
  }

  if (role === 'user' && isAdmin) {
    return <Navigate to={getHomePathByRole(user?.role)} replace />;
  }

  return <Outlet />;
};

const UserThemeGate = () => {
  const { user } = useAuth();
  const { applyTheme } = useTheme();

  useEffect(() => {
    applyTheme(user?.theme, user?.accent);
  }, [user?.theme, user?.accent, applyTheme]);

  return <Outlet />;
};

const UserThemeScope = () => (
  <ThemeProvider>
    <UserThemeGate />
  </ThemeProvider>
);

const RequireGuest = ({ children }) => {
  const { user, authLoading, restoreSession } = useAuth();
  const [checkingSession, setCheckingSession] = useState(false);
  const hasCheckedSessionRef = useRef(false);

  useEffect(() => {
    // Si ya estamos cargando, tenemos un usuario o ya hemos verificado la sesión, no hacemos nada
    if (authLoading || user || checkingSession || hasCheckedSessionRef.current) return;

    let mounted = true;
    hasCheckedSessionRef.current = true;

    const check = async () => {
      setCheckingSession(true);
      try {
        await restoreSession();
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    };

    check();
    return () => {
      mounted = false;
    };
  }, [authLoading, user, checkingSession, restoreSession]);

  if (authLoading) return children;
  if (user) return <Navigate to={getHomePathByRole(user.role)} replace />;
  return children;
};

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<Landing />} />
        <Route
          path="/login"
          element={(
            <RequireGuest>
              <Login />
            </RequireGuest>
          )}
        />
        <Route path="/registro" element={<RegistroPage />} />

        {/* Privadas */}
        <Route element={<RequireAuth />}>
          <Route element={<RequireRole role="admin" />}>
            {adminRoutes}
          </Route>

          <Route element={<RequireRole role="user" />}>
            <Route element={<UserThemeScope />}>
              {userRoutes}
            </Route>
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};
