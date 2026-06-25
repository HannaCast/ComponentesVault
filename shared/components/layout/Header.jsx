import { useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, GraduationCap, Menu, User } from 'lucide-react';
import { useAuth } from '../../../core/context/AuthContext';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import { ConfirmModal } from '@shared/components/ConfirmModal';

// Componente de encabezado principal de la aplicación, que muestra el título, rol del usuario y un botón para cerrar sesión.
/**
 * Header principal de la aplicacion.
 * Props:
 * - className: clases adicionales para personalizacion externa.
 * - onMenuClick: callback para abrir menu lateral en movil.
 */
export const Header = ({ className = '', onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const isAdmin = String(user?.role || '').toLowerCase().includes('admin');
  const roleLabel = isAdmin ? 'Administrador' : 'Usuario Normal';
  const secondaryLabel = user?.selected_university?.short_name
    || user?.selected_university?.name
    || 'Sesión activa';
  const shouldHideSessionSummary = pathname === '/usuario' || pathname.startsWith('/usuario/dashboard');

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleOpenLogoutModal = () => {
    if (isLoggingOut) return;
    setIsLogoutModalOpen(true);
  };

  return (
    <>
      <header
        className={`border-b px-3 py-3 sm:px-5 sm:py-4 border-[var(--border-subtle)] bg-[var(--bg-elevated)] ${className}`}
      >
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 min-w-0 flex-1">
          {onMenuClick ? (
            <button
              type="button"
              onClick={onMenuClick}
              className="lg:hidden h-9 w-9 rounded-lg border flex items-center justify-center shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-elevated)]"
              style={{
                borderColor: 'var(--border-default, #d1d5db)',
                color: 'var(--text-primary, #111827)',
                backgroundColor: 'var(--bg-elevated, #ffffff)',
              }}
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          ) : null}

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-[var(--accent)] text-[var(--text-on-accent)] shrink-0">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-base sm:text-xl font-semibold truncate text-[var(--text-primary)] leading-tight">
              <span className="sm:hidden">Sistema de Horarios</span>
              <span className="hidden sm:inline">Sistema de Horarios Académicos</span>
            </p>
            <p className="text-sm truncate text-[var(--text-secondary)] hidden md:block">
              Gestión de horarios universitarios
            </p>
          </div>
        </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {!shouldHideSessionSummary ? (
              <div className="text-right hidden md:block min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">{roleLabel}</p>
                <p className="text-xs text-[var(--text-secondary)] truncate">{secondaryLabel}</p>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => navigate(isAdmin ? '/admin/perfil' : '/usuario/perfil')}
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg border flex items-center justify-center shrink-0 transition-colors hover:bg-[var(--bg-surface)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-elevated)]"
              style={{
                borderColor: 'var(--border-default, #d1d5db)',
                color: 'var(--text-primary, #111827)',
                backgroundColor: 'var(--bg-elevated, #ffffff)',
              }}
              aria-label="Ver mi perfil"
              title="Mi perfil"
            >
              <User className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={handleOpenLogoutModal}
              disabled={isLoggingOut}
              className="sm:hidden h-9 w-9 rounded-lg border flex items-center justify-center disabled:opacity-60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger-500,#ef4444)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-elevated)]"
              style={{
                color: 'var(--danger-600, #dc2626)',
                borderColor: 'var(--danger-500, #ef4444)',
                backgroundColor: 'var(--bg-elevated, #ffffff)',
              }}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>

            <div className="hidden sm:block">
              <ActionButton
                icon={LogOut}
                label="Cerrar Sesión"
                loadingLabel="Cerrando Sesión..."
                onClick={handleOpenLogoutModal}
                variant="secondary"
                size="small"
                fullWidth={false}
                className="whitespace-nowrap"
                loading={isLoggingOut}
                disabled={isLoggingOut}
                customStyle={{
                  color: 'var(--danger-600, #dc2626)',
                  border: '1px solid var(--danger-500, #ef4444)',
                }}
                customHoverStyle={{
                  backgroundColor: 'var(--danger-subtle, #fef2f2)',
                  color: 'var(--danger-700, #b91c1c)',
                  borderColor: 'var(--danger-600, #dc2626)',
                }}
              />
            </div>
          </div>
        </div>
      </header>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="Confirmar cierre de sesión         "
        message="¿Seguro que quieres cerrar sesión?"
        confirmLabel="Sí, cerrar sesión"
      />
    </>
  );
};

Header.propTypes = {
  className: PropTypes.string,
  onMenuClick: PropTypes.func,
};