import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/context/AuthContext';
import { AuthTopBar } from '../components/AuthTopBar';
import { ActionButton } from '@shared/components/inputs/ActionButton';

const getHomePathByRole = (role) => {
  const normalizedRole = String(role || '').toLowerCase();
  return normalizedRole.includes('admin') ? '/admin' : '/usuario';
};

const installLandingFonts = () => {
  const fontLinks = [
    {
      id: 'landing-google-fonts-main',
      href: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap'
    },
    {
      id: 'landing-google-fonts-material',
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

  if (!document.getElementById('landing-material-symbols-style')) {
    const style = document.createElement('style');
    style.id = 'landing-material-symbols-style';
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

const featureCards = [
  {
    icon: 'auto_schedule',
    iconBg: 'var(--accent-subtle, #eff6ff)',
    iconColor: 'var(--accent, #2563eb)',
    title: 'Generacion Automatica',
    description: 'Algoritmos avanzados que resuelven conflictos de horario en segundos.'
  },
  {
    icon: 'school',
    iconBg: 'var(--accent-subtle, #eff6ff)',
    iconColor: 'var(--accent, #2563eb)',
    title: 'Gestion Completa',
    description: 'Administra facultades, departamentos y aulas desde un solo lugar.'
  },
  {
    icon: 'speed',
    iconBg: 'var(--accent-subtle, #eff6ff)',
    iconColor: 'var(--accent, #2563eb)',
    title: 'Rapido y Eficiente',
    description: 'Reduce el tiempo de planificacion de semanas a solo minutos.'
  },
  {
    icon: 'tune',
    iconBg: 'var(--accent-subtle, #eff6ff)',
    iconColor: 'var(--accent, #2563eb)',
    title: 'Control Total',
    description: 'Ajusta manualmente cualquier detalle con nuestra interfaz drag-and-drop.'
  },
  {
    icon: 'timer',
    iconBg: 'var(--accent-subtle, #eff6ff)',
    iconColor: 'var(--accent, #2563eb)',
    title: 'Ahorra Tiempo',
    description: 'Automatiza las tareas repetitivas y enfocate en la estrategia academica.'
  },
  {
    icon: 'security',
    iconBg: 'var(--accent-subtle, #eff6ff)',
    iconColor: 'var(--accent, #2563eb)',
    title: 'Seguro y Confiable',
    description: 'Respaldo en la nube y cifrado de datos de nivel institucional.'
  }
];

const benefits = [
  {
    title: 'Multi-Universidad',
    description: 'Gestiona multiples sedes y campus desde un perfil centralizado.'
  },
  {
    title: 'Disponibilidad del Profesorado',
    description: 'Captura preferencias horarias directamente desde los docentes.'
  },
  {
    title: 'Asignacion Inteligente',
    description: 'Equilibra grupos y asignaturas basandose en perfiles y capacidades.'
  }
];

export const Landing = () => {
  const navigate = useNavigate();
  const { user, restoreSession } = useAuth();
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    installLandingFonts();
    applySystemThemeToRoot();

    return () => {
      delete document.documentElement.dataset.systemTheme;
    };
  }, []);

  const handleLoginNavigation = async () => {
    if (pendingAction) {
      return;
    }

    setPendingAction('login');

    if (user) {
      navigate(getHomePathByRole(user.role));
      return;
    }

    try {
      const restoredUser = await restoreSession();
      if (restoredUser) {
        navigate(getHomePathByRole(restoredUser.role));
        return;
      }
    } catch {
      // Ante error de restauracion, se permite continuar al login.
    }

    navigate('/login');
  };

  const handleRegisterNavigation = () => {
    if (pendingAction) {
      return;
    }

    setPendingAction('register');
    navigate('/registro');
  };

  return (
    <div
      id="inicio"
      className="overflow-x-hidden bg-[var(--bg-base)] text-[var(--text-primary)]"
      style={{ fontFamily: 'Inter, sans-serif', minHeight: 'max(884px, 100dvh)' }}
    >
      <AuthTopBar
        showActionButton
        showNavigation
        logoClickable={false}
        actionLabel="Iniciar Sesion"
        actionLoadingLabel="Cargando..."
        isActionLoading={pendingAction === 'login'}
        actionDisabled={Boolean(pendingAction)}
        onActionClick={handleLoginNavigation}
      />

      <main className="pt-20">
        <section className="relative mx-auto max-w-7xl overflow-hidden px-4 pt-6 pb-12 sm:px-6 md:pt-10 md:pb-20">
          <div className="grid grid-cols-1 items-start gap-8 md:gap-12 lg:grid-cols-2">
            <div className="z-10 space-y-6 md:space-y-8">
              <div className="inline-flex items-center rounded-full bg-[var(--accent-subtle)] px-4 py-1.5 text-xs font-semibold tracking-wide text-[var(--accent)] md:text-sm">
                SISTEMA DE GESTION ACADEMICA
              </div>

              <h1
                className="text-3xl font-extrabold leading-[1.1] tracking-tighter text-[var(--text-primary)] sm:text-4xl md:text-6xl"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                Genera Horarios en <span className="text-[var(--accent)]">Minutos</span>
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-[var(--text-secondary)] md:text-lg">
                Optimiza la carga academica y coordina a tu profesorado con ayuda de los mejores algoritmos. 
                Deja de luchar con hojas de calculo y recupera tu tiempo para
                lo que importa: la educacion.
              </p>

              <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                <ActionButton
                  onClick={handleRegisterNavigation}
                  label="Comenzar Gratis"
                  loading={pendingAction === 'register'}
                  loadingLabel="Cargando..."
                  disabled={Boolean(pendingAction)}
                  variant="default"
                  size="hero"
                  fullWidth={false}
                  className="w-full rounded-xl shadow-lg hover:shadow-xl sm:w-auto"
                  customStyle={{ fontWeight: '700' }}
                />

                <ActionButton
                  onClick={handleLoginNavigation}
                  label="Iniciar Sesion"
                  loading={pendingAction === 'login'}
                  loadingLabel="Cargando..."
                  disabled={Boolean(pendingAction)}
                  variant="outline"
                  colorVariant="default"
                  size="hero"
                  fullWidth={false}
                  className="w-full rounded-xl sm:w-auto"
                  customStyle={{ fontWeight: '600' }}
                />
              </div>
            </div>

            <div className="group relative mt-2 lg:mt-0">
              <div className="absolute -inset-4 rounded-3xl bg-[var(--accent-subtle)] opacity-60 blur-3xl transition-opacity group-hover:opacity-80" />
              <div className="relative rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 shadow-2xl">
                <img
                  alt="Vista moderna de calendario academico digital"
                  className="h-auto w-full rounded-2xl object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCqhyuDDzzvMbKC_MPdS9LZUd7cYOAByfQh9lYzXSGrXwMs0kRhAOcWSuHx7htxd-zGgX07U_RW_WvbzikeOE0jO4bm-4iJ1IX5g2Nn7rKzBCINJWpVKUHjbCx_EJb4nAG0s1AgTqIKoHIPfIvdKIW_wLBirFnfw_Q3rRpsZjnBLHv5iOmO4rKpzs53BFIhw86ZsRxJNlLbhcIc718WMRI7yqS2-UGCE3L4Xcpk6xmG3oeqS2prbFeCrnKf7LL9CNpCFk1DUwK4WGg"
                />

                <div className="absolute bottom-4 left-4 flex max-w-[190px] items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 shadow-xl md:-bottom-6 md:-left-6 md:max-w-[200px] md:gap-4 md:p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--text-on-accent)] md:h-12 md:w-12">
                    <span className="material-symbols-outlined">auto_awesome</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)]">Optimizado</p>
                    <p className="text-sm font-bold">98% Eficiencia</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="funciones" className="bg-[var(--bg-surface)] py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-16 space-y-4 text-center">
              <h2
                className="text-3xl font-bold tracking-tight md:text-4xl"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                Disenado para la Excelencia
              </h2>
              <p className="mx-auto max-w-2xl text-[var(--text-secondary)]">
                Nuestra plataforma combina potencia algoritmica con una interfaz editorial
                para facilitar tu trabajo diario.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {featureCards.map((card) => (
                <article
                  key={card.title}
                  className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-6 transition-shadow hover:shadow-md sm:p-8"
                >
                  <div
                    className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: card.iconBg }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ color: card.iconColor, fontSize: '32px' }}
                    >
                      {card.icon}
                    </span>
                  </div>

                  <h3
                    className="mb-3 text-lg font-bold"
                    style={{ fontFamily: 'Manrope, sans-serif' }}
                  >
                    {card.title}
                  </h3>
                  <p className="leading-relaxed text-[var(--text-secondary)]">{card.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
          <div className="flex flex-col items-center gap-10 md:gap-16 lg:flex-row">
            <div className="order-2 flex-1 space-y-10 lg:order-1">
              <h2
                className="text-2xl font-bold leading-tight sm:text-3xl md:text-4xl"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                Potencia tu Gestion Academica
              </h2>

              <div className="space-y-6">
                {benefits.map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]">
                      <span
                        className="material-symbols-outlined text-xs text-white"
                        style={{ fontVariationSettings: "'wght' 700" }}
                      >
                        check
                      </span>
                    </div>
                    <div>
                      <p className="text-base font-bold md:text-lg">{item.title}</p>
                      <p className="text-[var(--text-secondary)]">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-1 flex-1 lg:order-2">
              <div className="relative">
                <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent-subtle)] blur-3xl" />

                <div className="relative grid grid-cols-2 gap-4">
                  <div className="transform rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 shadow-lg transition-transform md:p-6 md:hover:-translate-y-2">
                    <span className="material-symbols-outlined mb-4 text-[32px] text-[var(--accent)]">account_balance</span>
                    <h4 className="text-2xl font-bold md:text-3xl">12</h4>
                    <p className="text-sm text-[var(--text-secondary)]">Univ. Configuradas</p>
                  </div>

                  <div className="transform rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 shadow-lg transition-transform md:translate-y-8 md:p-6 md:hover:-translate-y-2">
                    <span className="material-symbols-outlined mb-4 text-[32px] text-[var(--accent)]">book</span>
                    <h4 className="text-2xl font-bold md:text-3xl">45</h4>
                    <p className="text-sm text-[var(--text-secondary)]">Materias Activas</p>
                  </div>

                  <div className="transform rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 shadow-lg transition-transform md:-translate-y-4 md:p-6 md:hover:-translate-y-2">
                    <span className="material-symbols-outlined mb-4 text-[32px] text-[var(--accent)]">calendar_month</span>
                    <h4 className="text-2xl font-bold md:text-3xl">1.2k</h4>
                    <p className="text-sm text-[var(--text-secondary)]">Horarios Generados</p>
                  </div>

                  <div className="transform rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 shadow-lg transition-transform md:translate-y-4 md:p-6 md:hover:-translate-y-2">
                    <span className="material-symbols-outlined mb-4 text-[32px] text-[var(--accent)]">check_circle</span>
                    <h4 className="text-2xl font-bold md:text-3xl">100%</h4>
                    <p className="text-sm text-[var(--text-secondary)]">Precision Logica</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="cta" className="px-4 py-16 sm:px-6 md:py-20">
          <div
            className="relative mx-auto max-w-5xl overflow-hidden rounded-[3rem] p-8 text-center shadow-2xl sm:p-10 md:p-20"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))' }}
          >
            <div
              className="absolute top-0 right-0 -mt-32 -mr-32 h-64 w-64 rounded-full blur-3xl"
              style={{ backgroundColor: 'var(--accent-subtle)', opacity: 0.5 }}
            />
            <div
              className="absolute bottom-0 left-0 -mb-32 -ml-32 h-64 w-64 rounded-full blur-3xl"
              style={{ backgroundColor: 'var(--accent-subtle)', opacity: 0.4 }}
            />

            <div className="relative z-10 space-y-8">
              <h2
                className="text-3xl font-extrabold leading-tight text-[var(--text-on-accent)] md:text-4xl"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                Listo para transformar tu administracion academica?
              </h2>

              <p className="mx-auto max-w-2xl text-base text-[var(--text-on-accent)]/85 md:text-lg">
                Unete a las instituciones lideres que ya estan ahorrando cientos de
                horas en planificacion cada semestre.
              </p>

              <ActionButton
                onClick={handleRegisterNavigation}
                label="Comenzar ahora"
                loading={pendingAction === 'register'}
                loadingLabel="Cargando..."
                disabled={Boolean(pendingAction)}
                variant="default"
                size="hero"
                fullWidth={false}
                className="w-full rounded-2xl shadow-lg hover:shadow-2xl sm:w-auto"
                customStyle={{
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--accent)',
                  fontWeight: '700',
                }}
                customHoverStyle={{
                  backgroundColor: 'var(--bg-elevated)',
                }}
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-6 px-4 py-8 sm:px-8 md:flex-row md:px-12 md:py-10">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <span
              className="text-lg font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              EduSchedule
            </span>
            <p className="text-sm text-[var(--text-secondary)]">© 2024 EduSchedule. The Academic Curator.</p>
          </div>

          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 md:justify-start">
            <button type="button" className="text-sm text-[var(--text-secondary)] opacity-80 transition-all hover:text-[var(--accent)] hover:opacity-100">Contacto</button>
            <button type="button" className="text-sm text-[var(--text-secondary)] opacity-80 transition-all hover:text-[var(--accent)] hover:opacity-100">Privacidad</button>
            <button type="button" className="text-sm text-[var(--text-secondary)] opacity-80 transition-all hover:text-[var(--accent)] hover:opacity-100">Terminos</button>
            <button type="button" className="text-sm text-[var(--text-secondary)] opacity-80 transition-all hover:text-[var(--accent)] hover:opacity-100">Ayuda</button>
          </nav>
        </div>
      </footer>
    </div>
  );
};
