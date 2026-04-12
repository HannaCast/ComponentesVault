import { Navigate, Route } from 'react-router-dom';
import { AdminLayout } from '../../modules/admin/layout/AdminLayout';
import { AdminAuditPage } from '../../modules/admin/features/audit/pages/AdminAuditPage';
import { UserProfilePage } from '../../modules/user/features/settings/pages/UserProfilePage';

// Elemento de rutas admin para ser compuesto desde el router principal.
export const adminRoutes = (
  <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<Navigate to="bitacora" replace />} />
    <Route path="bitacora" element={<AdminAuditPage />} />
    <Route path="perfil" element={<UserProfilePage />} />
  </Route>
);
