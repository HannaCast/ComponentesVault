import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Landing } from '../../modules/auth/pages/Landing';

// Placeholders — reemplazar con los componentes reales cuando estén listos
const LoginPage = () => <div>Login — próximamente</div>;
const RegistroPage = () => <div>Registro — próximamente</div>;
const AdminPage = () => <div>Panel Admin — próximamente</div>;
const UserPage = () => <div>Panel Usuario — próximamente</div>;
const NotFound = () => <div>404 — Página no encontrada</div>;

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegistroPage />} />

        {/* Admin */}
        <Route path="/admin/*" element={<AdminPage />} />

        {/* Usuario */}
        <Route path="/user/*" element={<UserPage />} />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};
