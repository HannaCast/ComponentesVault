import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Landing } from '../../modules/auth/pages/Landing';
import { Login } from '../../modules/auth/pages/Login';
import { useAuth } from '../context/AuthContext';
import { AdminLayout } from '../../modules/admin/layout/AdminLayout';
import { UserLayout } from '../../modules/user/layout/UserLayout';

// Placeholders — reemplazar con los componentes reales cuando estén listos
const RegistroPage = () => <div>Registro — próximamente</div>;
const AdminHomePage = () => <div>Panel Admin — próximamente</div>;
const AdminBitacoraPage = () => <div>Bitácora — próximamente</div>;
const UserHomePage = () => <div>Panel Usuario — próximamente</div>;
const UserPlaceholderPage = () => <div>Módulo de usuario — próximamente</div>;
const NotFound = () => <div>404 — Página no encontrada</div>;

const getHomePathByRole = (role) => {
  const normalizedRole = String(role || '').toLowerCase();
  return normalizedRole.includes('admin') ? '/admin' : '/user';
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
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminHomePage />} />
              <Route path="bitacora" element={<AdminBitacoraPage />} />
            </Route>
          </Route>

          <Route element={<RequireRole role="user" />}>
            <Route path="/usuario" element={<UserLayout />}>
              <Route index element={<UserHomePage />} />
              <Route path="generar-horario" element={<UserPlaceholderPage />} />
              <Route path="universidades" element={<UserPlaceholderPage />} />
              <Route path="carreras" element={<UserPlaceholderPage />} />
              <Route path="materias" element={<UserPlaceholderPage />} />
              <Route path="grupos" element={<UserPlaceholderPage />} />
              <Route path="profesores" element={<UserPlaceholderPage />} />
              <Route path="aulas" element={<UserPlaceholderPage />} />
              <Route path="ajustes" element={<UserPlaceholderPage />} />
            </Route>
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};
