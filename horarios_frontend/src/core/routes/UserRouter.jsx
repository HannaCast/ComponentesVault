import { Route } from 'react-router-dom';
import { UserLayout } from '../../modules/user/layout/UserLayout';
import { SubjectsPage } from '../../modules/user/features/subjects/pages/SubjectsPage';
import { AccountSettingsPage } from '../../modules/user/features/settings/pages/AccountSettingsPage';

const UserHomePage = () => <div>Panel Usuario — próximamente</div>;
const UserPlaceholderPage = () => <div>Módulo de usuario — próximamente</div>;

// Elemento de rutas de usuario para ser compuesto desde el router principal.
export const userRoutes = (
  <Route path="/usuario" element={<UserLayout />}>
    <Route index element={<UserHomePage />} />
    <Route path="universidad/generar-horario" element={<UserPlaceholderPage />} />
    <Route path="universidades" element={<UserPlaceholderPage />} />
    <Route path="universidad/carreras" element={<UserPlaceholderPage />} />
    <Route path="universidad/materias" element={<SubjectsPage />} />
    <Route path="universidad/materias/crear" element={<UserPlaceholderPage />} />
    <Route path="universidad/materias/editar/:id" element={<UserPlaceholderPage />} />
    <Route path="universidad/grupos" element={<UserPlaceholderPage />} />
    <Route path="universidad/profesores" element={<UserPlaceholderPage />} />
    <Route path="universidad/aulas" element={<UserPlaceholderPage />} />
    <Route path="ajustes" element={<AccountSettingsPage />} />
  </Route>
);
