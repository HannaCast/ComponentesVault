import PropTypes from 'prop-types';
import { ActionButton } from '@shared/components/inputs/ActionButton';

export const AuthTopBar = ({
  showActionButton = true,
  showNavigation = false,
  logoClickable = true,
  logoHref = '/',
  actionLabel = 'Iniciar Sesion',
  actionLoadingLabel = 'Cargando...',
  isActionLoading = false,
  actionDisabled = false,
  onActionClick,
}) => {
  const isDisabled = actionDisabled || isActionLoading;

  return (
    <header className="fixed top-0 z-50 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {logoClickable ? (
          <a
            href={logoHref}
            className="flex cursor-pointer items-center gap-2 rounded-lg transition-opacity hover:opacity-90"
            aria-label="Ir a la landing"
          >
            <span className="material-symbols-outlined text-[32px] text-[var(--accent)]">account_balance</span>
            <span
              className="bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] bg-clip-text text-xl font-extrabold tracking-tighter text-transparent md:text-2xl"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              EduSchedule
            </span>
          </a>
        ) : (
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[32px] text-[var(--accent)]">account_balance</span>
            <span
              className="bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] bg-clip-text text-xl font-extrabold tracking-tighter text-transparent md:text-2xl"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              EduSchedule
            </span>
          </div>
        )}

        {showNavigation ? (
          <nav className="hidden items-center gap-8 md:flex">
            <a className="border-b-2 border-[var(--accent)] font-semibold text-[var(--accent)] transition-colors" href="/#inicio">Inicio</a>
            <a className="rounded px-2 py-1 text-[var(--text-secondary)] transition-colors hover:bg-[var(--accent-subtle)]" href="/#funciones">Funciones</a>
            <a className="rounded px-2 py-1 text-[var(--text-secondary)] transition-colors hover:bg-[var(--accent-subtle)]" href="/#cta">Precios</a>
          </nav>
        ) : (
          <div className="hidden md:block" aria-hidden="true" />
        )}

        {showActionButton ? (
          <ActionButton
            type="button"
            onClick={onActionClick}
            label={actionLabel}
            loading={isActionLoading}
            loadingLabel={actionLoadingLabel}
            disabled={isDisabled}
            variant="default"
            fullWidth={false}
            size="medium"
            className="rounded-xl shadow-md"
          />
        ) : (
          <div className="w-[98px] sm:w-[130px]" aria-hidden="true" />
        )}
      </div>
    </header>
  );
};

AuthTopBar.propTypes = {
  showActionButton: PropTypes.bool,
  showNavigation: PropTypes.bool,
  logoClickable: PropTypes.bool,
  logoHref: PropTypes.string,
  actionLabel: PropTypes.string,
  actionLoadingLabel: PropTypes.string,
  isActionLoading: PropTypes.bool,
  actionDisabled: PropTypes.bool,
  onActionClick: PropTypes.func,
};
