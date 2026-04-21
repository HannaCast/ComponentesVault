import {
  Calendar,
  GraduationCap,
  BookOpen,
  Users,
  UserCheck,
  Building2,
  Settings,
  School,
  LayoutDashboard,
} from 'lucide-react';

/**
 * Items del menú de usuario (sidebar y panel de acceso rápido).
 * Mantener paths alineados con UserRouter.
 */
export const USER_MENU_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/usuario/dashboard' },
  { icon: Calendar, label: 'Generar horario', path: '/usuario/universidad/generar-horario' },
  { icon: School, label: 'Universidades', path: '/usuario/universidades' },
  { icon: Building2, label: 'Aulas', path: '/usuario/universidad/aulas' },
  { icon: UserCheck, label: 'Profesores', path: '/usuario/universidad/profesores' },
  { icon: GraduationCap, label: 'Carreras', path: '/usuario/universidad/carreras' },
  { icon: BookOpen, label: 'Materias', path: '/usuario/universidad/materias' },
  { icon: Users, label: 'Grupos', path: '/usuario/universidad/grupos' },
  { icon: Settings, label: 'Ajustes', path: '/usuario/ajustes' },
];
