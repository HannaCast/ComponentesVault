import { Link, useLocation } from 'react-router-dom';
import {
  Calendar,
  GraduationCap,
  BookOpen,
  Users,
  UserCheck,
  Building2,
  Settings,
  School,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../../core/context/AuthContext';

/**
 * Sidebar principal de navegacion.
 * Props:
 * - collapsed: muestra menu compacto.
 * - className: clases adicionales.
 */
export const Sidebar = ({ collapsed = false, className = '' }) => {
  const location = useLocation();
  const { user } = useAuth();

  const menuItemsUser = [
    { icon: Calendar, label: 'Generar Horario', path: '/usuario/generar-horario' },
    { icon: School, label: 'Universidades', path: '/usuario/universidades' },
    { icon: GraduationCap, label: 'Carreras', path: '/usuario/carreras' },
    { icon: BookOpen, label: 'Materias', path: '/usuario/materias' },
    { icon: Users, label: 'Grupos', path: '/usuario/grupos' },
    { icon: UserCheck, label: 'Profesores', path: '/usuario/profesores' },
    { icon: Building2, label: 'Aulas', path: '/usuario/aulas' },
    { icon: Settings, label: 'Ajustes', path: '/usuario/ajustes' },
  ];

  const menuItemsAdmin = [
    { icon: FileText, label: 'Bitácora', path: '/admin/bitacora' },
  ];

  const menuItems = user?.role === 'admin' ? menuItemsAdmin : menuItemsUser;

  const isItemActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <aside
      className={`h-full border-r border-[var(--border-subtle)] bg-[var(--bg-base)] ${collapsed ? 'w-20' : 'w-72'} ${className}`}
    >
      <nav className="p-3">
        <ul className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item.path);

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center ${collapsed ? 'justify-center' : 'justify-start'} gap-3 px-3 py-2.5 rounded-lg transition-colors border ${
                    isActive
                      ? 'bg-[var(--accent-subtle)] text-[var(--accent)] border-[var(--border-strong)]'
                      : 'text-[var(--text-primary)] border-transparent hover:bg-[var(--bg-elevated)] hover:border-[var(--border-subtle)]'
                  }`}
                  title={collapsed ? item.label : undefined}
                  aria-label={item.label}
                >
                  <Icon className="w-5 h-5" />
                  {!collapsed && <span className="truncate text-sm font-medium">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};