import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Landing } from '../../modules/auth/pages/Landing';
import { Login } from '../../modules/auth/pages/Login';
import { Register } from '../../modules/auth/pages/Register';
import { VerifyAccount } from '../../modules/auth/pages/VerifyAccount';
import { useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { adminRoutes } from './AdminRouter';
import { userRoutes } from './UserRouter';
import { AppLoadingScreen } from '@shared/pages/AppLoadingScreen';
import { AppNotFoundScreen } from '@shared/pages/AppNotFoundScreen';

const getHomePathByRole = (role) => {
  const normalizedRole = String(role || '').toLowerCase();
  return normalizedRole.includes('admin') ? '/admin' : '/usuario';
};

const RequireAuth = () => {
  const { user, authLoading } = useAuth();

  if (authLoading) return <AppLoadingScreen message="Cargando..." />;
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

RequireRole.propTypes = {
  role: PropTypes.oneOf(['admin', 'user']).isRequired,
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

  if (authLoading) {
    return <AppLoadingScreen message="Verificando sesion..." />;
  }
  if (user) return <Navigate to={getHomePathByRole(user.role)} replace />;
  return children;
};

RequireGuest.propTypes = {
  children: PropTypes.node,
};

const NotFoundRoute = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const destination = user ? getHomePathByRole(user?.role) : '/';
  const buttonLabel = user ? 'Ir a mi inicio' : 'Ir a la landing';

  return (
    <AppNotFoundScreen
      buttonLabel={buttonLabel}
      onButtonClick={() => navigate(destination, { replace: true })}
    />
  );
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
        <Route
          path="/registro"
          element={(
            <RequireGuest>
              <Register />
            </RequireGuest>
          )}
        />
        <Route path="/verificar-cuenta" element={<VerifyAccount />} />

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
        <Route path="*" element={<NotFoundRoute />} />
      </Routes>
    </BrowserRouter>
  );
};
