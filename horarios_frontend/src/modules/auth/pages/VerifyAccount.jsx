import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, CircleX, Loader2 } from 'lucide-react';
import { AuthTopBar } from '../components/AuthTopBar';
import { useVerifyAccount } from '../hooks/useVerifyAccount';
import { ActionButton } from '@shared/components/inputs/ActionButton';

const installVerifyFonts = () => {
  const fontLinks = [
    {
      id: 'verify-google-fonts-main',
      href: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap'
    },
    {
      id: 'verify-google-fonts-material',
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
};

const applySystemThemeToRoot = () => {
  const root = document.documentElement;
  root.dataset.theme = 'light';
  root.dataset.themeMode = 'light';
  root.dataset.systemTheme = 'academic';
};

export const VerifyAccount = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { status, message, verifyToken } = useVerifyAccount();
  const verificationToken =
    searchParams.get('token')
    || searchParams.get('verifyToken')
    || '';

  useEffect(() => {
    installVerifyFonts();
    applySystemThemeToRoot();

    verifyToken(verificationToken);

    return () => {
      delete document.documentElement.dataset.systemTheme;
    };
  }, [verificationToken, verifyToken]);

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const isLoading = status === 'loading' || status === 'idle';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--bg-base)] text-[var(--text-primary)]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <AuthTopBar showActionButton={false} showNavigation={false} logoClickable logoHref="/" />

      <main className="relative flex min-h-screen flex-grow items-center justify-center overflow-hidden px-4 pt-24 pb-12">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-[10%] -right-[5%] h-[40%] w-[40%] rounded-full bg-[var(--accent-subtle)] opacity-60 blur-3xl" />
          <div className="absolute -bottom-[5%] -left-[5%] h-[30%] w-[30%] rounded-full bg-[var(--accent-subtle)] opacity-40 blur-3xl" />
        </div>

        <div className="z-10 w-full max-w-[520px]">
          <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-8 text-center shadow-[0_12px_32px_-4px_rgba(25,27,35,0.06)] md:p-12">
            {isLoading ? (
              <div className="space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-subtle)] text-[var(--accent)]">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
                <h1 className="text-2xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Verificando cuenta
                </h1>
                <p className="text-[var(--text-secondary)]">Estamos validando tu código de verificación...</p>
              </div>
            ) : null}

            {isSuccess ? (
              <div className="space-y-5">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Cuenta verificada
                  </h1>
                  <p className="text-[var(--text-secondary)]">
                    {message || 'Tu cuenta ya fue verificada. Ahora puedes iniciar sesión.'}
                  </p>
                </div>

                <ActionButton
                  type="button"
                  onClick={handleGoToLogin}
                  label="Ir a iniciar sesión"
                  variant="default"
                  className="shadow-lg shadow-[var(--accent-subtle)]"
                />
              </div>
            ) : null}

            {isError ? (
              <div className="space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                  <CircleX className="h-8 w-8" />
                </div>
                <h1 className="text-2xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  No se pudo verificar la cuenta
                </h1>
                <p className="text-[var(--text-secondary)]">{message || 'El código no es válido o ya expiró.'}</p>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
};
