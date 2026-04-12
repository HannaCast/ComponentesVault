import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLogin } from '../hooks/useLogin';
import { AuthTopBar } from '../components/AuthTopBar';
import Input from '@shared/components/inputs/InputText';
import { ActionButton } from '@shared/components/inputs/ActionButton';

const installLoginFonts = () => {
  const fontLinks = [
    {
      id: 'login-google-fonts-main',
      href: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap'
    },
    {
      id: 'login-google-fonts-material',
      href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap'
    }
  ];

  fontLinks.forEach((linkData) => {
    if (!document.getElementById(linkData.id)) {
      const link = document.createElement('link');
      link.id = linkData.id;
      link.rel = 'stylesheet';
      link.href = linkData.href;
      document.head.appendChild(link);
    }
  });

  if (!document.getElementById('login-material-symbols-style')) {
    const style = document.createElement('style');
    style.id = 'login-material-symbols-style';
    style.textContent = `.material-symbols-outlined {
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    }`;
    document.head.appendChild(style);
  }
};

const applySystemThemeToRoot = () => {
  const root = document.documentElement;
  root.dataset.theme = 'light';
  root.dataset.themeMode = 'light';
  root.dataset.systemTheme = 'academic';
};

const INPUT_LABEL_STYLE = {
  fontFamily: 'Manrope, sans-serif',
};

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isNavigatingToRegister, setIsNavigatingToRegister] = useState(false);
  const { loading, error, loginUser } = useLogin();

  useEffect(() => {
    installLoginFonts();
    applySystemThemeToRoot();

    return () => {
      delete document.documentElement.dataset.systemTheme;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await loginUser(email, password);
  };

  const handleRegisterNavigation = (event) => {
    event.preventDefault();

    if (isNavigatingToRegister) {
      return;
    }

    setIsNavigatingToRegister(true);
    navigate('/registro');
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--bg-base)] text-[var(--text-primary)]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <AuthTopBar showActionButton={false} showNavigation={false} logoClickable logoHref="/" />

      <main className="relative flex min-h-screen flex-grow items-center justify-center overflow-hidden px-4 pt-24 pb-12">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-[10%] -right-[5%] h-[40%] w-[40%] rounded-full bg-[var(--accent-subtle)] opacity-60 blur-3xl" />
          <div className="absolute -bottom-[5%] -left-[5%] h-[30%] w-[30%] rounded-full bg-[var(--accent-subtle)] opacity-40 blur-3xl" />
        </div>

        <div className="z-10 w-full max-w-[440px]">
          <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-8 shadow-[0_12px_32px_-4px_rgba(25,27,35,0.06)] md:p-12">
            <div className="mb-8 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--accent)]">
                <span className="material-symbols-outlined text-3xl text-[var(--text-on-accent)]">school</span>
              </div>
              <h1 className="mb-2 text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Sistema de Horarios Académicos
              </h1>
              <p className="text-[var(--text-secondary)]">Inicia sesión para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Correo Electrónico"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                required
                colorVariant="default"
                labelStyle={INPUT_LABEL_STYLE}
              />

              <Input
                label="Contraseña"
                type="password"
                enablePasswordToggle
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                colorVariant="default"
                labelStyle={INPUT_LABEL_STYLE}
              />

              {error && (
                <div
                  className="rounded-xl px-4 py-3 text-sm"
                  style={{
                    border: '1px solid var(--error-border, #fecaca)',
                    backgroundColor: 'var(--error-subtle, #fef2f2)',
                    color: 'var(--error, #dc2626)',
                  }}
                >
                  {error}
                </div>
              )}

              <ActionButton
                type="submit"
                label="Iniciar Sesión"
                loading={loading}
                loadingLabel="Iniciando sesión..."
                disabled={loading}
                variant="default"
                className="shadow-lg shadow-[var(--accent-subtle)]"
              />
            </form>

            <div className="mt-6 text-center">
              <p className="text-[var(--text-secondary)]">
                ¿No tienes cuenta?{' '}
                <Link
                  to="/registro"
                  onClick={handleRegisterNavigation}
                  className="font-medium text-[var(--accent)] hover:underline"
                >
                  {isNavigatingToRegister ? 'Cargando...' : 'Regístrate aquí'}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
