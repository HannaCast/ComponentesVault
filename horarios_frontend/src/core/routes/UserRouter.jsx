import { Route } from 'react-router-dom';
import { UserLayout } from '../../modules/user/layout/UserLayout';
import { SubjectsPage } from '../../modules/user/features/subjects/pages/SubjectsPage';
import { TeachersPage } from '../../modules/user/features/teachers/pages/TeachersPage';
import { AccountSettingsPage } from '../../modules/user/features/settings/pages/AccountSettingsPage';
import { ScheduleGeneratorPage } from '../../modules/user/features/scheduleGenerator/pages/ScheduleGeneratorPage';
import { ScheduleVersionDetailPage } from '../../modules/user/features/scheduleGenerator/pages/ScheduleVersionDetailPage';
import { CareersPage } from '../../modules/user/features/careers/pages/CareersPage';
import { GroupsPage } from '../../modules/user/features/groups/pages/GroupsPage';
import { ClassroomsPage } from '../../modules/user/features/classrooms/pages/ClassroomsPage';
import { UniversitiesPage } from '../../modules/user/features/universities/pages/UniversitiesPage';

const UserHomePage = () => <div>Panel Usuario — próximamente</div>;
const UserPlaceholderPage = () => <div>Módulo de usuario — próximamente</div>;

// Elemento de rutas de usuario para ser compuesto desde el router principal.
export const userRoutes = (
  <Route path="/usuario" element={<UserLayout />}>
    <Route index element={<UserHomePage />} />
    <Route path="universidad/generar-horario" element={<ScheduleGeneratorPage />} />
    <Route path="universidad/generar-horario/ver/:versionId" element={<ScheduleVersionDetailPage />} />
    <Route path="universidades" element={<UniversitiesPage />} />
    <Route path="universidad/carreras" element={<CareersPage />} />
    <Route path="universidad/materias" element={<SubjectsPage />} />
    <Route path="universidad/materias/crear" element={<UserPlaceholderPage />} />
    <Route path="universidad/materias/editar/:id" element={<UserPlaceholderPage />} />
    <Route path="universidad/grupos" element={<GroupsPage />} />
    <Route path="universidad/profesores" element={<TeachersPage />} />
    <Route path="universidad/aulas" element={<ClassroomsPage />} />
    <Route path="ajustes" element={<AccountSettingsPage />} />
  </Route>
);
