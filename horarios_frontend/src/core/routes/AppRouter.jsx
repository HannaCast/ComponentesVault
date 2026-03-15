import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Landing } from '../../modules/auth/pages/Landing';
import { Login } from '../../modules/auth/pages/Login';
import { useApp } from '@context/AppContext';

// Placeholders — reemplazar con los componentes reales cuando estén listos
const RegistroPage = () => <div>Registro — próximamente</div>;
const AdminPage = () => <div>Panel Admin — próximamente</div>;
const UserPage = () => <div>Panel Usuario — próximamente</div>;
const NotFound = () => <div>404 — Página no encontrada</div>;

const getHomePathByRole = (role) => {
  const normalizedRole = String(role || '').toLowerCase();
  return normalizedRole.includes('admin') ? '/admin' : '/user';
};

const RequireAuth = () => {
  const { user, authLoading } = useApp();

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
};

const RequireGuest = ({ children }) => {
  const { user, authLoading, restoreSession } = useApp();
  const [checkingSession, setCheckingSession] = useState(false);
  const hasCheckedSessionRef = useRef(false);

  useEffect(() => {
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

  if (authLoading || checkingSession) return null;
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
          <Route path="/admin/*" element={<AdminPage />} />
          <Route path="/user/*" element={<UserPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};
