import { Route } from 'react-router-dom';
import { AdminLayout } from '../../modules/admin/layout/AdminLayout';

const AdminHomePage = () => <div>Panel Admin — próximamente</div>;
const AdminBitacoraPage = () => <div>Bitácora — próximamente</div>;

// Elemento de rutas admin para ser compuesto desde el router principal.
export const adminRoutes = (
  <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<AdminHomePage />} />
    <Route path="bitacora" element={<AdminBitacoraPage />} />
  </Route>
);
