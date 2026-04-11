import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useLogin } from '../hooks/useLogin';
import { AuthTopBar } from '../components/AuthTopBar';

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

export const Login = () => {
  const navigate = useNavigate();
  const emailInputId = 'login-email';
  const passwordInputId = 'login-password';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
              <div className="space-y-2">
                <label
                  htmlFor={emailInputId}
                  className="ml-1 block text-sm font-semibold text-[var(--text-primary)]"
                  style={{ fontFamily: 'Manrope, sans-serif' }}
                >
                  Correo Electrónico
                </label>
                <input
                  id={emailInputId}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] transition-all duration-200 focus:border-[var(--accent)] focus:bg-[var(--bg-elevated)] focus:ring-2 focus:ring-[var(--accent-subtle)]"
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor={passwordInputId}
                  className="ml-1 block text-sm font-semibold text-[var(--text-primary)]"
                  style={{ fontFamily: 'Manrope, sans-serif' }}
                >
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id={passwordInputId}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-2.5 pr-11 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] transition-all duration-200 focus:border-[var(--accent)] focus:bg-[var(--bg-elevated)] focus:ring-2 focus:ring-[var(--accent-subtle)]"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

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

              <button
                type="submit"
                disabled={loading}
                className="w-full cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium text-[var(--text-on-accent)] shadow-lg shadow-[var(--accent-subtle)] transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent-hover))' }}
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
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
