import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, GraduationCap } from 'lucide-react';
import { useAuth } from '../../../core/context/AuthContext';
import { ActionButton } from '@shared/components/inputs/ActionButton';

// Componente de encabezado principal de la aplicación, que muestra el título, rol del usuario y un botón para cerrar sesión.
/**
 * Header principal de la aplicacion.
 * Props:
 * - className: clases adicionales para personalizacion externa.
 */
export const Header = ({ className = '' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const roleLabel = String(user?.role || '').toLowerCase().includes('admin')
    ? 'Administrador'
    : 'Usuario Normal';
  const secondaryLabel = user?.selected_university?.short_name
    || user?.selected_university?.name
    || 'Sesión activa';

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

  return (
    <header
      className={`border-b px-5 py-4 border-[var(--border-subtle)] bg-[var(--bg-elevated)] ${className}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--accent)] text-[var(--text-on-accent)]">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-semibold truncate text-[var(--text-primary)]">
              Sistema de Horarios Académicos
            </p>
            <p className="text-sm truncate text-[var(--text-secondary)]">
              Gestión de horarios universitarios
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-[var(--text-primary)]">{roleLabel}</p>
            <p className="text-xs text-[var(--text-secondary)]">{secondaryLabel}</p>
          </div>

          <ActionButton
            icon={LogOut}
            label="Cerrar Sesión"
            loadingLabel="Cerrando Sesión..."
            onClick={handleLogout}
            variant="secondary"
            size="small"
            fullWidth={false}
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
    </header>
  );
};