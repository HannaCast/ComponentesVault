import { Route } from 'react-router-dom';
import { UserLayout } from '../../modules/user/layout/UserLayout';

const UserHomePage = () => <div>Panel Usuario — próximamente</div>;
const UserPlaceholderPage = () => <div>Módulo de usuario — próximamente</div>;

// Elemento de rutas de usuario para ser compuesto desde el router principal.
export const userRoutes = (
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
);
